-- ============================================================================
-- Machii — Liste d'attente (landing multi-marchés). Collecte les inscriptions
-- des visiteurs du site par pays (TN/MA/SN/EG) pour mesurer la demande avant
-- lancement. Le site statique POST en anon vers PostgREST.
--
-- Sécurité : anon peut UNIQUEMENT insérer (pas lire) → pas de fuite d'emails.
-- Idempotent.
-- ============================================================================

create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text,
  phone      text,
  country    text not null check (country in ('TN','MA','SN','EG','OTHER')),
  role_pref  text check (role_pref in ('passenger','driver','both')),
  locale     text default 'fr',
  source     text default 'landing',
  user_agent text,
  created_at timestamptz not null default now()
);

-- Anti-doublon : un email ne s'inscrit qu'une fois par pays.
create unique index if not exists waitlist_email_country_uidx
  on public.waitlist (lower(email), country) where email is not null;

alter table public.waitlist enable row level security;

-- anon (le site public) : INSERT uniquement. Pas de SELECT (emails protégés).
drop policy if exists waitlist_anon_insert on public.waitlist;
create policy waitlist_anon_insert
  on public.waitlist for insert
  to anon, authenticated
  with check (true);

grant insert on public.waitlist to anon, authenticated;

-- Vue de comptage publique (sans exposer les emails) : combien d'inscrits / pays.
create or replace view public.waitlist_counts as
  select country, count(*)::int as total
  from public.waitlist
  group by country;

grant select on public.waitlist_counts to anon, authenticated;
