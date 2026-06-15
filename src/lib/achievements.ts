/**
 * Achievements débloqués d'un utilisateur (#17).
 */
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

async function fetchMyAchievements(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('key')
    .eq('user_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.key));
}

export function useMyAchievements(userId: string | undefined) {
  return useQuery({
    queryKey: ['achievements', userId],
    queryFn: () => fetchMyAchievements(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}
