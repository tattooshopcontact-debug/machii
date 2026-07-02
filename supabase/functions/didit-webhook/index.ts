// Webhook Didit : reçoit le "ping", reconfirme le résultat via l'API Didit,
// puis met à jour la session + profiles.is_verified. Aucun import externe
// (appels REST directs) pour éviter tout BOOT_ERROR.
Deno.serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const DIDIT_API_KEY = Deno.env.get('DIDIT_API_KEY')!;

    const payload = await req.json().catch(() => ({} as Record<string, unknown>));
    const sessionId = payload.session_id as string | undefined;
    if (!sessionId) return new Response('missing session_id', { status: 400 });

    // Reconfirme le statut réel auprès de Didit (anti-spoof).
    const dr = await fetch(`https://verification.didit.me/v3/session/${sessionId}/decision/`, {
      headers: { 'x-api-key': DIDIT_API_KEY },
    });
    const decision = await dr.json();
    if (!dr.ok) return new Response('didit fetch failed', { status: 502 });

    const status = (decision.status ?? payload.status ?? 'Unknown') as string;
    const userId = (decision.vendor_data ?? payload.vendor_data ?? null) as string | null;

    const rest = `${SUPABASE_URL}/rest/v1`;
    const svcHeaders = {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      'Content-Type': 'application/json',
    };

    // Met à jour la session (audit).
    await fetch(`${rest}/didit_sessions?session_id=eq.${encodeURIComponent(sessionId)}`, {
      method: 'PATCH',
      headers: svcHeaders,
      body: JSON.stringify({ status, decision, updated_at: new Date().toISOString() }),
    });

    // Approuvé → badge Vérifié.
    if (userId && status === 'Approved') {
      await fetch(`${rest}/profiles?id=eq.${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: svcHeaders,
        body: JSON.stringify({ is_verified: true }),
      });
    }

    return new Response(JSON.stringify({ ok: true, status }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
