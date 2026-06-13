/**
 * Véhicules conducteur (#12-A).
 * - useMyVehicle : le véhicule enregistré du conducteur courant.
 * - useUpsertVehicle : crée / met à jour son véhicule (un par conducteur).
 * - useTripVehicle : véhicule d'un trajet avec affichage échelonné (RPC serveur :
 *   plaque + photo seulement si on est le conducteur ou un passager accepté).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type Vehicle = Database['public']['Tables']['vehicles']['Row'];

export type TripVehicle = {
  ok: boolean;
  reason?: string;
  make?: string | null;
  model?: string | null;
  color?: string | null;
  seats?: number | null;
  revealed?: boolean;
  plate?: string | null;
  photo_url?: string | null;
};

async function fetchMyVehicle(driverId: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('driver_id', driverId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function useMyVehicle(driverId: string | undefined) {
  return useQuery({
    queryKey: ['vehicle', 'mine', driverId],
    queryFn: () => fetchMyVehicle(driverId!),
    enabled: !!driverId,
    staleTime: 60_000,
  });
}

export type VehicleInput = {
  make: string;
  model?: string;
  color: string;
  plate: string;
  seats?: number;
};

async function upsertVehicle(driverId: string, v: VehicleInput): Promise<Vehicle> {
  const { data, error } = await supabase
    .from('vehicles')
    .upsert(
      {
        driver_id: driverId,
        make: v.make.trim(),
        model: v.model?.trim() || null,
        color: v.color.trim(),
        plate: v.plate.trim(),
        seats: v.seats ?? null,
      },
      { onConflict: 'driver_id' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function useUpsertVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, vehicle }: { driverId: string; vehicle: VehicleInput }) =>
      upsertVehicle(driverId, vehicle),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['vehicle', 'mine', vars.driverId] });
    },
  });
}

async function fetchTripVehicle(tripId: string): Promise<TripVehicle> {
  const { data, error } = await supabase.rpc('get_trip_vehicle', { p_trip_id: tripId });
  if (error) throw error;
  return (data as TripVehicle) ?? { ok: false };
}

export function useTripVehicle(tripId: string | undefined) {
  return useQuery({
    queryKey: ['vehicle', 'trip', tripId],
    queryFn: () => fetchTripVehicle(tripId!),
    enabled: !!tripId,
    staleTime: 30_000,
  });
}
