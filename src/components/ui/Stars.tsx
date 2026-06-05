import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, fontSize, spacing } from '@/theme';

import { Text } from './Text';

/** Affichage / saisie d'une note en étoiles. */
export function Stars({
  value,
  size = 18,
  onChange,
}: {
  value: number;
  size?: number;
  onChange?: (v: number) => void;
}) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value);
        const star = (
          <Text style={{ fontSize: size, color: filled ? colors.accent : colors.borderStrong }}>★</Text>
        );
        return onChange ? (
          <Pressable key={i} onPress={() => onChange(i)} hitSlop={6}>
            {star}
          </Pressable>
        ) : (
          <View key={i}>{star}</View>
        );
      })}
    </View>
  );
}

/** Barre de critère noté (Ponctualité, Propreté…) — style profil. */
export function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(value / 5) * 100}%` }]} />
      </View>
      <Text style={styles.barValue}>{value.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  barLabel: { width: 96, fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textSecondary },
  track: { flex: 1, height: 7, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 7, borderRadius: 4, backgroundColor: colors.accent },
  barValue: { width: 28, textAlign: 'right', fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
});
