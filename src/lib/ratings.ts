/**
 * Helpers Supabase pour les notations post-trajet (4 critères : 1-5 chacun).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type RatingCriteria = {
  punctuality: number; // 1-5
  cleanliness: number;
  driving: number;
  friendliness: number;
};

export async function insertRating(input: {
  tripId: string;
  raterId: string;
  rateeId: string;
  criteria: RatingCriteria;
}) {
  const { error } = await supabase.from('ratings').insert({
    trip_id: input.tripId,
    rater_id: input.raterId,
    ratee_id: input.rateeId,
    punctuality: input.criteria.punctuality,
    cleanliness: input.criteria.cleanliness,
    driving: input.criteria.driving,
    friendliness: input.criteria.friendliness,
  });
  if (error) throw error;
}

export function useInsertRating() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: insertRating,
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['ratings'] });
      qc.invalidateQueries({ queryKey: ['ratings', vars.tripId] });
    },
  });
}

/** True si j'ai déjà noté ce ratee sur ce trip. */
async function checkExistingRating(input: { tripId: string; raterId: string; rateeId: string }) {
  const { data, error } = await supabase
    .from('ratings')
    .select('id')
    .eq('trip_id', input.tripId)
    .eq('rater_id', input.raterId)
    .eq('ratee_id', input.rateeId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export function useHasAlreadyRated(input?: { tripId: string; raterId: string; rateeId: string }) {
  return useQuery({
    queryKey: ['ratings', input?.tripId, input?.raterId, input?.rateeId],
    queryFn: () => checkExistingRating(input!),
    enabled: !!input?.tripId && !!input?.raterId && !!input?.rateeId,
    staleTime: 60_000,
  });
}
