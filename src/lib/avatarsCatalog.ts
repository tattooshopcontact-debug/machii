/**
 * Catalogue des 8 avatars Machii et leurs conditions de deblocage.
 * Le user choisit son avatar dans Modifier mon profil. Les avatars vivent
 * dans le bundle (assets/avatars/*.png), pas dans Supabase Storage.
 *
 * Quand le user n a pas choisi d avatar (avatar_key null), on retombe sur
 * l initiale de son prenom dans un cercle colore (composant Avatar fallback).
 */
import type { Role } from '@/types/models';
import type { UserProfile } from '@/types/models';

export type AvatarKey =
  | 'voyageur'
  | 'regulier'
  | 'conducteur'
  | 'verifie'
  | 'confiance'
  | 'veteran'
  | 'ambassadeur'
  | 'legende';

export type AvatarEntry = {
  key: AvatarKey;
  label: string;
  desc: string;
  source: number; // require(...) handle
  /** Renvoie true si le user a debloque cet avatar. */
  isUnlocked: (user: UserProfile, stats: AvatarStats) => boolean;
  /** Message affiche quand verrouille (au lieu de la description). */
  unlockHint: string;
};

export type AvatarStats = {
  totalTrips: number;
  ratingAvg: number;
  isVerified: boolean;
};

export const AVATAR_CATALOG: AvatarEntry[] = [
  {
    key: 'voyageur',
    label: 'Voyageur',
    desc: 'Tu commences l\'aventure Machii.',
    source: require('../../assets/avatars/01_voyageur.png'),
    isUnlocked: () => true,
    unlockHint: '',
  },
  {
    key: 'regulier',
    label: 'Régulier',
    desc: 'Tu utilises Machii régulièrement.',
    source: require('../../assets/avatars/02_regulier.png'),
    isUnlocked: (u, s) => u.level >= 2 || s.totalTrips >= 3,
    unlockHint: 'Atteins le niveau 2 ou termine 3 trajets.',
  },
  {
    key: 'conducteur',
    label: 'Conducteur',
    desc: 'Tu prends la route en conducteur.',
    source: require('../../assets/avatars/03_conducteur.png'),
    isUnlocked: (u, s) =>
      (u.role === 'driver' || u.role === 'both') && (u.level >= 2 || s.totalTrips >= 3),
    unlockHint: 'Active le rôle conducteur + 3 trajets.',
  },
  {
    key: 'verifie',
    label: 'Vérifié',
    desc: 'Ton identité est confirmée par Machii.',
    source: require('../../assets/avatars/04_verifie.png'),
    isUnlocked: (u) => u.isVerified === true,
    unlockHint: 'Fais valider tes documents (Profil → Se faire vérifier).',
  },
  {
    key: 'confiance',
    label: 'Confiance',
    desc: 'Les autres utilisateurs te font confiance.',
    source: require('../../assets/avatars/05_confiance.png'),
    isUnlocked: (_u, s) => s.ratingAvg >= 4 && s.totalTrips >= 5,
    unlockHint: 'Note moyenne ≥ 4 sur 5 trajets minimum.',
  },
  {
    key: 'veteran',
    label: 'Vétéran',
    desc: 'Tu as déjà roulé partout en Tunisie.',
    source: require('../../assets/avatars/06_veteran.png'),
    isUnlocked: (_u, s) => s.totalTrips >= 50,
    unlockHint: 'Termine 50 trajets sur Machii.',
  },
  {
    key: 'ambassadeur',
    label: 'Ambassadeur',
    desc: 'Tu fais grandir la communauté Machii.',
    source: require('../../assets/avatars/07_ambassadeur.png'),
    isUnlocked: (u) => u.level >= 8,
    unlockHint: 'Atteins le niveau 8.',
  },
  {
    key: 'legende',
    label: 'Légende',
    desc: 'Le statut ultime sur Machii.',
    source: require('../../assets/avatars/08_legende.png'),
    isUnlocked: (u, s) => u.level >= 10 && s.ratingAvg >= 4.8,
    unlockHint: 'Niveau 10 + note moyenne ≥ 4.8.',
  },
];

export function findAvatar(key: string | null | undefined): AvatarEntry | undefined {
  if (!key) return undefined;
  return AVATAR_CATALOG.find((a) => a.key === key);
}
