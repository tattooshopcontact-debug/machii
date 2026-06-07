import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { useConversationMessages, useSendMessage, type ChatMessage } from '@/lib/chat';
import { describeError } from '@/lib/errors';
import { useAuthStore } from '@/stores/authStore';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

function formatHHMM(iso: string) {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const { data: messages, isLoading, error } = useConversationMessages(id);
  const sendMessage = useSendMessage();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  // Auto-scroll en bas quand un nouveau message arrive.
  useEffect(() => {
    if ((messages ?? []).length === 0) return;
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages]);

  async function onSend() {
    if (!user || !id) return;
    const content = text.trim();
    if (!content) return;
    setText('');
    try {
      await sendMessage.mutateAsync({ conversationId: id, senderId: user.id, content });
    } catch (e) {
      setText(content);
      // L'erreur sera visible via le bandeau plus bas si on l'ajoute.
      console.warn('Send failed', describeError(e));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.textOnPrimary} />
        </Pressable>
        <Text variant="subtitle" color={colors.textOnPrimary}>Conversation</Text>
        <View style={{ width: 26 }} />
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!isLoading && !!error && (
        <View style={styles.center}>
          <Text variant="body" color={colors.textSecondary}>
            ⚠️ {describeError(error)}
          </Text>
        </View>
      )}

      {!isLoading && !error && (
        <FlatList
          ref={listRef}
          data={messages ?? []}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: spacing.xxl }}>
              <Text variant="body" color={colors.textSecondary} center>
                Aucun message pour le moment. Dis bonjour !
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMine = item.senderId === user?.id;
            const isBlocked = item.blocked;
            return (
              <View
                style={[
                  styles.bubble,
                  isMine ? styles.bubbleMine : styles.bubbleOther,
                  isBlocked && styles.bubbleBlocked,
                ]}
              >
                <Text
                  variant="body"
                  color={isMine ? colors.textOnPrimary : colors.textPrimary}
                  style={{ fontStyle: isBlocked ? 'italic' : 'normal' }}
                >
                  {item.content}
                </Text>
                <Text
                  variant="caption"
                  color={isMine ? 'rgba(255,255,255,0.7)' : colors.textMuted}
                  style={{ marginTop: 4, alignSelf: 'flex-end' }}
                >
                  {formatHHMM(item.createdAt)}
                </Text>
              </View>
            );
          }}
        />
      )}

      <View style={[styles.composer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Écris un message…"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
          maxLength={1000}
        />
        <Pressable
          onPress={onSend}
          disabled={!text.trim() || sendMessage.isPending}
          style={[styles.sendBtn, (!text.trim() || sendMessage.isPending) && styles.sendBtnDisabled]}
        >
          <Ionicons name="send" size={18} color={colors.textOnPrimary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  bubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  bubbleMine: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
  bubbleOther: { backgroundColor: colors.surface, alignSelf: 'flex-start' },
  bubbleBlocked: { backgroundColor: colors.surfaceAlt, alignSelf: 'center', borderWidth: 1, borderColor: colors.border },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
