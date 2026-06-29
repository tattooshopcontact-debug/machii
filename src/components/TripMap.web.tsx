/**
 * TripMap (version WEB) — react-native-maps ne fonctionne pas dans un navigateur.
 * On affiche une représentation propre du trajet (départ → arrivée) sans tuiles
 * cartographiques natives. La carte interactive reste dans l'app mobile.
 *
 * Même interface que TripMap.tsx (résolution native) → Metro choisit ce fichier
 * automatiquement sur le web (.web.tsx).
 */
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { findCity } from '@/lib/geo';
import { colors, radius, spacing } from '@/theme';

type LatLng = { latitude: number; longitude: number };

type TripMapProps = {
  originLabel: string;
  destinationLabel: string;
  livePosition?: LatLng | null;
  height?: number;
};

export function TripMap({ originLabel, destinationLabel, height = 180 }: TripMapProps) {
  const origin = findCity(originLabel);
  const destination = findCity(destinationLabel);
  if (!origin || !destination) {
    return null;
  }

  return (
    <View style={[styles.wrap, { height }]}>
      {/* fond façon carte (grille douce) */}
      <View style={styles.grid} pointerEvents="none" />
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
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
    // léger damier via bordures multiples simulées par un fond uni discret
    backgroundColor: 'transparent',
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
