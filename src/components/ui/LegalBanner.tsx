import { StyleSheet, View } from 'react-native';

import { colors, fonts, fontSize, radius, spacing } from '@/theme';

import { Text } from './Text';

/**
 * Bannière légale PERMANENTE (décision #16), adaptée au pays de l'utilisateur.
 *
 * TN : loi n° 2004-33 — seul le covoiturage GRATUIT est autorisé.
 * MA : pas de texte spécifique (audit 2026-06) — positionnement strict
 *      « partage de frais entre particuliers, sans profit » (zone grise
 *      tolérée, précédent Pip Pip Yalah).
 *
 * ⚠️ Wording à faire valider par un avocat transport dans chaque pays
 * avant le lancement public.
 */
const WORDING: Record<'TN' | 'MA', { compact: string; full: string }> = {
  TN: {
    compact:
      'Machii est une plateforme de covoiturage gratuit. Les arrangements financiers relèvent de la seule responsabilité des utilisateurs.',
    full:
      "Tout échange d'argent contre un service de transport est interdit par la loi tunisienne (loi n° 2004-33 du 19 avril 2004). Machii est une plateforme de covoiturage gratuit. Tout arrangement financier entre utilisateurs relève de leur seule responsabilité.",
  },
  MA: {
    compact:
      'Machii met en relation des particuliers pour du covoiturage avec partage de frais, sans but lucratif.',
    full:
      "Le covoiturage sur Machii est un partage de frais entre particuliers, sans but lucratif : la contribution demandée ne peut pas dépasser les frais réels du trajet (carburant, péage). Le transport rémunéré de personnes sans agrément est interdit au Maroc. Machii n'est pas un transporteur.",
  },
};

export function LegalBanner({
  compact = false,
  country = 'TN',
}: {
  compact?: boolean;
  country?: 'TN' | 'MA';
}) {
  const w = WORDING[country] ?? WORDING.TN;
  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.text}>{compact ? w.compact : w.full}</Text>
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
