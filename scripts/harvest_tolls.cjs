// Machii — Aspirateur des PÉAGES OFFICIELS Tunisie Autoroutes (bot ré-exécutable).
// Source : le calculateur officiel (plugin WP "naxxum-tarifs-peages"), API admin-ajax.php.
//   - ttm_get_points_by_highway  → stations (avec lat/lng)
//   - ttm_find_route             → tarif EXACT entre 2 stations d'une même autoroute (classe c1/c2/c3)
// On stocke tout dans Supabase (toll_stations + toll_matrix) → Machii ne dépend plus du site en prod.
// Ré-exécuter périodiquement pour rafraîchir (récupère un nonce frais à chaque fois).
const https = require('https');
const { Client } = require('pg');
const PG = 'postgresql://postgres.qtgqvwfzwjprclqrkfue:azeAZE123%40%2B@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';
const HOST = 'www.tunisieautoroutes.tn';
const AGENT = new https.Agent({ rejectUnauthorized: false });
const sleep = ms => new Promise(r => setTimeout(r, ms));

function once(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = { host: HOST, path, method, agent: AGENT, timeout: 20000,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*', 'Connection': 'close' } };
    if (body) { opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                opts.headers['Content-Length'] = Buffer.byteLength(body); }
    const r = https.request(opts, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve(d)); });
    r.on('error', reject); r.on('timeout', () => r.destroy(new Error('timeout'))); if (body) r.write(body); r.end();
  });
}
async function req(method, path, body) {
  for (let a=1; a<=4; a++) {
    try { return await once(method, path, body); }
    catch (e) { if (a===4) throw e; await sleep(600*a); }
  }
}
async function getNonce() {
  const html = await req('GET', '/tarif-peages/');
  const m = html.match(/TTM_Ajax\s*=\s*\{[^}]*"nonce":"([^"]+)"/);
  if (!m) throw new Error('nonce introuvable'); return m[1];
}
const AJAX = '/wp-admin/admin-ajax.php';

(async () => {
  const nonce = await getNonce();
  console.log('nonce frais:', nonce);
  const c = new Client({ connectionString: PG, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // Tables
  await c.query(`
    create table if not exists public.toll_stations (
      id int primary key, name text not null, highway_id int not null,
      lat double precision, lng double precision,
      geom geography(Point,4326), updated_at timestamptz not null default now());
    create index if not exists toll_stations_gix on public.toll_stations using gist(geom);
    create table if not exists public.toll_matrix (
      from_id int not null, to_id int not null, klass text not null default 'c1',
      price numeric(6,3) not null, primary key(from_id,to_id,klass));
    alter table public.toll_stations enable row level security;
    alter table public.toll_matrix  enable row level security;
    drop policy if exists ts_read on public.toll_stations;
    drop policy if exists tm_read on public.toll_matrix;
    create policy ts_read on public.toll_stations for select using (true);
    create policy tm_read on public.toll_matrix  for select using (true);
    grant select on public.toll_stations, public.toll_matrix to authenticated, anon;`);

  // 1) Stations des 4 autoroutes
  const stations = [];
  for (const h of [1,2,3,4]) {
    const raw = await req('GET', `${AJAX}?action=ttm_get_points_by_highway&nonce=${nonce}&highway_id=${h}`);
    let pts=[]; try { pts=JSON.parse(raw);}catch(e){}
    for (const p of pts) {
      stations.push({ id:p.id, name:p.name, hw:h, lat:p.lat, lng:p.lng });
      await c.query(`insert into public.toll_stations(id,name,highway_id,lat,lng,geom,updated_at)
        values($1,$2,$3,$4::float8,$5::float8,
          case when $4::float8 is not null and $5::float8 is not null
               then st_point($5::float8,$4::float8)::geography end, now())
        on conflict(id) do update set name=excluded.name, highway_id=excluded.highway_id,
          lat=excluded.lat, lng=excluded.lng, geom=excluded.geom, updated_at=now()`,
        [p.id,p.name,h,p.lat,p.lng]);
    }
    await sleep(200);
  }
  console.log('stations:', stations.length);

  // 2) Matrice intra-autoroute (toutes paires, classe c1) via find_route — REPRENABLE
  const done = new Set((await c.query(`select from_id,to_id from public.toll_matrix where klass='c1'`))
    .rows.map(r => r.from_id+'-'+r.to_id));
  let pairs = done.size;
  const byHw = {}; stations.forEach(s => (byHw[s.hw]=byHw[s.hw]||[]).push(s));
  for (const h of Object.keys(byHw)) {
    const list = byHw[h];
    for (let i=0;i<list.length;i++) for (let j=0;j<list.length;j++) {
      if (i===j) continue;
      if (done.has(list[i].id+'-'+list[j].id)) continue;   // déjà fait → on saute
      const body = `action=ttm_find_route&nonce=${nonce}&from_id=${list[i].id}&to_id=${list[j].id}&class=c1&highway_id=${h}`;
      const raw = await req('POST', AJAX, body);
      let d; try { d=JSON.parse(raw);}catch(e){continue;}
      if (d && d.success && d.data && typeof d.data.total==='number') {
        await c.query(`insert into public.toll_matrix(from_id,to_id,klass,price) values($1,$2,'c1',$3)
          on conflict(from_id,to_id,klass) do update set price=excluded.price`,
          [list[i].id,list[j].id,d.data.total]); pairs++;
      }
      await sleep(150);
    }
  }
  console.log('paires tarifées (total):', pairs);
  await c.end();
})().catch(e => { console.error('ERREUR', e.message); process.exit(1); });
