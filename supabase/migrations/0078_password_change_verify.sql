-- Machii — Changement de mot de passe sécurisé : si un mot de passe existe déjà,
-- exiger le MOT DE PASSE ACTUEL avant de le remplacer. (Définition initiale : pas de current requis.)

create or replace function public.set_password(p_password text, p_current text default null)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $fn$
declare
  v_uid uuid := auth.uid();
  v_cur text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'not_auth'); end if;
  if p_password is null or length(p_password) < 8 then
    return jsonb_build_object('ok', false, 'reason', 'too_short');
  end if;

  select password_hash into v_cur from public.profiles where id = v_uid;

  -- Si un mot de passe existe déjà → vérifier l'actuel (modification sécurisée).
  if v_cur is not null then
    if p_current is null or extensions.crypt(p_current, v_cur) <> v_cur then
      return jsonb_build_object('ok', false, 'reason', 'bad_current');
    end if;
  end if;

  update public.profiles
    set password_hash = extensions.crypt(p_password, extensions.gen_salt('bf'))
    where id = v_uid;
  return jsonb_build_object('ok', true);
end; $fn$;

grant execute on function public.set_password(text, text) to authenticated;
