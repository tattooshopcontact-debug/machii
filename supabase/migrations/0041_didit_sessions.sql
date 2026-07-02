-- ============================================================================
-- Machii — KYC AUTOMATIQUE via Didit (didit.me).
--
-- Table de suivi des sessions de vérification Didit. Une session = un passage
-- de l'utilisateur dans le flux Didit (lecture CIN + selfie + liveness +
-- face-match). Le résultat arrive par webhook (Edge Function didit-webhook)
-- qui, si « Approved », passe profiles.is_verified = true.
--
-- La table n'est PAS écrite par le client (tout passe par les Edge Functions
-- en service_role). Lecture : l'utilisateur voit SES sessions (statut).
-- Idempotent.
-- ============================================================================

create table if not exists public.didit_sessions (
  session_id text primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  status     text not null default 'Not Started',
  decision   jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists didit_sessions_user_idx on public.didit_sessions (user_id, created_at desc);

alter table public.didit_sessions enable row level security;

-- L'utilisateur lit uniquement SES sessions (pour afficher « en cours / validé »).
drop policy if exists "didit_sessions owner read" on public.didit_sessions;
create policy "didit_sessions owner read" on public.didit_sessions
  for select using (auth.uid() = user_id);

-- Aucune écriture client : réservé au service_role (Edge Functions), qui
-- contourne la RLS. Pas de policy insert/update pour anon/authenticated.
grant select on public.didit_sessions to authenticated;
