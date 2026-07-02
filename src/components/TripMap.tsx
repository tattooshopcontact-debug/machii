/**
 * TripMap — carte du trajet (départ → arrivée).
 *
 * Décision cadrage #10 (map) + préparation #11 (partage temps réel).
 * Les coordonnées sont résolues côté client depuis les labels de villes
 * (constants/cities.ts) — pas besoin d'exposer les colonnes PostGIS.
 *
 * Le prop `livePosition` est prévu pour l'étape temps réel : quand il est
 * fourni, un marqueur voiture suit la position du conducteur.
 *
 * ⚠️ react-native-maps est chargé PARESSEUSEMENT (même leçon qu'expo-notifications) :
 * - Expo Go (SDK 53+) ne fournit plus Google Maps → l'import module-level
 *   ferait crasher tout l'écran de détail du trajet → schéma de repli.
 * - En build EAS/standalone, la clé Google Maps est injectée dans le manifest
 *   natif au build (app.json android.config.googleMaps.apiKey) ; elle n'est PAS
 *   lisible via Constants.expoConfig au runtime, donc on ne gate PAS dessus.
 *   La vraie MapView s'affiche. Garde-fou implicite : ne jamais retirer la clé
 *   de app.json (sinon la MapView crasherait nativement, non catchable en JS).
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform, StyleSheet, View } from 'react-native';

import { TripMapSchematic, type TripMapProps } from '@/components/TripMapSchematic';
import { Text } from '@/components/ui';
import { findCity } from '@/lib/geo';
import { colors, radius } from '@/theme';

type LatLng = { latitude: number; longitude: number };

// On ne charge la vraie carte QUE hors Expo Go : dans un build EAS, la clé
// Google Maps est injectée dans AndroidManifest.xml au build (app.json
// android.config.googleMaps.apiKey) — elle n'est PAS lisible via
// Constants.expoConfig au runtime, donc on ne peut pas s'appuyer dessus.
// Expo Go (SDK 53+) ne fournit plus Google Maps → schéma de repli.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let maps: typeof import('react-native-maps') | null = null;
if (!isExpoGo && Platform.OS !== 'web') {
  try {
    maps = require('react-native-maps') as typeof import('react-native-maps');
  } catch {
    maps = null;
  }
}

export function TripMap(props: TripMapProps) {
  const { originLabel, destinationLabel, livePosition, height = 180 } = props;

  if (!maps) {
    return <TripMapSchematic {...props} />;
  }

  const origin = findCity(originLabel);
  const destination = findCity(destinationLabel);

  // Ville inconnue → pas de carte plutôt qu'une carte fausse.
  if (!origin || !destination) {
    return null;
  }

  const MapView = maps.default;
  const { Marker, Polyline, PROVIDER_DEFAULT } = maps;

  const o: LatLng = { latitude: origin.lat, longitude: origin.lng };
  const d: LatLng = { latitude: destination.lat, longitude: destination.lng };

  // Region englobante avec marge.
  const midLat = (o.latitude + d.latitude) / 2;
  const midLng = (o.longitude + d.longitude) / 2;
  const latDelta = Math.max(Math.abs(o.latitude - d.latitude) * 1.6, 0.5);
  const lngDelta = Math.max(Math.abs(o.longitude - d.longitude) * 1.6, 0.5);

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: midLat,
          longitude: midLng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        liteMode
      >
        <Polyline
          coordinates={[o, d]}
          geodesic
          strokeColor={colors.primary}
          strokeWidth={3}
          lineDashPattern={[8, 6]}
        />
        <Marker coordinate={o} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.dot, { backgroundColor: colors.accentSecondary }]} />
        </Marker>
        <Marker coordinate={d} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        </Marker>
        {livePosition && (
          <Marker coordinate={livePosition} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.liveWrap}>
              <Text style={styles.liveCar}>🚗</Text>
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 2,
  },
  liveWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
  },
  liveCar: { fontSize: 16 },
});
