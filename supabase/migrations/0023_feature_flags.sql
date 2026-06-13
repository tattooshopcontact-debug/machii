-- ============================================================================
-- Machii — Feature flags : publier les options UNE PAR UNE sans rebuild.
--
-- Tout le code part dans le build, mais chaque "option" (fonctionnalité) est
-- gardée derrière un flag. L'app lit ces flags au démarrage : une option OFF
-- reste invisible même si son code est présent. Pour publier une option, on
-- passe simplement son `enabled` à true côté serveur (effet immédiat, 0 rebuild).
--
-- Convention : `num` = numéro d'option (F1, F2…), `version` = jalon de livraison.
-- Lecture publique (anon + authenticated). Écriture = SQL / dashboard seulement.
--
-- Idempotent.
-- ============================================================================

create table if not exists public.feature_flags (
  key        text primary key,
  num        int  not null,
  label      text not null,
  version    text not null,
  enabled    boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.feature_flags enable row level security;

drop policy if exists "feature_flags read" on public.feature_flags;
create policy "feature_flags read" on public.feature_flags
  for select using (true);

grant select on public.feature_flags to anon, authenticated;

-- Seed du registre. On NE réécrit PAS `enabled` si la ligne existe déjà
-- (pour ne pas annuler une publication faite à la main).
insert into public.feature_flags (key, num, label, version, enabled) values
  ('maroc',           1, 'Cap Maroc (+212, villes, devise DH)',        'v1.1.0', true),
  ('women_only',      2, 'Mode trajet entre femmes',                   'v1.1.0', true),
  ('live_share',      3, 'Partage de trajet temps réel à un proche',   'v1.1.0', true),
  ('trip_map',        4, 'Carte du trajet',                            'v1.1.0', true),
  ('pickup_code',     5, 'Code de prise en charge à 4 chiffres',       'v1.2.0', false),
  ('arrival_confirm', 6, 'Confirmation d''arrivée',                    'v1.2.0', false)
on conflict (key) do update
  set num = excluded.num,
      label = excluded.label,
      version = excluded.version;
-- (enabled volontairement non touché par le ON CONFLICT)

-- Helper : bascule une option (à appeler en SQL pour publier/dépublier).
create or replace function public.set_feature(p_key text, p_enabled boolean)
returns void language sql security definer set search_path = public as $$
  update public.feature_flags set enabled = p_enabled, updated_at = now() where key = p_key;
$$;
revoke all on function public.set_feature(text, boolean) from public, anon, authenticated;
