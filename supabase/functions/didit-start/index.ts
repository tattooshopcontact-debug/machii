// Démarre une vérification Didit pour l'utilisateur connecté. Aucun import
// externe (REST direct) pour éviter tout BOOT_ERROR.
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const DIDIT_API_KEY = Deno.env.get('DIDIT_API_KEY')!;
    const WORKFLOW_ID = Deno.env.get('DIDIT_WORKFLOW_ID')!;

    // Identifie l'utilisateur via son JWT (endpoint Auth REST).
    const authHeader = req.headers.get('Authorization') ?? '';
    const ur = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: ANON, Authorization: authHeader },
    });
    if (!ur.ok) return json({ error: 'not_authenticated' }, 401);
    const user = await ur.json();
    if (!user?.id) return json({ error: 'not_authenticated' }, 401);

    // ⚠️ `callback` = URL où Didit RENVOIE L'UTILISATEUR à la fin (pas le webhook !).
    // URL https d'un « lien vérifié Android » : l'app se rouvre DIRECTEMENT
    // (sans popup) sur l'écran de vérification. En web pur, la page /verif-retour
    // du site s'affiche en secours.
    const callback = 'https://machii.net/verif-retour';

    const resp = await fetch('https://verification.didit.me/v3/session/', {
      method: 'POST',
      headers: { 'x-api-key': DIDIT_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_id: WORKFLOW_ID,
        vendor_data: user.id,
        callback,
        callback_method: 'both',
      }),
    });
    const session = await resp.json();
    if (!resp.ok) return json({ error: 'didit_error', detail: session }, 502);

    // Enregistre la session (service_role, contourne la RLS).
    await fetch(`${SUPABASE_URL}/rest/v1/didit_sessions`, {
      method: 'POST',
      headers: {
        apikey: SERVICE,
        Authorization: `Bearer ${SERVICE}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        session_id: session.session_id,
        user_id: user.id,
        status: session.status ?? 'Not Started',
        updated_at: new Date().toISOString(),
      }),
    });

    return json({ url: session.url, session_id: session.session_id });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
