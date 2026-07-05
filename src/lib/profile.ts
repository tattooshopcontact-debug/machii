/**
 * Mapping entre la table Supabase `profiles` et le type front `UserProfile`.
 *
 * En V0 (basique), beaucoup de champs front (criteria, achievements, xpForNextLevel,
 * avatarTint…) n'existent pas encore en DB. On les remplit avec des valeurs neutres,
 * à étoffer dans les prochaines versions.
 */
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type { UserProfile } from '@/types/models';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/**
 * Colonnes lues sur son propre profil — SANS `phone` (jamais lu en SELECT,
 * réinjecté localement par le store). Prépare la re-restriction du grant
 * colonne-par-colonne (migration 0052, à appliquer APRÈS le rollout du
 * build final — sinon 42501 sur les vieux builds qui font SELECT *).
 */
export const PROFILE_COLS_NO_PHONE =
  'id,full_name,avatar_url,avatar_key,role,is_verified,is_admin,rating_avg,level,xp,bio,tags,country,gender,city,referral_code,referred_by,created_at';

const TINTS: NonNullable<UserProfile['avatarTint']>[] = ['orange', 'navy', 'yellow'];

function pickTint(id: string): NonNullable<UserProfile['avatarTint']> {
  const idx = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % TINTS.length;
  return TINTS[idx];
}

function xpForLevel(level: number): number {
  // Courbe simple : 200 XP au niveau 1, +200 par niveau.
  return 200 + Math.max(0, level - 1) * 200;
}

export function mapProfileFromDb(row: Omit<ProfileRow, 'phone'> & { phone?: string | null }): UserProfile {
  return {
    id: row.id,
    fullName: row.full_name || 'Utilisateur',
    phone: row.phone ?? '',
    avatarUrl: row.avatar_url,
    avatarTint: pickTint(row.id),
    avatarKey: row.avatar_key,
    country: row.country ?? 'TN',
    gender: row.gender ?? null,
    role: row.role,
    isVerified: row.is_verified,
    isAdmin: row.is_admin ?? false,
    level: row.level,
    xp: row.xp,
    xpForNextLevel: xpForLevel(row.level),
    ratingAvg: Number(row.rating_avg ?? 0),
    criteria: [],
    achievements: [],
    tags: row.tags ?? [],
  };
}

/** Données publiques d'un membre (pop-up profil conducteur, façon Airbnb). */
export type PublicProfileData = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  avatarKey: string | null;
  avatarTint: NonNullable<UserProfile['avatarTint']>;
  isVerified: boolean;
  level: number;
  ratingAvg: number;
  bio: string | null;
  city: string | null;
  prefSmoking: boolean;
  prefMusic: boolean;
  prefPets: boolean;
  prefChat: 'quiet' | 'normal' | 'chatty' | null;
  createdAt: string | null;
  tripCount: number;
  ratingCount: number;
  /** Véhicule public du conducteur (jamais la plaque NI la photo). null si non renseigné. */
  vehicle: {
    make: string | null;
    model: string | null;
    color: string | null;
    seats: number | null;
  } | null;
};

/**
 * Profil public d'un autre utilisateur (lecture seule, pour l'écran /user/[id]).
 * Passe par la RPC `get_public_profile` (SECURITY DEFINER) : colonnes publiques
 * uniquement, jamais le téléphone — même source que le site.
 */
export function usePublicProfile(id?: string) {
  return useQuery({
    queryKey: ['publicProfile', id],
    enabled: !!id,
    staleTime: 60_000,
    queryFn: async (): Promise<PublicProfileData> => {
      const { data, error } = await supabase.rpc('get_public_profile', { p_user_id: id! });
      if (error) throw error;
      if (!data) throw new Error('Profil introuvable');
      const r = data as Record<string, unknown>;
      return {
        id: String(r.id),
        fullName: (r.full_name as string) || 'Utilisateur',
        avatarUrl: (r.avatar_url as string) ?? null,
        avatarKey: (r.avatar_key as string) ?? null,
        avatarTint: pickTint(String(r.id)),
        isVerified: Boolean(r.is_verified),
        level: Number(r.level ?? 1),
        ratingAvg: Number(r.rating_avg ?? 0),
        bio: (r.bio as string) ?? null,
        city: (r.city as string) ?? null,
        prefSmoking: Boolean(r.pref_smoking),
        prefMusic: r.pref_music == null ? true : Boolean(r.pref_music),
        prefPets: Boolean(r.pref_pets),
        prefChat: (r.pref_chat as PublicProfileData['prefChat']) ?? null,
        createdAt: (r.created_at as string) ?? null,
        tripCount: Number(r.trip_count ?? 0),
        ratingCount: Number(r.rating_count ?? 0),
        vehicle: (() => {
          const v = r.vehicle as Record<string, unknown> | null;
          if (!v) return null;
          return {
            make: (v.make as string) ?? null,
            model: (v.model as string) ?? null,
            color: (v.color as string) ?? null,
            seats: v.seats == null ? null : Number(v.seats),
          };
        })(),
      };
    },
  });
}
