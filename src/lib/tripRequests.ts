/**
 * Helpers Supabase pour les demandes de trajet (passager -> conducteurs).
 * Une demande est une annonce "Je cherche Tunis -> Sousse demain matin".
 * Les conducteurs voient ces demandes depuis leur accueil et peuvent y
 * repondre en publiant un trajet ou en ouvrant un chat.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cityToPoint, findCity } from '@/lib/geo';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type TripRequestRow = Database['public']['Tables']['trip_requests']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export type TripRequestStatus = TripRequestRow['status'];

export type TripRequestWithPassenger = TripRequestRow & {
  passenger: Pick<
    ProfileRow,
    'id' | 'full_name' | 'avatar_url' | 'avatar_key' | 'is_verified' | 'rating_avg' | 'level' | 'role'
  > | null;
};

export type CreateTripRequestInput = {
  passengerId: string;
  originCity: string;
  destinationCity: string;
  /** ISO debut de la fourchette de depart. */
  departureStart: string;
  /** ISO fin de la fourchette de depart. */
  departureEnd: string;
  seatsNeeded: number;
  message?: string;
};

async function createTripRequest(input: CreateTripRequestInput): Promise<TripRequestRow> {
  const origin = cityToPoint(input.originCity);
  const destination = cityToPoint(input.destinationCity);
  if (!origin || !destination) {
    throw new Error('Ville inconnue : selectionne une ville de la liste.');
  }
  const { data, error } = await supabase
    .from('trip_requests')
    .insert({
      passenger_id: input.passengerId,
      origin_label: input.originCity,
      destination_label: input.destinationCity,
      origin,
      destination,
      departure_start: input.departureStart,
      departure_end: input.departureEnd,
      seats_needed: input.seatsNeeded,
      message: input.message ?? null,
      status: 'open',
      // Cap Maroc M2 : la demande hérite du pays de la ville de départ.
      country: findCity(input.originCity)?.country ?? 'TN',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function useCreateTripRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTripRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trip_requests'] });
    },
  });
}

/** Liste de mes demandes (en tant que passager). */
async function fetchMyTripRequests(userId: string): Promise<TripRequestRow[]> {
  const { data, error } = await supabase
    .from('trip_requests')
    .select('*')
    .eq('passenger_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function useMyTripRequests(userId: string | undefined) {
  return useQuery({
    queryKey: ['trip_requests', 'mine', userId],
    queryFn: () => fetchMyTripRequests(userId!),
    enabled: !!userId,
    staleTime: 15_000,
  });
}

/** Liste des demandes ouvertes du pays, visibles par les conducteurs (RLS filtre). */
async function fetchOpenTripRequests(opts: {
  excludeUserId?: string;
  limit?: number;
  country?: 'TN' | 'MA';
}) {
  let query = supabase
    .from('trip_requests')
    .select(
      `*,
       passenger:profiles!trip_requests_passenger_id_fkey(id, full_name, avatar_url, avatar_key, is_verified, rating_avg, level, role)`,
    )
    .eq('status', 'open')
    .eq('country', opts.country ?? 'TN')
    .gte('departure_end', new Date().toISOString())
    .order('departure_start', { ascending: true })
    .limit(opts.limit ?? 20);

  if (opts.excludeUserId) {
    query = query.neq('passenger_id', opts.excludeUserId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as TripRequestWithPassenger[];
}

export function useOpenTripRequests(
  opts: { excludeUserId?: string; limit?: number; country?: 'TN' | 'MA' } = {},
) {
  return useQuery({
    queryKey: ['trip_requests', 'open', opts.excludeUserId ?? null, opts.limit ?? null, opts.country ?? 'TN'],
    queryFn: () => fetchOpenTripRequests(opts),
    staleTime: 30_000,
  });
}

/** Annule une demande (par le passager qui l a creee). */
async function cancelTripRequest(requestId: string) {
  const { error } = await supabase
    .from('trip_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId);
  if (error) throw error;
}

export function useCancelTripRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelTripRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip_requests'] }),
  });
}
