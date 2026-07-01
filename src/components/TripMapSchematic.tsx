/**
 * TripMapSchematic — représentation du trajet (départ → arrivée) SANS tuiles
 * cartographiques natives.
 *
 * Sert de rendu unique pour tous les environnements où react-native-maps
 * n'est pas utilisable : le web (via TripMap.web.tsx), Expo Go (SDK 53+ ne
 * fournit plus Google Maps) et les builds Android sans clé API Google Maps
 * (la MapView y ferait crasher l'app nativement, impossible à try/catch en JS).
 */
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { findCity } from '@/lib/geo';
import { colors, radius, spacing } from '@/theme';

type LatLng = { latitude: number; longitude: number };

export type TripMapProps = {
  originLabel: string;
  destinationLabel: string;
  /** Position temps réel du conducteur (étape MAP-2). */
  livePosition?: LatLng | null;
  height?: number;
};

export function TripMapSchematic({ originLabel, destinationLabel, height = 180 }: TripMapProps) {
  const origin = findCity(originLabel);
  const destination = findCity(destinationLabel);
  if (!origin || !destination) {
    return null;
  }

  return (
    <View style={[styles.wrap, { height }]}>
      <View style={styles.route}>
        <View style={styles.point}>
          <View style={[styles.dot, { backgroundColor: colors.accentSecondary }]} />
          <Text variant="bodyMedium" numberOfLines={1} style={styles.label}>{originLabel}</Text>
        </View>
        <View style={styles.line} />
        <View style={styles.point}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text variant="bodyMedium" numberOfLines={1} style={styles.label}>{destinationLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt ?? '#EEF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    maxWidth: '100%',
  },
  point: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  line: {
    flex: 1,
    minWidth: 40,
    height: 0,
    borderTopWidth: 3,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    opacity: 0.6,
  },
  label: { flexShrink: 1 },
});
