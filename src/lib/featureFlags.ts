/**
 * Feature flags — publier les options une par une sans rebuild.
 *
 * Les flags vivent dans la table `feature_flags` (Supabase) et sont lus au
 * démarrage. Une option dont le flag est OFF reste invisible même si son code
 * est présent dans le build. Pour publier une option : passer `enabled` à true
 * côté serveur (SQL `select set_feature('<key>', true)`), effet immédiat.
 *
 * `useFeature(key, fallback)` renvoie l'état de l'option. Tant que les flags ne
 * sont pas chargés (ou en cas d'erreur réseau), on retombe sur `fallback` pour
 * ne jamais casser l'UI.
 */
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/** Clés d'options connues (registre numéroté, cf migration 0023). */
export type FeatureKey =
  | 'maroc'
  | 'women_only'
  | 'live_share'
  | 'trip_map'
  | 'pickup_code'
  | 'arrival_confirm'
  | 'vehicle_info'
  | 'progression'
  | 'referral'
  | 'kyc_publish_gate';

/**
 * Valeur de repli si les flags ne sont pas (encore) chargés. On garde les
 * options de base v1.1.0 visibles, et les options en cours de publication à
 * false par sécurité.
 */
const FALLBACK: Record<FeatureKey, boolean> = {
  maroc: true,
  women_only: true,
  live_share: true,
  trip_map: true,
  pickup_code: false,
  arrival_confirm: false,
  vehicle_info: false,
  progression: false,
  referral: false,
  kyc_publish_gate: false,
};

async function fetchFlags(): Promise<Record<string, boolean>> {
  const { data, error } = await supabase.from('feature_flags').select('key, enabled');
  if (error) throw error;
  const map: Record<string, boolean> = {};
  for (const row of data ?? []) map[row.key] = !!row.enabled;
  return map;
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature_flags'],
    queryFn: fetchFlags,
    staleTime: 5 * 60_000, // 5 min : on ne re-fetch pas à chaque écran
  });
}

/** Renvoie true si l'option est publiée (ON). Retombe sur le fallback sinon. */
export function useFeature(key: FeatureKey): boolean {
  const { data } = useFeatureFlags();
  return data?.[key] ?? FALLBACK[key];
}
