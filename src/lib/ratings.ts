/**
 * Helpers Supabase pour les notations post-trajet (4 critères 1-5 + avis écrit).
 * Les avis sont publiquement lisibles (RLS using(true)) → affichés sur le profil.
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
  comment: string; // avis écrit obligatoire (style Airbnb)
}) {
  const { error } = await supabase.from('ratings').insert({
    trip_id: input.tripId,
    rater_id: input.raterId,
    ratee_id: input.rateeId,
    punctuality: input.criteria.punctuality,
    cleanliness: input.criteria.cleanliness,
    driving: input.criteria.driving,
    friendliness: input.criteria.friendliness,
    comment: input.comment.trim(),
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
      qc.invalidateQueries({ queryKey: ['reviews', vars.rateeId] });
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

// ---------------------------------------------------------------------------
// Avis publics affichés sur le profil (style Airbnb)
// ---------------------------------------------------------------------------
export type Review = {
  id: string;
  createdAt: string;
  comment: string | null;
  scores: RatingCriteria;
  average: number; // moyenne des critères notés (>0) de cet avis
  author: { id: string; fullName: string; avatarUrl: string | null; avatarKey: string | null };
};

export type ReviewsSummary = {
  count: number;
  overall: number; // moyenne globale (0..5)
  byCriterion: { punctuality: number | null; cleanliness: number | null; driving: number | null; friendliness: number | null };
  reviews: Review[];
};

/** Moyenne en ignorant les 0 (= critère non applicable, ex. passager). */
function avgNonZero(values: number[]): number | null {
  const v = values.filter((n) => n > 0);
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

async function fetchReviews(rateeId: string): Promise<ReviewsSummary> {
  const { data, error } = await supabase
    .from('ratings')
    .select(
      'id, punctuality, cleanliness, driving, friendliness, comment, created_at, author:profiles!rater_id(id, full_name, avatar_url, avatar_key)',
    )
    .eq('ratee_id', rateeId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as any[];
  const reviews: Review[] = rows.map((r) => {
    const scores = {
      punctuality: r.punctuality ?? 0,
      cleanliness: r.cleanliness ?? 0,
      driving: r.driving ?? 0,
      friendliness: r.friendliness ?? 0,
    };
    const a = avgNonZero([scores.punctuality, scores.cleanliness, scores.driving, scores.friendliness]);
    return {
      id: r.id,
      createdAt: r.created_at,
      comment: r.comment ?? null,
      scores,
      average: a ?? 0,
      author: {
        id: r.author?.id ?? '',
        fullName: r.author?.full_name || 'Utilisateur',
        avatarUrl: r.author?.avatar_url ?? null,
        avatarKey: r.author?.avatar_key ?? null,
      },
    };
  });

  const byCriterion = {
    punctuality: avgNonZero(rows.map((r) => r.punctuality ?? 0)),
    cleanliness: avgNonZero(rows.map((r) => r.cleanliness ?? 0)),
    driving: avgNonZero(rows.map((r) => r.driving ?? 0)),
    friendliness: avgNonZero(rows.map((r) => r.friendliness ?? 0)),
  };
  const overall = avgNonZero(reviews.map((r) => r.average)) ?? 0;

  return { count: reviews.length, overall, byCriterion, reviews };
}

export function useProfileReviews(rateeId?: string) {
  return useQuery({
    queryKey: ['reviews', rateeId],
    queryFn: () => fetchReviews(rateeId!),
    enabled: !!rateeId,
    staleTime: 30_000,
  });
}
