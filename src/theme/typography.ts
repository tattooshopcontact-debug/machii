import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

/** Map nom de poids -> fichier de police, passé à useFonts(). */
export const interFontMap = {
  Jakarta_400Regular: PlusJakartaSans_400Regular,
  Jakarta_500Medium: PlusJakartaSans_500Medium,
  Jakarta_600SemiBold: PlusJakartaSans_600SemiBold,
  Jakarta_700Bold: PlusJakartaSans_700Bold,
  Jakarta_800ExtraBold: PlusJakartaSans_800ExtraBold,
} as const;

/**
 * Familles utilisées dans les styles.
 * Police : Plus Jakarta Sans (handoff design Style A) — sans humaniste géométrique
 * avec un 800 fort pour les titres et plaques.
 */
export const fonts = {
  regular: 'Jakarta_400Regular',
  medium: 'Jakarta_500Medium',
  semibold: 'Jakarta_600SemiBold',
  bold: 'Jakarta_700Bold',
  heavy: 'Jakarta_800ExtraBold',
} as const;

/** Échelle typographique Machii. */
export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  display: 38,
} as const;

export const lineHeight = {
  tight: 1.15,
  normal: 1.4,
  relaxed: 1.55,
} as const;

export type FontFamily = keyof typeof fonts;
