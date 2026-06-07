/**
 * Helpers SOS — contacts d'urgence + déclenchement alerte.
 *
 * Au tap SOS :
 *   1) On lit la position GPS (expo-location)
 *   2) On insère une ligne sos_events (trace côté DB)
 *   3) On compose un SMS prérempli pour les contacts (expo-sms)
 *      "🚨 Je suis dans un trajet Machii et j'ai besoin d'aide.
 *       Position : https://maps.google.com/?q=<lat>,<lng>"
 */
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type EmergencyContact = {
  id: string;
  userId: string;
  name: string;
  phone: string;
  createdAt: string;
};

type RawContact = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  created_at: string;
};

function mapContact(r: RawContact): EmergencyContact {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    phone: r.phone,
    createdAt: r.created_at,
  };
}

async function fetchMyContacts(userId: string): Promise<EmergencyContact[]> {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as unknown as RawContact[]).map(mapContact);
}

export function useMyEmergencyContacts(userId: string | undefined) {
  return useQuery({
    queryKey: ['emergency_contacts', userId],
    queryFn: () => fetchMyContacts(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useAddEmergencyContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; name: string; phone: string }) => {
      const { error } = await supabase
        .from('emergency_contacts')
        .insert({ user_id: input.userId, name: input.name, phone: input.phone });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['emergency_contacts', vars.userId] });
    },
  });
}

export function useDeleteEmergencyContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { contactId: string; userId: string }) => {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', input.contactId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['emergency_contacts', vars.userId] });
    },
  });
}

export type SosResult = {
  smsAvailable: boolean;
  sent: boolean;
  lat: number | null;
  lng: number | null;
};

/**
 * Déclenche l'alerte SOS : enregistre l'événement + ouvre l'app SMS prérempli
 * avec tous les contacts d'urgence en destinataires.
 */
export async function triggerSos(input: {
  userId: string;
  tripId: string | null;
  contacts: EmergencyContact[];
}): Promise<SosResult> {
  let lat: number | null = null;
  let lng: number | null = null;
  // GPS best effort — si la permission est refusée on continue sans coordonnées.
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.granted) {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    }
  } catch {
    /* no-op : si GPS impossible, on envoie sans coordonnées */
  }

  // Trace l'événement côté DB.
  const point = lat != null && lng != null ? `SRID=4326;POINT(${lng} ${lat})` : null;
  await supabase
    .from('sos_events')
    .insert({ profile_id: input.userId, trip_id: input.tripId, location: point });

  // Compose et envoie le SMS.
  const mapUrl = lat != null && lng != null
    ? `https://maps.google.com/?q=${lat},${lng}`
    : 'position GPS indisponible';
  const message = `🚨 Je suis dans un trajet Machii et j'ai besoin d'aide.\nPosition : ${mapUrl}`;

  const phones = input.contacts.map((c) => c.phone).filter(Boolean);
  if (phones.length === 0) return { smsAvailable: false, sent: false, lat, lng };

  // Fallback : si SMS API indisponible (web, simulateur), on ouvre tel:
  const smsAvailable = await SMS.isAvailableAsync();
  if (!smsAvailable) {
    await Linking.openURL(`tel:197`);
    return { smsAvailable: false, sent: false, lat, lng };
  }

  const { result } = await SMS.sendSMSAsync(phones, message);
  return { smsAvailable: true, sent: result === 'sent', lat, lng };
}
