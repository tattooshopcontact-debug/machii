import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Avatar, Card, Screen, ScreenHeader, Text } from '@/components/ui';
import { DEMO_CONVERSATIONS } from '@/constants/mock';
import { formatTime } from '@/lib/format';
import { colors, fonts, fontSize, spacing } from '@/theme';

export default function MessagesScreen() {
  return (
    <View style={styles.root}>
      <ScreenHeader title="Messages" />
      <Screen tabBarSpacing contentStyle={{ gap: spacing.sm, paddingTop: spacing.lg }}>
        {DEMO_CONVERSATIONS.map((c) => (
          <Card key={c.id} padded={false} style={styles.row}>
            <View style={styles.rowInner}>
              <Avatar name={c.withName} tint={c.withTint} size={48} />
              <View style={styles.body}>
                <View style={styles.line}>
                  <Text variant="subtitle" numberOfLines={1} style={{ flex: 1 }}>
                    {c.withName}
                  </Text>
                  <Text variant="caption">{formatTime(c.lastAt)}</Text>
                </View>
                <View style={styles.line}>
                  <Text
                    variant="body"
                    color={c.unread ? colors.textPrimary : colors.textSecondary}
                    numberOfLines={1}
                    style={{ flex: 1, fontFamily: c.unread ? fonts.medium : fonts.regular }}
                  >
                    {c.lastMessage}
                  </Text>
                  {c.unread > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{c.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </Card>
        ))}

        <View style={styles.note}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.textSecondary} />
          <Text variant="caption" style={{ flex: 1 }}>
            Le chat in-app protège tes coordonnées : le partage de numéros est bloqué automatiquement.
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
  body: { flex: 1, gap: 4 },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bold, fontSize: fontSize.xs, color: colors.primary },
  note: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginTop: spacing.md, paddingHorizontal: spacing.xs },
});
