// Machii — Import de la base de consommation (bot). Source : FuelEconomy.gov (US EPA, domaine public).
// Lit /tmp/conso.tsv (make,model,year_from,year_to,fuel,l100) et remplit public.vehicle_consumption.
// Idempotent : purge source='EPA' puis réinsère par lots.
const fs = require('fs');
const { Client } = require('pg');
const PG = 'postgresql://postgres.qtgqvwfzwjprclqrkfue:azeAZE123%40%2B@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';
const TSV = process.argv[2] || '/tmp/conso.tsv';

(async () => {
  const rows = fs.readFileSync(TSV, 'utf8').trim().split('\n').map(l => l.split('\t'));
  const c = new Client({ connectionString: PG, ssl: { rejectUnauthorized: false } });
  await c.connect();
  await c.query(`delete from public.vehicle_consumption where source='EPA'`);

  const BATCH = 400;
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH).filter(r => r.length >= 6);
    if (!slice.length) continue;
    const vals = [], params = [];
    slice.forEach((r, k) => {
      const b = k * 7;
      vals.push(`($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7})`);
      params.push(r[0], r[1], parseInt(r[2])||null, parseInt(r[3])||null, r[4], parseFloat(r[5])||0, 'EPA');
    });
    await c.query(
      `insert into public.vehicle_consumption(make,model,year_from,year_to,fuel_type,consumption_l100,source) values ${vals.join(',')}`,
      params,
    );
    done += slice.length;
  }
  const total = (await c.query(`select count(*) n from public.vehicle_consumption`)).rows[0].n;
  const brands = (await c.query(`select count(distinct make) n from public.vehicle_consumption`)).rows[0].n;
  console.log('importées:', done, '| total en base:', total, '| marques:', brands);
  await c.end();
})().catch(e => { console.error('ERREUR', e.message); process.exit(1); });
