/**
 * Helpers de mapping et de requêtes Supabase pour les trajets.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cityToPoint, parseDepartureTime } from '@/lib/geo';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type { DriverSummary, Trip } from '@/types/models';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type TripRow = Database['public']['Tables']['trips']['Row'];

const TINTS: NonNullable<DriverSummary['avatarTint']>[] = ['orange', 'navy', 'yellow'];
function pickTint(id: string): NonNullable<DriverSummary['avatarTint']> {
  const idx = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % TINTS.length;
  return TINTS[idx];
}

export function mapDriverFromDb(row: ProfileRow, tripCount = 0): DriverSummary {
  return {
    id: row.id,
    fullName: row.full_name || 'Utilisateur',
    avatarUrl: row.avatar_url,
    avatarTint: pickTint(row.id),
    ratingAvg: Number(row.rating_avg ?? 0),
    tripCount,
    isVerified: row.is_verified,
    isNew: tripCount === 0,
  };
}

type TripWithDriver = TripRow & { driver: ProfileRow | null };

export function mapTripFromDb(row: TripWithDriver): Trip {
  const driverRow: ProfileRow = row.driver ?? {
    id: row.driver_id,
    phone: null,
    full_name: 'Conducteur',
    avatar_url: null,
    avatar_key: null,
    country: 'TN',
    gender: null,
    role: 'driver',
    is_verified: false,
    rating_avg: 0,
    level: 1,
    xp: 0,
    bio: null,
    tags: [],
    created_at: row.created_at,
  };

  return {
    id: row.id,
    driver: mapDriverFromDb(driverRow),
    origin: row.origin_label,
    destination: row.destination_label,
    departureTime: row.departure_time,
    seatsAvailable: row.seats_available,
    seatsTotal: row.seats_total,
    pricePerSeat: row.price_per_seat,
    status: row.status,
    isRecurring: row.is_recurring,
    country: (row.country as 'TN' | 'MA') ?? 'TN',
    womenOnly: row.women_only ?? false,
  };
}

/**
 * Fetch des trajets ouverts, CLOISONNÉS PAR PAYS (Cap Maroc M2).
 * - Si origin + destination sont fournis → filtre par labels exacts (V0 simple).
 * - Sinon → liste tous les trajets ouverts à venir du pays, triés par date.
 */
async function fetchTrips(
  origin: string | null,
  destination: string | null,
  country: 'TN' | 'MA',
): Promise<Trip[]> {
  let query = supabase
    .from('trips')
    .select('*, driver:profiles!trips_driver_id_fkey(*)')
    .eq('status', 'open')
    .eq('country', country)
    .gt('seats_available', 0)
    .gte('departure_time', new Date().toISOString())
    .order('departure_time', { ascending: true })
    .limit(50);

  if (origin) query = query.ilike('origin_label', origin);
  if (destination) query = query.ilike('destination_label', destination);

  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as TripWithDriver[]).map(mapTripFromDb);
}

export function useSearchTrips(
  origin: string | null,
  destination: string | null,
  country: 'TN' | 'MA' = 'TN',
) {
  return useQuery({
    queryKey: ['trips', 'search', origin, destination, country],
    queryFn: () => fetchTrips(origin, destination, country),
    staleTime: 30_000,
  });
}

/** Fetch un seul trajet par id, avec son driver. */
async function fetchTripById(id: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*, driver:profiles!trips_driver_id_fkey(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTripFromDb(data as unknown as TripWithDriver) : null;
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ['trips', 'detail', id],
    queryFn: () => fetchTripById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/** Tous les trips publiés par un user (les siens, en tant que conducteur). */
async function fetchMyPublishedTrips(driverId: string): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*, driver:profiles!trips_driver_id_fkey(*)')
    .eq('driver_id', driverId)
    .order('departure_time', { ascending: true });
  if (error) throw error;
  return (data as unknown as TripWithDriver[]).map(mapTripFromDb);
}

export function useMyPublishedTrips(driverId: string | undefined) {
  return useQuery({
    queryKey: ['trips', 'mine', driverId],
    queryFn: () => fetchMyPublishedTrips(driverId!),
    enabled: !!driverId,
    staleTime: 15_000,
  });
}

/**
 * Patch d'un trajet existant. Seul le conducteur du trip est autorisé via RLS.
 * Si origin/destination change → on recalcule les points PostGIS.
 * Si heure change → on parse et recalcule departure_time.
 */
export type TripPatch = Partial<{
  origin: string;
  destination: string;
  time: string;
  seats: number;
  price: number | null;
  status: Database['public']['Enums']['trip_status'];
}>;

async function patchTrip(id: string, patch: TripPatch) {
  const dbPatch: Database['public']['Tables']['trips']['Update'] = {};

  if (patch.origin !== undefined) {
    dbPatch.origin_label = patch.origin;
    const point = cityToPoint(patch.origin);
    if (!point) throw new Error(`Ville inconnue : ${patch.origin}`);
    dbPatch.origin = point;
  }
  if (patch.destination !== undefined) {
    dbPatch.destination_label = patch.destination;
    const point = cityToPoint(patch.destination);
    if (!point) throw new Error(`Ville inconnue : ${patch.destination}`);
    dbPatch.destination = point;
  }
  if (patch.time !== undefined) {
    dbPatch.departure_time = parseDepartureTime(patch.time);
  }
  if (patch.seats !== undefined) {
    dbPatch.seats_total = patch.seats;
    dbPatch.seats_available = patch.seats;
  }
  if (patch.price !== undefined) dbPatch.price_per_seat = patch.price;
  if (patch.status !== undefined) dbPatch.status = patch.status;

  const { data, error } = await supabase
    .from('trips')
    .update(dbPatch)
    .eq('id', id)
    .select('*, driver:profiles!trips_driver_id_fkey(*)')
    .single();
  if (error) throw error;
  return data;
}

export function useUpdateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TripPatch }) => patchTrip(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

async function deleteTrip(id: string) {
  // Supprime physiquement le trip. CASCADE sur bookings/waypoints/conversations
  // via la migration 0001, donc les demandes liées sont supprimées aussi.
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTrip(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
