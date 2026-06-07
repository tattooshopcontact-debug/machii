import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Card, Screen, ScreenHeader, Text } from '@/components/ui';
import { useMyConversations } from '@/lib/chat';
import { describeError } from '@/lib/errors';
import { formatDay, formatTime } from '@/lib/format';
import { useAuthStore } from '@/stores/authStore';
import { colors, fonts, fontSize, spacing } from '@/theme';

const TINTS: ('orange' | 'navy' | 'yellow')[] = ['orange', 'navy', 'yellow'];
function pickTint(id: string): 'orange' | 'navy' | 'yellow' {
  const idx = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % TINTS.length;
  return TINTS[idx];
}

export default function MessagesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: conversations, isLoading, error } = useMyConversations(user?.id);

  return (
    <View style={styles.root}>
      <ScreenHeader title="Chat" />
      <Screen tabBarSpacing contentStyle={{ gap: spacing.sm, paddingTop: spacing.lg }}>
        {isLoading && (
          <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {!!error && (
          <Card style={styles.note}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.textSecondary} />
            <Text variant="caption" style={{ flex: 1 }}>
              ⚠️ {describeError(error)}
            </Text>
          </Card>
        )}

        {!isLoading && !error && (conversations ?? []).length === 0 && (
          <Card style={styles.empty}>
            <View style={styles.iconWrap}>
              <Ionicons name="chatbubbles-outline" size={36} color={colors.primary} />
            </View>
            <Text variant="title" center style={{ marginTop: spacing.md }}>
              Aucune conversation
            </Text>
            <Text variant="body" color={colors.textSecondary} center style={{ marginTop: spacing.sm }}>
              Une conversation s'ouvre automatiquement quand une demande de
              réservation est acceptée. Tu peux y discuter avec ton conducteur
              ou ton passager.
            </Text>
          </Card>
        )}

        {(conversations ?? []).map((c) => (
          <Pressable key={c.id} onPress={() => router.push({ pathname: '/messages/[id]', params: { id: c.id } })}>
            <Card padded={false} style={styles.row}>
              <View style={styles.rowInner}>
                <Avatar
                  name={c.other.full_name || '?'}
                  uri={c.other.avatar_url ?? undefined}
                  tint={pickTint(c.other.id)}
                  size={48}
                  verified={c.other.is_verified}
                />
                <View style={styles.body}>
                  <View style={styles.line}>
                    <Text variant="subtitle" numberOfLines={1} style={{ flex: 1 }}>
                      {c.other.full_name || 'Utilisateur'}
                    </Text>
                    <Text variant="caption">
                      {c.lastMessage ? formatTime(c.lastMessage.createdAt) : formatDay(c.tripDepartureTime)}
                    </Text>
                  </View>
                  <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
                    {c.tripOrigin} → {c.tripDestination} · {formatDay(c.tripDepartureTime)}
                  </Text>
                  <Text
                    variant="body"
                    numberOfLines={1}
                    color={c.lastMessage?.blocked ? colors.danger : colors.textPrimary}
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: fontSize.sm,
                      marginTop: 2,
                    }}
                  >
                    {c.lastMessage
                      ? c.lastMessage.blocked
                        ? '🚫 Message bloqué'
                        : c.lastMessage.content
                      : 'Démarrer la conversation'}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        ))}

        <View style={styles.shieldNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.textSecondary} />
          <Text variant="caption" style={{ flex: 1 }}>
            Le chat in-app protège tes coordonnées : le partage de numéros, emails
            ou liens externes est automatiquement bloqué.
          </Text>
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  row: { overflow: 'hidden' },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  body: { flex: 1, gap: 2 },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', backgroundColor: colors.surfaceAlt },
  shieldNote: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
});
