/**
 * Parrainage (#15 / #17).
 * - useMyReferral : mon code à partager + nombre de filleuls.
 * - useApplyReferral : saisir le code de mon parrain (une seule fois).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

async function fetchMyReferral(userId: string): Promise<{ code: string | null; count: number; referredBy: string | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('referral_code, referred_by')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  const { data: cnt } = await supabase.rpc('my_referral_count');
  return {
    code: data?.referral_code ?? null,
    referredBy: data?.referred_by ?? null,
    count: (cnt as number | null) ?? 0,
  };
}

export function useMyReferral(userId: string | undefined) {
  return useQuery({
    queryKey: ['referral', userId],
    queryFn: () => fetchMyReferral(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

async function applyReferral(code: string): Promise<void> {
  const { data, error } = await supabase.rpc('apply_referral', { p_code: code });
  if (error) throw error;
  const res = data as { ok: boolean; reason?: string } | null;
  if (!res?.ok) {
    const reasons: Record<string, string> = {
      not_auth: 'Connecte-toi d\'abord.',
      already: 'Tu as déjà utilisé un code parrain.',
      bad_code: 'Code parrain inconnu.',
      self: 'Tu ne peux pas utiliser ton propre code.',
    };
    throw new Error(reasons[res?.reason ?? ''] ?? 'Code parrain invalide.');
  }
}

export function useApplyReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code }: { code: string }) => applyReferral(code),
    onSuccess: (_d, _v) => {
      qc.invalidateQueries({ queryKey: ['referral'] });
    },
  });
}
