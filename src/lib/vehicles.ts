/**
 * Véhicules conducteur (#12-A).
 * - useMyVehicle : le véhicule enregistré du conducteur courant.
 * - useUpsertVehicle : crée / met à jour son véhicule (un par conducteur).
 * - useTripVehicle : véhicule d'un trajet avec affichage échelonné (RPC serveur :
 *   plaque + photo seulement si on est le conducteur ou un passager accepté).
 */
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

const PHOTO_BUCKET = 'vehicle-photos';

/** Choisit une photo (paysage 4:3) pour le véhicule. */
export async function pickVehiclePhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error("L'accès à tes photos est nécessaire pour ajouter une photo du véhicule.");
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
}

/** Upload la photo du véhicule dans `{userId}/vehicle.{ext}` et renvoie l'URL publique (cache-bustée). */
export async function uploadVehiclePhoto(
  userId: string,
  asset: ImagePicker.ImagePickerAsset,
): Promise<string> {
  const mime = asset.mimeType ?? 'image/jpeg';
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  const path = `${userId}/vehicle.${ext}`;
  const response = await fetch(asset.uri);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0) throw new Error('Le fichier image est vide. Réessaie avec une autre photo.');
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, bytes, {
    contentType: mime,
    upsert: true,
    cacheControl: '3600',
  });
  if (error) throw error;
  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

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
  photo_url?: string | null;
};

async function upsertVehicle(driverId: string, v: VehicleInput): Promise<Vehicle> {
  const row: Database['public']['Tables']['vehicles']['Insert'] = {
    driver_id: driverId,
    make: v.make.trim(),
    model: v.model?.trim() || null,
    color: v.color.trim(),
    plate: v.plate.trim(),
    seats: v.seats ?? null,
  };
  if (v.photo_url !== undefined) row.photo_url = v.photo_url;
  const { data, error } = await supabase
    .from('vehicles')
    .upsert(row, { onConflict: 'driver_id' })
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
