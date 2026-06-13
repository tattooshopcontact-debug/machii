/**
 * Helpers Supabase pour les réservations (bookings).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type { BookingStatus } from '@/types/models';

type BookingRow = Database['public']['Tables']['bookings']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type TripRow = Database['public']['Tables']['trips']['Row'];

export type BookingWithRelations = BookingRow & {
  trip: (TripRow & { driver?: ProfileRow | null }) | null;
  passenger: ProfileRow | null;
};

/** Crée une demande de réservation pour le user courant. */
async function createBooking(tripId: string, passengerId: string, seats = 1): Promise<BookingRow> {
  const { data, error } = await supabase
    .from('bookings')
    .insert({ trip_id: tripId, passenger_id: passengerId, seats_booked: seats, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, passengerId, seats }: { tripId: string; passengerId: string; seats?: number }) =>
      createBooking(tripId, passengerId, seats),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

/**
 * Bookings où le user courant est le passager (demandes que j'ai faites).
 */
async function fetchMyOutgoingBookings(passengerId: string): Promise<BookingWithRelations[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, trip:trips(*, driver:profiles!trips_driver_id_fkey(*)), passenger:profiles!bookings_passenger_id_fkey(*)')
    .eq('passenger_id', passengerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as unknown as BookingWithRelations[];
}

export function useMyOutgoingBookings(passengerId: string | undefined) {
  return useQuery({
    queryKey: ['bookings', 'outgoing', passengerId],
    queryFn: () => fetchMyOutgoingBookings(passengerId!),
    enabled: !!passengerId,
    staleTime: 15_000,
  });
}

/**
 * Bookings dont le user courant est le conducteur (demandes que je reçois).
 * Repose sur la RLS qui autorise le driver à voir les bookings de ses trips.
 */
async function fetchMyIncomingBookings(driverId: string): Promise<BookingWithRelations[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, trip:trips!inner(*), passenger:profiles!bookings_passenger_id_fkey(*)')
    .eq('trip.driver_id', driverId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as unknown as BookingWithRelations[];
}

export function useMyIncomingBookings(driverId: string | undefined) {
  return useQuery({
    queryKey: ['bookings', 'incoming', driverId],
    queryFn: () => fetchMyIncomingBookings(driverId!),
    enabled: !!driverId,
    staleTime: 15_000,
  });
}

/** Conducteur : accepte ou refuse une demande. */
async function setBookingStatus(bookingId: string, status: BookingStatus): Promise<BookingRow> {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: BookingStatus }) =>
      setBookingStatus(bookingId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

/**
 * Conducteur : confirme la prise en charge d'un passager en saisissant son code
 * à 4 chiffres (#12-B). La RPC vérifie côté serveur que l'appelant est bien le
 * conducteur du trajet et que le code correspond.
 */
async function confirmPickup(bookingId: string, code: string): Promise<void> {
  const { data, error } = await supabase.rpc('confirm_pickup', {
    p_booking_id: bookingId,
    p_code: code,
  });
  if (error) throw error;
  const res = data as { ok: boolean; reason?: string } | null;
  if (!res?.ok) {
    const reasons: Record<string, string> = {
      not_found: 'Réservation introuvable.',
      not_driver: "Seul le conducteur du trajet peut confirmer.",
      not_accepted: "Cette réservation n'est pas acceptée.",
      bad_code: 'Code incorrect. Vérifie les 4 chiffres avec ton passager.',
    };
    throw new Error(reasons[res?.reason ?? ''] ?? 'Confirmation impossible.');
  }
}

export function useConfirmPickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, code }: { bookingId: string; code: string }) =>
      confirmPickup(bookingId, code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

/**
 * Passager OU conducteur : confirme l'arrivée à destination (#11-C). Termine la
 * réservation et horodate `arrived_at`. Côté passager, c'est le signal "je suis
 * bien arrivé(e)" qui désamorce l'alerte fallback (à venir).
 */
async function confirmArrival(bookingId: string): Promise<void> {
  const { data, error } = await supabase.rpc('confirm_arrival', { p_booking_id: bookingId });
  if (error) throw error;
  const res = data as { ok: boolean; reason?: string } | null;
  if (!res?.ok) {
    const reasons: Record<string, string> = {
      not_found: 'Réservation introuvable.',
      not_participant: "Tu n'es pas un participant de ce trajet.",
      not_accepted: "Cette réservation n'est pas active.",
      not_picked_up: "La prise en charge n'a pas encore été confirmée.",
    };
    throw new Error(reasons[res?.reason ?? ''] ?? "Confirmation d'arrivée impossible.");
  }
}

export function useConfirmArrival() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId }: { bookingId: string }) => confirmArrival(bookingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
