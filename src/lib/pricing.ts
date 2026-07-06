/**
 * Participation aux frais — prévisualisation du prix conseillé pour un trajet.
 * Le moteur serveur calcule : coût réel (carburant + usure + péage officiel) ÷ occupants
 * → prix suggéré (raisonnable) + plafond (base × (1 + marge)). Min = 0 (Offert).
 * Rien n'est imposé : le conducteur choisit dans [0, max], suggestion pré-remplie.
 */
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type TripCostBreakdown = {
  distanceKm: number;
  consumption: number;
  toll: number;
  occupants: number;
  total: number;
  perPerson: number;
  max: number;
  detail: { carburant: number; usure: number; peage: number };
};

async function fetchTripCost(tripId: string): Promise<TripCostBreakdown | null> {
  const { data, error } = await supabase.rpc('compute_trip_cost', { p_trip_id: tripId });
  if (error) throw error;
  const d = (data ?? {}) as Record<string, unknown>;
  if (!d.ok) return null;
  const det = (d.detail ?? {}) as Record<string, unknown>;
  return {
    distanceKm: Number(d.distance_km ?? 0),
    consumption: Number(d.consommation_l100 ?? 0),
    toll: Number(d.peage ?? 0),
    occupants: Number(d.occupants ?? 0),
    total: Number(d.cout_total ?? 0),
    perPerson: Number(d.part_reelle ?? 0),
    max: Number(d.fourchette_max ?? 0),
    detail: {
      carburant: Number(det.carburant ?? 0),
      usure: Number(det.usure ?? 0),
      peage: Number(det.peage ?? 0),
    },
  };
}

/** Détail transparent du coût d'un trajet (pour l'afficher au passager). */
export function useTripCost(tripId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['tripCost', tripId],
    queryFn: () => fetchTripCost(tripId!),
    enabled: !!tripId && enabled,
    staleTime: 5 * 60_000,
  });
}

export type TripCostPreview = {
  ok: boolean;
  suggested: number; // part_reelle — prix conseillé
  min: number; // 0 (Offert)
  max: number; // fourchette_max — plafond
  distanceKm: number;
  toll: number;
  hasVehicle: boolean;
};

export async function fetchTripCostPreview(params: {
  originLng: number;
  originLat: number;
  destLng: number;
  destLat: number;
  driverId: string;
  seats: number;
  country?: string;
}): Promise<TripCostPreview | null> {
  const { data, error } = await supabase.rpc('preview_trip_cost', {
    p_origin_lng: params.originLng,
    p_origin_lat: params.originLat,
    p_dest_lng: params.destLng,
    p_dest_lat: params.destLat,
    p_driver_id: params.driverId,
    p_seats: params.seats,
    p_country: params.country ?? 'TN',
  });
  if (error) throw error;
  const d = (data ?? {}) as Record<string, unknown>;
  if (!d.ok) return null;
  return {
    ok: true,
    suggested: Number(d.part_reelle ?? 0),
    min: Number(d.fourchette_min ?? 0),
    max: Number(d.fourchette_max ?? 0),
    distanceKm: Number(d.distance_km ?? 0),
    toll: Number(d.peage ?? 0),
    hasVehicle: Boolean(d.a_vehicule),
  };
}
