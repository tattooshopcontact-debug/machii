-- ============================================================================
-- Machii — KYC : ajout du SELFIE (photo du visage) pour la correspondance
-- avec la pièce d'identité.
--
-- Objectif (demande Faouez) : l'admin doit pouvoir comparer le visage de la
-- personne (selfie pris en direct, caméra frontale) avec la photo de sa CIN,
-- pour confirmer que c'est bien la même personne. Le selfie devient un
-- document REQUIS pour TOUS (passagers et conducteurs).
--
-- Idempotent.
-- ============================================================================

-- 1. Nouvelle valeur d'enum. (Comparaison faite en TEXT dans admin_review_kyc,
--    donc pas d'usage de la valeur enum dans la même transaction → sûr.)
alter type public.kyc_doc_type add value if not exists 'selfie';

-- 2. Recompte du badge Vérifié : le selfie est désormais requis pour tous.
--    (Redéfinition de admin_review_kyc de 0037 avec 'selfie' ajouté.)
create or replace function public.admin_review_kyc(p_doc_id uuid, p_approve boolean)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_admin uuid := auth.uid();
  v_profile uuid;
  v_role text;
  v_required text[];
  v_missing int;
begin
  if not coalesce((select is_admin from profiles where id = v_admin), false) then
    return json_build_object('ok', false, 'reason', 'not_admin');
  end if;

  update kyc_documents
     set status = case when p_approve then 'approved' else 'rejected' end,
         reviewed_at = now(),
         reviewed_by = v_admin
   where id = p_doc_id
   returning kyc_documents.profile_id into v_profile;

  if v_profile is null then
    return json_build_object('ok', false, 'reason', 'not_found');
  end if;

  select p.role::text into v_role from profiles p where p.id = v_profile;
  if v_role in ('driver', 'both') then
    v_required := array['cin', 'selfie', 'permis', 'carte_grise', 'photo_vehicule'];
  else
    v_required := array['cin', 'selfie'];
  end if;

  select count(*) into v_missing
  from unnest(v_required) req
  where not exists (
    select 1 from kyc_documents d
    join profiles a on a.id = d.reviewed_by and a.is_admin
    where d.profile_id = v_profile
      and d.doc_type::text = req
      and d.status = 'approved'
  );

  update profiles set is_verified = (v_missing = 0) where id = v_profile;

  return json_build_object('ok', true, 'verified', v_missing = 0);
end;
$$;
revoke all on function public.admin_review_kyc(uuid, boolean) from public, anon;
grant execute on function public.admin_review_kyc(uuid, boolean) to authenticated;
