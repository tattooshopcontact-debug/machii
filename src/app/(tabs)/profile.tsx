import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { IconStar } from '@/components/icons';
import { Avatar, Badge, Button, Card, RatingBar, Screen, ScreenHeader, Text } from '@/components/ui';
import { DEMO_PROFILE } from '@/constants/mock';
import { useAuthStore } from '@/stores/authStore';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const p = user ?? DEMO_PROFILE;
  const progress = Math.min(1, p.xp / p.xpForNextLevel);

  function onSignOut() {
    signOut();
    router.replace('/(auth)/phone');
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title="Profil" />
      <Screen tabBarSpacing contentStyle={{ gap: spacing.md, paddingTop: spacing.lg }}>
        {/* Carte identité */}
        <Card style={styles.identity}>
          <Avatar name={p.fullName} tint={p.avatarTint} size={76} verified={p.isVerified} />
          <Text variant="title" style={{ marginTop: spacing.sm }}>
            {p.fullName}
          </Text>
          <View style={styles.levelRow}>
            <Badge label={`Niveau ${p.level}`} tone="recurring" />
            <Text variant="caption">{p.xp} XP</Text>
          </View>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text variant="caption">
            {p.xpForNextLevel - p.xp} XP avant le niveau {p.level + 1}
          </Text>
        </Card>

        {/* Évaluation */}
        <Card style={{ gap: spacing.md }}>
          <View style={styles.ratingHeader}>
            <Text variant="heading">Évaluation</Text>
            <View style={styles.ratingScore}>
              <IconStar size={20} />
              <Text variant="subtitle">{p.ratingAvg.toFixed(1)}</Text>
            </View>
          </View>
          {p.criteria.map((c) => (
            <RatingBar key={c.key} label={c.label} value={c.value} />
          ))}
        </Card>

        {/* Achievements */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="heading">Achievements</Text>
          <View style={styles.achGrid}>
            {p.achievements.map((a) => (
              <View key={a.key} style={[styles.ach, !a.unlocked && styles.achLocked]}>
                <Text style={{ fontSize: 24 }}>{a.unlocked ? a.emoji : '🔒'}</Text>
                <Text variant="caption" center numberOfLines={2}>
                  {a.label}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Préférences / tags */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="heading">À propos</Text>
          <View style={styles.tags}>
            {p.tags.map((t) => (
              <Badge key={t} label={t} tone="neutral" />
            ))}
          </View>
        </Card>

        <Button label="Se déconnecter" variant="outline" onPress={onSignOut} style={{ marginTop: spacing.sm }} />
        <Text variant="caption" center>
          Machii · covoiturage gratuit (loi n° 2004-33)
        </Text>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  identity: { alignItems: 'center', gap: spacing.xs },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  xpTrack: { width: '100%', height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden', marginTop: spacing.sm },
  xpFill: { height: 8, borderRadius: 4, backgroundColor: colors.accent },
  ratingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingScore: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  achGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  ach: {
    width: '22%',
    aspectRatio: 0.85,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: spacing.xs,
  },
  achLocked: { opacity: 0.45 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
