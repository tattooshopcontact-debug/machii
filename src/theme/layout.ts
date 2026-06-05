import { Platform, ViewStyle } from 'react-native';

import { palette } from './colors';

/** Espacement (échelle 4pt). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Rayons d'arrondi. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

/**
 * Ombres "3D subtil" — l'ADN visuel Machii (cards surélevées, cascade douce).
 * Cross-platform : iOS shadow* + Android elevation.
 */
function shadow(elevation: number, opacity: number, radiusPx: number, offsetY: number): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: palette.navyDark,
      shadowOpacity: opacity,
      shadowRadius: radiusPx,
      shadowOffset: { width: 0, height: offsetY },
    },
    android: { elevation },
    default: {},
  }) as ViewStyle;
}

export const shadows = {
  /** Card posée. */
  card: shadow(3, 0.1, 12, 6),
  /** Card flottante (carte de recherche, FAB). */
  floating: shadow(8, 0.18, 22, 12),
  /** Bouton CTA jaune surélevé. */
  cta: shadow(6, 0.22, 14, 8),
  /** Halo chaud autour des éléments jaunes. */
  glow: Platform.select<ViewStyle>({
    ios: {
      shadowColor: palette.yellow,
      shadowOpacity: 0.5,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 0 },
    },
    android: { elevation: 6 },
    default: {},
  }) as ViewStyle,
} as const;

/** Hauteur de la bottom-nav (pour les paddings de scroll). */
export const TAB_BAR_HEIGHT = 64;
