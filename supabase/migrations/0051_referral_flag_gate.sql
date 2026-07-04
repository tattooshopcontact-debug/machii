-- ============================================================================
-- Machii — apply_referral verrouillé par le flag F9 `referral` (audit pré-prod)
--
-- Avant : le flag ne cachait que l'UI ; la RPC restait appelable directement
-- (un malin pouvait farmer +20/+10 XP flag éteint). Désormais le serveur
-- refuse si le flag est OFF. Idempotent.
-- ============================================================================

create or replace function public.apply_referral(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_ref uuid;
begin
  -- Gate serveur : fonctionnalité désactivée = refus, même en appel direct.
  if not coalesce((select enabled from public.feature_flags where key = 'referral'), false) then
    return jsonb_build_object('ok', false, 'reason', 'feature_disabled');
  end if;

  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'not_auth'); end if;
  if (select referred_by from public.profiles where id = v_uid) is not null then
    return jsonb_build_object('ok', false, 'reason', 'already');
  end if;
  select id into v_ref from public.profiles where upper(referral_code) = upper(trim(coalesce(p_code, '')));
  if v_ref is null then return jsonb_build_object('ok', false, 'reason', 'bad_code'); end if;
  if v_ref = v_uid then return jsonb_build_object('ok', false, 'reason', 'self'); end if;

  update public.profiles set referred_by = v_ref where id = v_uid;
  perform public.add_xp(v_ref, 20);  -- parrain
  perform public.add_xp(v_uid, 10);  -- filleul (bienvenue)
  return jsonb_build_object('ok', true);
end;
$$;
grant execute on function public.apply_referral(text) to authenticated;
