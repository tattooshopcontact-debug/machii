/**
 * Partage de trajet à un proche (décision cadrage #11-B).
 *
 * 1 tap : crée un lien web public valable 4 h + active le partage de position
 * (foreground) + ouvre la feuille de partage native. Le proche ouvre le lien
 * sans compte et suit le trajet en direct sur machii share.html.
 */
import { Share } from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/** Page publique hébergée sur GitHub Pages (repo machii / docs). */
const SHARE_BASE_URL = 'https://tattooshopcontact-debug.github.io/machii/share.html';

export type ShareLink = {
  id: string;
  token: string;
  url: string;
  expiresAt: string;
};

async function createShareLink(tripId: string, userId: string): Promise<ShareLink> {
  const { data, error } = await supabase
    .from('trip_share_links')
    .insert({ trip_id: tripId, user_id: userId })
    .select('id, token, expires_at')
    .single();
  if (error) throw error;
  return {
    id: data.id,
    token: data.token,
    url: `${SHARE_BASE_URL}?t=${encodeURIComponent(data.token)}`,
    expiresAt: data.expires_at,
  };
}

export function useShareTrip() {
  return useMutation({
    mutationFn: async ({
      tripId,
      userId,
      originLabel,
      destinationLabel,
    }: {
      tripId: string;
      userId: string;
      originLabel: string;
      destinationLabel: string;
    }) => {
      const link = await createShareLink(tripId, userId);
      // Feuille de partage native (WhatsApp, SMS, etc.)
      await Share.share({
        message:
          `Je suis en covoiturage ${originLabel} → ${destinationLabel} avec Machii. ` +
          `Suis mon trajet en direct (4h) : ${link.url}`,
      });
      return link;
    },
  });
}
