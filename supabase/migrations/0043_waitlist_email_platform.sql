-- ============================================================================
-- Machii — Liste d'attente / collecte d'emails « Télécharger l'app ».
--
-- Le bouton « Télécharger l'app » / « Bientôt sur iOS & Android » du site ouvre
-- une popup qui récolte email + iPhone/Android → futurs testeurs (Android) et
-- liste de lancement (iOS). Aussi utilisée par le mini-formulaire d'inscription
-- de la landing (name/phone/role).
--
-- ⚠️ La table n'existait pas (les inserts best-effort du site échouaient en
-- silence). On la crée. Sécurité : insertion anonyme autorisée, AUCUNE lecture
-- publique (la liste ne se lit qu'avec la clé service_role, côté admin).
-- Idempotent.
-- ============================================================================

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  phone       text,
  email       text,
  platform    text,           -- 'ios' | 'android'
  country     text,
  role_pref   text,           -- 'passenger' | 'driver' | 'both'
  locale      text,
  source      text,           -- 'site' | 'download-popup' ...
  user_agent  text,
  created_at  timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Insertion anonyme OK, lecture publique interdite.
drop policy if exists "waitlist anon insert" on public.waitlist;
create policy "waitlist anon insert" on public.waitlist
  for insert to anon, authenticated with check (true);

grant insert on public.waitlist to anon, authenticated;
