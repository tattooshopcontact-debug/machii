import { StyleSheet, View } from 'react-native';

import { colors, fonts, fontSize, palette, spacing } from '@/theme';

import { Text } from './Text';

type RoutePointsProps = {
  origin: string;
  destination: string;
  /** Étape intermédiaire (waypoint), optionnelle. */
  via?: string;
  compact?: boolean;
};

/** Timeline visuelle Départ → (Via) → Arrivée. */
export function RoutePoints({ origin, destination, via, compact = false }: RoutePointsProps) {
  const dot = compact ? 9 : 12;
  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={[styles.dot, { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: palette.orange }]} />
        <View style={styles.line} />
        {via ? (
          <>
            <View style={[styles.dot, { width: dot - 2, height: dot - 2, borderRadius: dot / 2, backgroundColor: colors.textMuted }]} />
            <View style={styles.line} />
          </>
        ) : null}
        <View style={[styles.dot, { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: palette.navy }]} />
      </View>
      <View style={styles.labels}>
        <Text style={[styles.city, compact && { fontSize: fontSize.sm }]}>{origin}</Text>
        {via ? <Text style={styles.via}>{via}</Text> : null}
        <Text style={[styles.city, compact && { fontSize: fontSize.sm }]}>{destination}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  rail: { alignItems: 'center', paddingTop: 5 },
  dot: {},
  line: { width: 2, flex: 1, minHeight: 18, backgroundColor: colors.borderStrong, marginVertical: 2 },
  labels: { flex: 1, justifyContent: 'space-between', gap: spacing.lg },
  city: { fontFamily: fonts.semibold, fontSize: fontSize.base, color: colors.textPrimary },
  via: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textSecondary },
});
