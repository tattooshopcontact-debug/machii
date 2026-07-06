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

/** Types de carburant proposés (alignés sur la contrainte SQL vehicles_fuel_type_chk). */
export const FUEL_TYPES = [
  { key: 'essence', label: 'Essence' },
  { key: 'gasoil', label: 'Diesel' },
  { key: 'gpl', label: 'GPL' },
  { key: 'hybride', label: 'Hybride' },
  { key: 'electrique', label: 'Électrique' },
] as const;
export type FuelType = (typeof FUEL_TYPES)[number]['key'];

/**
 * Consommation estimée (L/100 km) pour une voiture — le conducteur ne la saisit PAS.
 * RPC serveur : modèle exact → défaut carburant → 7.0 (renvoie toujours une valeur).
 */
export async function fetchVehicleConsumption(
  make: string | null,
  model: string | null,
  year: number | null,
  fuel: string | null,
): Promise<number> {
  const { data, error } = await supabase.rpc('get_vehicle_consumption', {
    p_make: make,
    p_model: model,
    p_year: year,
    p_fuel: fuel,
  });
  if (error) throw error;
  return Number(data ?? 7);
}

/** Fallback carburants quand la voiture est inconnue de la base (jamais électrique/hybride par défaut). */
export const FALLBACK_FUELS: FuelType[] = ['essence', 'gasoil', 'gpl'];

/**
 * Carburants réellement disponibles pour une voiture (logique intelligente).
 * Ex : Peugeot 203 → ['essence'] ; Toyota Yaris → ['essence','hybride'].
 * Renvoie le fallback si le modèle est inconnu de la base.
 */
export async function fetchVehicleFuelTypes(
  make: string,
  model: string,
  year: number | null,
): Promise<FuelType[]> {
  if (make.trim().length < 2 || model.trim().length < 1) return FALLBACK_FUELS;
  const { data, error } = await supabase.rpc('get_vehicle_fuel_types', {
    p_make: make.trim(),
    p_model: model.trim(),
    p_year: year,
  });
  if (error) throw error;
  const list = (data as string[] | null) ?? [];
  const valid = list.filter((f): f is FuelType => FUEL_TYPES.some((x) => x.key === f));
  return valid.length ? valid : FALLBACK_FUELS;
}

export type VehicleInput = {
  make: string;
  model?: string;
  color: string;
  plate: string;
  seats?: number;
  photo_url?: string | null;
  year?: number | null;
  fuel_type?: FuelType | null;
};

async function upsertVehicle(driverId: string, v: VehicleInput): Promise<Vehicle> {
  // La conso se calcule TOUTE SEULE à partir de marque/modèle/année/carburant.
  let consumption: number | null = null;
  try {
    consumption = await fetchVehicleConsumption(
      v.make.trim() || null,
      v.model?.trim() || null,
      v.year ?? null,
      v.fuel_type ?? null,
    );
  } catch {
    consumption = null; // en cas d'échec du lookup, on n'empêche pas l'enregistrement
  }

  const row: Database['public']['Tables']['vehicles']['Insert'] = {
    driver_id: driverId,
    make: v.make.trim(),
    model: v.model?.trim() || null,
    color: v.color.trim(),
    plate: v.plate.trim(),
    seats: v.seats ?? null,
    year: v.year ?? null,
    fuel_type: v.fuel_type ?? null,
    consumption_l100: consumption,
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
