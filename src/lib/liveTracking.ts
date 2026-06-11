/**
 * Partage de position en temps réel (décision cadrage #11, opt-in).
 *
 * Côté conducteur : useShareLivePosition démarre un watcher expo-location
 * FOREGROUND uniquement (pas de background tracking — évite la déclaration
 * localisation arrière-plan du Play Store) et upsert la position dans
 * trip_live_positions toutes les ~10 s / 100 m.
 *
 * Côté passager : useLivePosition s'abonne au Realtime Supabase sur la ligne
 * du conducteur et renvoie la dernière position connue.
 */
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type LivePoint = {
  latitude: number;
  longitude: number;
  updatedAt: string;
};

/**
 * Conducteur : toggle de partage de position pour un trajet.
 * Retourne { sharing, start, stop, error }.
 */
export function useShareLivePosition(tripId: string | undefined, userId: string | undefined) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watcher = useRef<Location.LocationSubscription | null>(null);

  const stop = useCallback(async () => {
    watcher.current?.remove();
    watcher.current = null;
    setSharing(false);
    // Efface la position pour ne pas laisser un point fantôme.
    if (tripId && userId) {
      await supabase.from('trip_live_positions').delete().match({ trip_id: tripId, user_id: userId });
    }
  }, [tripId, userId]);

  const start = useCallback(async () => {
    if (!tripId || !userId) return;
    setError(null);
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) {
      setError("Autorise la localisation pour partager ta position.");
      return;
    }
    watcher.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10_000,
        distanceInterval: 100,
      },
      async (pos) => {
        await supabase.from('trip_live_positions').upsert(
          {
            trip_id: tripId,
            user_id: userId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: pos.coords.speed ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'trip_id,user_id' },
        );
      },
    );
    setSharing(true);
  }, [tripId, userId]);

  // Nettoie le watcher si l'écran est quitté.
  useEffect(() => {
    return () => {
      watcher.current?.remove();
      watcher.current = null;
    };
  }, []);

  return { sharing, start, stop, error };
}

/**
 * Passager : position live du conducteur d'un trajet (null si pas de partage).
 * S'abonne au Realtime et se met à jour automatiquement.
 */
export function useLivePosition(tripId: string | undefined, driverId: string | undefined) {
  const [point, setPoint] = useState<LivePoint | null>(null);

  useEffect(() => {
    if (!tripId || !driverId) return;

    let cancelled = false;

    // Position initiale (si le conducteur partage déjà).
    supabase
      .from('trip_live_positions')
      .select('lat, lng, updated_at')
      .match({ trip_id: tripId, user_id: driverId })
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) {
          setPoint({ latitude: data.lat, longitude: data.lng, updatedAt: data.updated_at });
        }
      });

    // Abonnement temps réel.
    const channel = supabase
      .channel(`live:${tripId}:${driverId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_live_positions',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setPoint(null);
            return;
          }
          const row = payload.new as { user_id: string; lat: number; lng: number; updated_at: string };
          if (row.user_id === driverId) {
            setPoint({ latitude: row.lat, longitude: row.lng, updatedAt: row.updated_at });
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [tripId, driverId]);

  return point;
}
