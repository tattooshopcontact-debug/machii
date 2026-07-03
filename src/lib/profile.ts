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

const TINTS: NonNullable<UserProfile['avatarTint']>[] = ['orange', 'navy', 'yellow'];

function pickTint(id: string): NonNullable<UserProfile['avatarTint']> {
  const idx = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % TINTS.length;
  return TINTS[idx];
}

function xpForLevel(level: number): number {
  // Courbe simple : 200 XP au niveau 1, +200 par niveau.
  return 200 + Math.max(0, level - 1) * 200;
}

export function mapProfileFromDb(row: ProfileRow): UserProfile {
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

/** Profil public d'un autre utilisateur (lecture seule, pour l'écran /user/[id]). */
export function usePublicProfile(id?: string) {
  return useQuery({
    queryKey: ['publicProfile', id],
    enabled: !!id,
    staleTime: 60_000,
    queryFn: async (): Promise<UserProfile & { createdAt: string | null }> => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Profil introuvable');
      return { ...mapProfileFromDb(data as ProfileRow), createdAt: (data as ProfileRow).created_at ?? null };
    },
  });
}
