/**
 * Mapping entre la table Supabase `profiles` et le type front `UserProfile`.
 *
 * En V0 (basique), beaucoup de champs front (criteria, achievements, xpForNextLevel,
 * avatarTint…) n'existent pas encore en DB. On les remplit avec des valeurs neutres,
 * à étoffer dans les prochaines versions.
 */
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
    role: row.role,
    isVerified: row.is_verified,
    level: row.level,
    xp: row.xp,
    xpForNextLevel: xpForLevel(row.level),
    ratingAvg: Number(row.rating_avg ?? 0),
    criteria: [],
    achievements: [],
    tags: row.tags ?? [],
  };
}
