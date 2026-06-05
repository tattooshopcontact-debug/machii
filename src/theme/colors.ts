/**
 * Machii — Palette officielle (figée, source : Master Prompt Machii / Notion 2026-05-05).
 * Ne PAS modifier ces 9 teintes sans validation. Elles gouvernent toute l'identité.
 */
export const palette = {
  /** Primaire — bleu profond (headers, texte fort) */
  navy: '#1B3D6E',
  /** Bleu nuit (frames device, fonds sombres) */
  navyDark: '#0F2647',
  /** Accent CTA — jaune chaud (boutons, accents) */
  yellow: '#FFD400',
  /** Accent secondaire — orange chaud (avatars, points) */
  orange: '#F18A4D',
  /** Fond clair — crème (fond des cards / écrans) */
  cream: '#FAF7F2',
  /** Surface — blanc */
  white: '#FFFFFF',
  /** Texte secondaire — gris doux */
  gray: '#888888',
  /** Succès — vert */
  green: '#4ADE80',
  /** Urgence — rouge SOS */
  sos: '#C92A2A',

  // Gradients 3D (handoff Style A) — highlights (hi) et ombres (lo)
  blueHi: '#2A5A98',
  blueLo: '#0F2A52',
  yellowHi: '#FFE85A',
  yellowLo: '#E5B800',
  orangeHi: '#FFA76B',
  orangeLo: '#D86A2E',
  ink: '#1A1A1A',
  /** Texte/icônes posés sur surface jaune. */
  onYellow: '#3A2A00',
} as const;

/** Couleurs sémantiques dérivées (usage dans les composants). */
export const colors = {
  primary: palette.navy,
  primaryDark: palette.navyDark,
  accent: palette.yellow,
  accentSecondary: palette.orange,

  background: palette.cream,
  surface: palette.white,
  surfaceAlt: palette.cream,

  textPrimary: palette.navy,
  textOnPrimary: palette.white,
  textSecondary: palette.gray,
  textMuted: '#A8A8A8',

  success: palette.green,
  danger: palette.sos,
  warning: palette.orange,

  border: '#ECE7DF',
  borderStrong: '#D9D2C6',

  // Voiles & overlays
  scrim: 'rgba(15, 38, 71, 0.55)',
  yellowGlow: 'rgba(255, 212, 0, 0.35)',
} as const;

export type ColorName = keyof typeof colors;
