/**
 * Catalogue des 8 achievements (#17). Le déblocage est géré côté serveur
 * (migration 0028) ; ici on ne décrit que l'affichage.
 */
export type AchievementDef = {
  key: string;
  label: string;
  emoji: string;
  description: string;
  /** true = débloqué automatiquement, false = événementiel (accordé à la main). */
  auto: boolean;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: 'founding_member', label: 'Founding Member', emoji: '🏆', description: 'Parmi les 100 premiers Machii', auto: true },
  { key: 'triple_axe', label: 'Triple Axe', emoji: '⭐', description: 'Trajets terminés sur 3 villes différentes', auto: true },
  { key: 'coeur_genereux', label: 'Cœur Généreux', emoji: '💛', description: '3 trajets proposés gratuitement', auto: true },
  { key: 'fiable', label: 'Fiable', emoji: '🛡️', description: '5 trajets menés à terme', auto: true },
  { key: 'excellence', label: 'Excellence', emoji: '⚡', description: 'Note moyenne ≥ 4,8 sur 5 avis', auto: true },
  { key: 'aid', label: 'Aïd', emoji: '🌙', description: "Un trajet pendant l'Aïd", auto: false },
  { key: 'ramadan', label: 'Ramadan', emoji: '📿', description: 'Un trajet pendant le Ramadan', auto: false },
  { key: 'independance', label: 'Indépendance', emoji: '🇹🇳', description: 'Un trajet le jour de la fête nationale', auto: false },
];
