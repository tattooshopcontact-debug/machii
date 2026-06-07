import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Card, Screen, ScreenHeader, Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function MessagesScreen() {
  return (
    <View style={styles.root}>
      <ScreenHeader title="Chat" />
      <Screen tabBarSpacing contentStyle={{ gap: spacing.md, paddingTop: spacing.xl }}>
        <Card style={styles.empty}>
          <View style={styles.iconWrap}>
            <Ionicons name="chatbubbles-outline" size={36} color={colors.primary} />
          </View>
          <Text variant="title" center style={{ marginTop: spacing.md }}>
            Le chat arrive bientôt
          </Text>
          <Text variant="body" color={colors.textSecondary} center style={{ marginTop: spacing.sm }}>
            Tu pourras échanger en sécurité avec ton conducteur ou ton passager
            directement dans l'app, sans donner ton vrai numéro avant l'acceptation.
          </Text>
          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
            <Text variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
              En attendant, le numéro de téléphone de l'autre partie s'affiche
              dans « Mes trajets » une fois la demande acceptée.
            </Text>
          </View>
        </Card>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    marginTop: spacing.xl,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: 12,
  },
});
