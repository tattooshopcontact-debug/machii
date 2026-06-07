/**
 * Helpers Supabase pour le chat in-app.
 *
 * - useMyConversations : liste de mes conversations (en tant que driver ou passager)
 * - useConversationMessages : messages d'une conversation + abonnement Realtime
 * - useSendMessage : insérer un message (trigger anti-contournement côté DB)
 */
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type TripRow = Database['public']['Tables']['trips']['Row'];

export type ConversationListItem = {
  id: string;
  tripId: string;
  tripOrigin: string;
  tripDestination: string;
  tripDepartureTime: string;
  /** L'autre participant (pas moi). */
  other: ProfileRow;
  createdAt: string;
  lastMessage?: { content: string; createdAt: string; senderId: string; blocked: boolean };
};

type RawConversation = {
  id: string;
  trip_id: string;
  driver_id: string;
  passenger_id: string;
  created_at: string;
  driver: ProfileRow | null;
  passenger: ProfileRow | null;
  trip: TripRow | null;
  messages: Array<{
    id: string;
    content: string;
    sender_id: string;
    blocked: boolean;
    created_at: string;
  }>;
};

async function fetchMyConversations(userId: string): Promise<ConversationListItem[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select(
      `id, trip_id, driver_id, passenger_id, created_at,
       driver:profiles!conversations_driver_id_fkey(*),
       passenger:profiles!conversations_passenger_id_fkey(*),
       trip:trips(*),
       messages(id, content, sender_id, blocked, created_at)`,
    )
    .or(`driver_id.eq.${userId},passenger_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data as unknown as RawConversation[]).map((c) => {
    const isDriver = c.driver_id === userId;
    const other = (isDriver ? c.passenger : c.driver) ?? {
      id: isDriver ? c.passenger_id : c.driver_id,
      full_name: 'Utilisateur',
      phone: null,
      avatar_url: null,
      role: 'passenger' as const,
      is_verified: false,
      rating_avg: 0,
      level: 1,
      xp: 0,
      bio: null,
      tags: [],
      created_at: c.created_at,
    };
    const sortedMessages = [...(c.messages ?? [])].sort((a, b) =>
      a.created_at < b.created_at ? 1 : -1,
    );
    const last = sortedMessages[0];
    return {
      id: c.id,
      tripId: c.trip_id,
      tripOrigin: c.trip?.origin_label ?? '',
      tripDestination: c.trip?.destination_label ?? '',
      tripDepartureTime: c.trip?.departure_time ?? c.created_at,
      other,
      createdAt: c.created_at,
      lastMessage: last
        ? { content: last.content, createdAt: last.created_at, senderId: last.sender_id, blocked: last.blocked }
        : undefined,
    };
  });
}

export function useMyConversations(userId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', 'mine', userId],
    queryFn: () => fetchMyConversations(userId!),
    enabled: !!userId,
    staleTime: 15_000,
  });
}

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  blocked: boolean;
  createdAt: string;
};

async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, blocked, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((m) => ({
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    content: m.content,
    blocked: m.blocked,
    createdAt: m.created_at,
  }));
}

export function useConversationMessages(conversationId: string | undefined) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['conversations', 'messages', conversationId],
    queryFn: () => fetchMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 5_000,
  });

  // Subscription Realtime : à chaque nouveau message, refetch.
  useEffect(() => {
    if (!conversationId) return;
    const ch = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['conversations', 'messages', conversationId] });
          qc.invalidateQueries({ queryKey: ['conversations', 'mine'] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [conversationId, qc]);

  return query;
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { conversationId: string; senderId: string; content: string }) => {
      const { error } = await supabase.from('messages').insert({
        conversation_id: input.conversationId,
        sender_id: input.senderId,
        content: input.content,
      });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['conversations', 'messages', vars.conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations', 'mine'] });
    },
  });
}
