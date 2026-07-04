import { StyleSheet, View } from 'react-native';

import { colors, fonts, fontSize, spacing } from '@/theme';

import { GlossyDot } from './GlossyDot';
import { Text } from './Text';

type RoutePointsProps = {
  origin: string;
  destination: string;
  /** Étape intermédiaire (waypoint), optionnelle. */
  via?: string;
  compact?: boolean;
  /** Affiche les libellés DÉPART / ARRIVÉE au-dessus des villes (écran détail). */
  labels?: boolean;
};

/**
 * Timeline visuelle Départ → (Via) → Arrivée — style pack design :
 * dots glossy 3D (bleu départ, orange arrivée) reliés par un pointillé.
 */
export function RoutePoints({ origin, destination, via, compact = false, labels = false }: RoutePointsProps) {
  const dot = compact ? 10 : 15;
  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <GlossyDot tint="navy" size={dot} />
        <View style={styles.line} />
        {via ? (
          <>
            <GlossyDot tint="yellow" size={dot - 3} />
            <View style={styles.line} />
          </>
        ) : null}
        <GlossyDot tint="orange" size={dot} />
      </View>
      <View style={styles.labels}>
        <View>
          {labels && <Text style={styles.pointLabel}>Départ</Text>}
          <Text style={[styles.city, compact && { fontSize: fontSize.sm }, labels && styles.cityBig]}>
            {origin}
          </Text>
        </View>
        {via ? <Text style={styles.via}>{via}</Text> : null}
        <View>
          {labels && <Text style={styles.pointLabel}>Arrivée</Text>}
          <Text style={[styles.city, compact && { fontSize: fontSize.sm }, labels && styles.cityBig]}>
            {destination}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  rail: { alignItems: 'center', paddingTop: 5, paddingBottom: 3 },
  line: {
    width: 0,
    flex: 1,
    minHeight: 16,
    borderLeftWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(136,136,136,0.45)',
    marginVertical: 3,
  },
  labels: { flex: 1, justifyContent: 'space-between', gap: spacing.lg },
  city: { fontFamily: fonts.semibold, fontSize: fontSize.base, color: colors.textPrimary },
  cityBig: { fontFamily: fonts.heavy, fontSize: 18, letterSpacing: -0.2, color: colors.textPrimary },
  pointLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  via: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textSecondary },
});
