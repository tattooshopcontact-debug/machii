import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { fonts, palette, radius, spacing } from '@/theme';

import { Text } from './Text';

/** Bouclier « Vérifié » — icône seule (SVG). Jaune Machii + coche marine. */
export function ShieldIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* corps du bouclier */}
      <Path
        d="M12 1.8 L20 4.6 V11 C20 16.2 16.6 20.2 12 22.2 C7.4 20.2 4 16.2 4 11 V4.6 Z"
        fill={palette.yellow}
        stroke={palette.navy}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      {/* coche */}
      <Path
        d="M8.2 11.8 L11 14.5 L15.8 8.9"
        fill="none"
        stroke={palette.navy}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type Props = {
  /** Taille de l'icône bouclier. */
  size?: number;
  /** Affiche le libellé « Vérifié » à côté (badge complet). */
  label?: boolean;
  /** Texte du libellé (défaut « Vérifié »). */
  text?: string;
};

/** Badge « Vérifié » premium (bouclier + libellé), façon gage de confiance Airbnb. */
export function VerifiedShield({ size = 18, label = true, text = 'Vérifié' }: Props) {
  if (!label) return <ShieldIcon size={size} />;
  return (
    <View style={styles.badge}>
      <ShieldIcon size={size} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: 'rgba(255, 199, 44, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 199, 44, 0.55)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  text: { fontFamily: fonts.bold, fontSize: 13, color: palette.navy },
});
