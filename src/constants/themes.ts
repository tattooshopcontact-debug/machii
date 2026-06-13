/**
 * Thèmes débloquables + paliers de niveau (décision #17).
 * Les paliers d'XP sont alignés sur la fonction serveur `_level_for_xp`
 * (migration 0026) : L1 0 · L2 100 · L3 300 · L4 600 · L5 1000.
 *
 * Pour l'instant l'écran de progression AFFICHE l'état (débloqué / verrouillé) ;
 * l'application visuelle des thèmes (repeindre l'app) viendra plus tard.
 */

/** Seuils d'XP cumulés par niveau (index 0 = niveau 1). */
export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000] as const;

/** Niveau (1..5) pour un XP donné. */
export function levelForXp(xp: number): number {
  let lvl = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) lvl = i + 1;
  }
  return lvl;
}

/** Progression vers le niveau suivant : { current, next, into, span, remaining, ratio, isMax }. */
export function levelProgress(xp: number) {
  const level = levelForXp(xp);
  const isMax = level >= LEVEL_THRESHOLDS.length;
  const base = LEVEL_THRESHOLDS[level - 1];
  const next = isMax ? base : LEVEL_THRESHOLDS[level];
  const span = isMax ? 1 : next - base;
  const into = xp - base;
  const remaining = isMax ? 0 : next - xp;
  const ratio = isMax ? 1 : Math.min(1, Math.max(0, into / span));
  return { level, next, into, span, remaining, ratio, isMax };
}

export type ThemeDef = {
  key: string;
  label: string;
  xpRequired: number;
  /** 3 couleurs principales pour l'aperçu (bandes). */
  swatches: [string, string, string];
};

/** Les 5 thèmes (décision #17 + Annexe 3). */
export const THEMES: ThemeDef[] = [
  { key: 'original', label: 'Original', xpRequired: 0, swatches: ['#1B3D6E', '#FFD400', '#F8F4EC'] },
  { key: 'nature', label: 'Nature', xpRequired: 100, swatches: ['#1F5C3D', '#C9A227', '#F2EFE6'] },
  { key: 'moderne', label: 'Moderne', xpRequired: 300, swatches: ['#13294B', '#FF6B5E', '#EEF1F5'] },
  { key: 'premium', label: 'Premium', xpRequired: 600, swatches: ['#5B1A2B', '#D4AF37', '#F4ECEC'] },
  { key: 'sahara', label: 'Sahara', xpRequired: 1000, swatches: ['#C2A06B', '#0F2647', '#F6EEDF'] },
];
