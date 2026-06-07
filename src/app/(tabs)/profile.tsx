import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar, Badge, Button, Card, Screen, ScreenHeader, Text } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';
import type { Role } from '@/types/models';

const ROLE_LABEL: Record<Role, string> = {
  passenger: 'Passager',
  driver: 'Conducteur',
  both: 'Passager et conducteur',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  if (!user) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Profil" />
        <Screen tabBarSpacing contentStyle={{ paddingTop: spacing.xl, alignItems: 'center' }}>
          <Text variant="body" color={colors.textSecondary}>Tu n'es pas connecté.</Text>
          <Button label="Se connecter" onPress={() => router.replace('/(auth)/phone')} style={{ marginTop: spacing.lg }} />
        </Screen>
      </View>
    );
  }

  async function onSignOut() {
    await signOut();
    router.replace('/(auth)/phone');
  }

  const ratingDisplay = user.ratingAvg > 0 ? user.ratingAvg.toFixed(1) : '—';

  return (
    <View style={styles.root}>
      <ScreenHeader title="Profil" />
      <Screen tabBarSpacing contentStyle={{ gap: spacing.md, paddingTop: spacing.lg }}>
        {/* Carte identité */}
        <Card style={styles.identity}>
          <Avatar
            name={user.fullName}
            uri={user.avatarUrl ?? undefined}
            tint={user.avatarTint}
            size={76}
            verified={user.isVerified}
          />
          <Text variant="title" style={{ marginTop: spacing.sm }}>
            {user.fullName}
          </Text>
          <View style={styles.metaRow}>
            <Badge label={ROLE_LABEL[user.role]} tone="recurring" />
            {!user.isVerified && <Text variant="caption" color={colors.textSecondary}>Non vérifié</Text>}
          </View>
          <Text variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
            {user.phone}
          </Text>
        </Card>

        {/* Stats neutres (vraies données) */}
        <Card style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="star" size={20} color={colors.accent} />
            <Text variant="subtitle">{ratingDisplay}</Text>
            <Text variant="caption" color={colors.textSecondary}>Note</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Ionicons name="trophy-outline" size={20} color={colors.primary} />
            <Text variant="subtitle">Niveau {user.level}</Text>
            <Text variant="caption" color={colors.textSecondary}>{user.xp} XP</Text>
          </View>
        </Card>

        {/* CTA modifier */}
        <Button
          label="Modifier mon profil"
          variant="secondary"
          left={<Ionicons name="create-outline" size={18} color={colors.textOnPrimary} />}
          onPress={() => router.push('/profile/edit')}
        />

        {!user.isVerified && (
          <Button
            label="Se faire vérifier"
            variant="secondary"
            left={<Ionicons name="shield-checkmark-outline" size={18} color={colors.textOnPrimary} />}
            onPress={() => router.push('/profile/verify')}
          />
        )}

        <Button
          label="SOS et contacts d'urgence"
          variant="secondary"
          left={<Ionicons name="alert-circle-outline" size={18} color={colors.textOnPrimary} />}
          onPress={() => router.push('/profile/sos')}
        />

        <Button
          label="Se déconnecter"
          variant="outline"
          onPress={onSignOut}
          style={{ marginTop: spacing.xs }}
        />

        <Text variant="caption" center color={colors.textMuted} style={{ marginTop: spacing.md }}>
          Machii · covoiturage gratuit (loi n° 2004-33)
        </Text>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  identity: { alignItems: 'center', gap: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.sm },
  statDivider: { width: 1, height: 48, backgroundColor: colors.border },
});
