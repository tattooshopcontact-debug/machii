// ============================================================================
// Machii — add-tester : ajoute automatiquement un email comme MEMBRE du groupe
// Google `testeurs@machii.net` (= liste de testeurs du test fermé Play).
//
// Chaîne : email → JWT signé par le compte de service (RS256) → jeton OAuth
// (délégation à l'échelle du domaine, impersonation d'un admin) → Directory API
// `members.insert`. Résultat : la personne devient testeuse Play sans action
// manuelle, et le lien opt-in fonctionne pour elle.
//
// Secrets Supabase requis (à poser APRÈS la config Google) :
//   - GOOGLE_SA_KEY     : le JSON complet de la clé de service (une string)
//   - GWS_ADMIN_EMAIL   : l'email admin Cloud Identity à impersoner (ex: admin@machii.net)
//   - TESTER_GROUP      : l'email du groupe (ex: testeurs@machii.net)
//   - ADD_TESTER_GATE   : secret partagé qui protège l'appel (header x-gate)
// ============================================================================

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-gate',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN [^-]+-----/g, '').replace(/-----END [^-]+-----/g, '').replace(/\s+/g, '');
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function b64url(data: ArrayBuffer | Uint8Array | string): string {
  const bytes = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : data instanceof Uint8Array ? data : new Uint8Array(data);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signJwt(sa: any, subject: string, scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: sa.client_email,
    sub: subject,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${b64url(sig)}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  try {
    const GATE = Deno.env.get('ADD_TESTER_GATE');
    if (GATE && req.headers.get('x-gate') !== GATE) return json({ ok: false, reason: 'forbidden' }, 403);

    const { email } = await req.json().catch(() => ({ email: null }));
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, reason: 'invalid_email' }, 400);

    const saRaw = Deno.env.get('GOOGLE_SA_KEY');
    const subject = Deno.env.get('GWS_ADMIN_EMAIL');
    const group = Deno.env.get('TESTER_GROUP');
    if (!saRaw || !subject || !group) return json({ ok: false, reason: 'not_configured' }, 503);
    const sa = JSON.parse(saRaw);

    // 1) JWT signé → jeton OAuth (délégation domaine, impersonation admin)
    const jwt = await signJwt(sa, subject, 'https://www.googleapis.com/auth/admin.directory.group.member');
    const tokRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
    });
    const tok = await tokRes.json();
    if (!tokRes.ok || !tok.access_token) return json({ ok: false, reason: 'oauth_failed', detail: tok }, 502);

    // 2) Ajoute l'email comme membre du groupe
    const insRes = await fetch(
      `https://admin.googleapis.com/admin/directory/v1/groups/${encodeURIComponent(group)}/members`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'MEMBER' }),
      },
    );
    if (insRes.status === 409) return json({ ok: true, already: true }); // déjà membre = OK
    const ins = await insRes.json().catch(() => ({}));
    if (!insRes.ok) return json({ ok: false, reason: 'insert_failed', status: insRes.status, detail: ins }, 502);

    return json({ ok: true, added: email });
  } catch (e) {
    return json({ ok: false, reason: 'error', detail: String((e as Error)?.message || e) }, 500);
  }
});
