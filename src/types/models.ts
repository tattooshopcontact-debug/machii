/** Types métier Machii (front). Alignés sur le schéma Supabase (supabase/migrations). */

export type Role = 'passenger' | 'driver' | 'both';

export type TripStatus = 'open' | 'full' | 'ongoing' | 'done' | 'cancelled';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export type DriverSummary = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  avatarTint?: 'orange' | 'navy' | 'yellow';
  ratingAvg: number; // 0..5
  tripCount: number;
  isVerified: boolean;
  isNew?: boolean;
};

export type Trip = {
  id: string;
  driver: DriverSummary;
  origin: string;
  destination: string;
  /** Ville étape pour le "match intelligent" (waypoint), optionnelle. */
  via?: string;
  departureTime: string; // ISO
  seatsAvailable: number;
  seatsTotal: number;
  /** Prix suggéré par place en DT. 0 = gratuit. null = à négocier. */
  pricePerSeat: number | null;
  status: TripStatus;
  isRecurring?: boolean;
  /** Détour estimé en minutes pour un match waypoint. */
  detourMinutes?: number;
  /** Pays du trajet ('TN' | 'MA') — détermine la devise affichée. */
  country: 'TN' | 'MA';
  /** Trajet réservé aux femmes (M3 Cap Maroc). */
  womenOnly?: boolean;
};

export type Conversation = {
  id: string;
  tripId: string;
  withName: string;
  withTint?: 'orange' | 'navy' | 'yellow';
  lastMessage: string;
  lastAt: string; // ISO
  unread: number;
  online?: boolean;
};

export type RatingCriterion = {
  key: 'punctuality' | 'cleanliness' | 'driving' | 'friendliness';
  label: string;
  value: number; // 0..5
};

export type Achievement = {
  key: string;
  label: string;
  emoji: string;
  unlocked: boolean;
};

export type UserProfile = {
  id: string;
  fullName: string;
  phone: string;
  avatarUrl?: string | null;
  avatarTint?: 'orange' | 'navy' | 'yellow';
  /** Cle d un avatar Machii predefini (cf avatarsCatalog). Null = fallback initiale. */
  avatarKey?: string | null;
  /** Pays de l'utilisateur ('TN' | 'MA'), déduit du préfixe téléphonique. */
  country: 'TN' | 'MA';
  /** Genre, optionnel — sert au filtre "trajet entre femmes" (M3). */
  gender?: 'female' | 'male' | null;
  role: Role;
  isVerified: boolean;
  level: number;
  xp: number;
  xpForNextLevel: number;
  ratingAvg: number;
  criteria: RatingCriterion[];
  achievements: Achievement[];
  tags: string[];
};
