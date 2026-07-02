// Vérifie ACTIVEMENT (pull) le résultat de la dernière session Didit de
// l'utilisateur connecté et met à jour is_verified — sans dépendre du webhook.
// Appelé par l'app au retour du navigateur, et par le site en polling.
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

    // Utilisateur via JWT.
    const authHeader = req.headers.get('Authorization') ?? '';
    const ur = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON, Authorization: authHeader } });
    if (!ur.ok) return json({ error: 'not_authenticated' }, 401);
    const user = await ur.json();
    if (!user?.id) return json({ error: 'not_authenticated' }, 401);

    const rest = `${SUPABASE_URL}/rest/v1`;
    const svc = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' };

    // Déjà vérifié ? on court-circuite.
    const pr = await fetch(`${rest}/profiles?id=eq.${user.id}&select=is_verified`, { headers: svc });
    const prof = await pr.json();
    if (Array.isArray(prof) && prof[0]?.is_verified) return json({ verified: true });

    // Dernière session Didit de l'utilisateur.
    const sr = await fetch(`${rest}/didit_sessions?user_id=eq.${user.id}&order=created_at.desc&limit=1`, { headers: svc });
    const sessions = await sr.json();
    const session = Array.isArray(sessions) ? sessions[0] : null;
    if (!session) return json({ verified: false, status: 'none' });

    // Statut réel chez Didit.
    const dr = await fetch(`https://verification.didit.me/v3/session/${session.session_id}/decision/`, {
      headers: { 'x-api-key': DIDIT_API_KEY },
    });
    const decision = await dr.json();
    if (!dr.ok) return json({ verified: false, status: session.status });
    const status = (decision.status ?? 'Unknown') as string;

    await fetch(`${rest}/didit_sessions?session_id=eq.${encodeURIComponent(session.session_id)}`, {
      method: 'PATCH', headers: svc,
      body: JSON.stringify({ status, decision, updated_at: new Date().toISOString() }),
    });

    if (status === 'Approved') {
      await fetch(`${rest}/profiles?id=eq.${user.id}`, {
        method: 'PATCH', headers: svc, body: JSON.stringify({ is_verified: true }),
      });
      return json({ verified: true, status });
    }
    return json({ verified: false, status });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
