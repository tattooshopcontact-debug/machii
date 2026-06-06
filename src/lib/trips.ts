/**
 * Helpers de mapping et de requêtes Supabase pour les trajets.
 */
import { useQuery } from '@tanstack/react-query';

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
  };
}

/**
 * Fetch des trajets ouverts.
 * - Si origin + destination sont fournis → filtre par labels exacts (V0 simple).
 * - Sinon → liste tous les trajets ouverts à venir, triés par date.
 */
async function fetchTrips(origin: string | null, destination: string | null): Promise<Trip[]> {
  let query = supabase
    .from('trips')
    .select('*, driver:profiles!trips_driver_id_fkey(*)')
    .eq('status', 'open')
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

export function useSearchTrips(origin: string | null, destination: string | null) {
  return useQuery({
    queryKey: ['trips', 'search', origin, destination],
    queryFn: () => fetchTrips(origin, destination),
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
