import { StyleSheet, View } from 'react-native';

import { colors, fonts, fontSize, radius, spacing } from '@/theme';

import { Text } from './Text';

/**
 * Bannière légale PERMANENTE (décision #16 — loi tunisienne n° 2004-33).
 * Machii = plateforme de covoiturage GRATUIT. À afficher dans le chat et sur
 * les écrans où un arrangement financier est possible.
 *
 * ⚠️ Volet juridique non levé : le covoiturage payant est interdit en Tunisie.
 * Valider avec un avocat transport avant toute mise en ligne.
 */
export function LegalBanner({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.text}>
        {compact
          ? 'Machii est une plateforme de covoiturage gratuit. Les arrangements financiers relèvent de la seule responsabilité des utilisateurs.'
          : "Tout échange d'argent contre un service de transport est interdit par la loi tunisienne (loi n° 2004-33 du 19 avril 2004). Machii est une plateforme de covoiturage gratuit. Tout arrangement financier entre utilisateurs relève de leur seule responsabilité."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'flex-start',
  },
  icon: { fontSize: fontSize.sm, marginTop: 1 },
  text: { flex: 1, fontFamily: fonts.medium, fontSize: fontSize.xs, color: colors.primary, lineHeight: 16 },
});
