-- ============================================================================
-- Machii — Contacts d'urgence (pour le bouton SOS)
-- ============================================================================

create table if not exists public.emergency_contacts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  phone      text not null,
  created_at timestamptz not null default now()
);

alter table public.emergency_contacts enable row level security;

drop policy if exists "emergency_contacts self" on public.emergency_contacts;
create policy "emergency_contacts self" on public.emergency_contacts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists emergency_contacts_user_idx on public.emergency_contacts (user_id);
