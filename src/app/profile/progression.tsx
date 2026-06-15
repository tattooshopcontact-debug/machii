/**
 * Ma progression (#17, mockup #12).
 * Affiche le niveau, l'XP, la barre vers le niveau suivant, et les 5 thèmes
 * débloquables par paliers d'XP. Affichage seul pour l'instant (le changement
 * de thème viendra plus tard).
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Screen, Text } from '@/components/ui';
import { ACHIEVEMENTS } from '@/constants/achievementsCatalog';
import { levelProgress, THEMES } from '@/constants/themes';
import { useMyAchievements } from '@/lib/achievements';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';

export default function ProgressionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const xp = user?.xp ?? 0;
  const prog = levelProgress(xp);
  const unlockedThemes = THEMES.filter((t) => xp >= t.xpRequired).length;
  const { data: unlockedAch } = useMyAchievements(user?.id);
  const unlockedCount = ACHIEVEMENTS.filter((a) => unlockedAch?.has(a.key)).length;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Ionicons name="chevron-back" size={26} color={colors.textOnPrimary} onPress={() => router.back()} />
        <Text variant="subtitle" color={colors.textOnPrimary}>Ma progression</Text>
        <View style={{ width: 26 }} />
      </View>

      <Screen contentStyle={{ gap: spacing.md, paddingTop: spacing.lg }}>
        {/* Carte XP / niveau */}
        <Card style={styles.xpCard}>
          <View style={styles.levelBadge}>
            <Text variant="title" color={colors.primary}>{prog.level}</Text>
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text variant="label" color={colors.textSecondary}>NIVEAU {prog.level}</Text>
            <Text variant="title" color={colors.primary}>{xp} XP</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.round(prog.ratio * 100)}%` }]} />
            </View>
            <Text variant="caption" color={colors.textSecondary}>
              {prog.isMax
                ? 'Niveau maximum atteint 🎉'
                : `${prog.remaining} XP avant le niveau ${prog.level + 1}`}
            </Text>
          </View>
        </Card>

        {/* Comment gagner de l'XP */}
        <Card style={{ gap: spacing.sm, backgroundColor: colors.surfaceAlt }}>
          <Text variant="label">Comment gagner de l'XP</Text>
          <Row icon="car-sport-outline" text="Trajet terminé" pts="+10" />
          <Row icon="star-outline" text="Note laissée après un trajet" pts="+5" />
          <Row icon="gift-outline" text="Parrainage d'un ami" pts="+20" />
        </Card>

        {/* Thèmes débloquables */}
        <View style={styles.section}>
          <Text variant="heading">Mes thèmes</Text>
          <Text variant="label" color={colors.textSecondary}>{unlockedThemes} / {THEMES.length} débloqués</Text>
        </View>

        {THEMES.map((t) => {
          const unlocked = xp >= t.xpRequired;
          return (
            <Card key={t.key} style={styles.themeRow}>
              <View style={styles.swatches}>
                {t.swatches.map((c, i) => (
                  <View key={i} style={[styles.swatch, { backgroundColor: c }]} />
                ))}
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium">{t.label}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {unlocked ? 'Débloqué' : `${t.xpRequired} XP`}
                </Text>
              </View>
              <Ionicons
                name={unlocked ? 'checkmark-circle' : 'lock-closed'}
                size={22}
                color={unlocked ? colors.success : colors.textMuted}
              />
            </Card>
          );
        })}

        {/* Achievements */}
        <View style={styles.section}>
          <Text variant="heading">Achievements</Text>
          <Text variant="label" color={colors.textSecondary}>{unlockedCount} / {ACHIEVEMENTS.length}</Text>
        </View>
        <View style={styles.achGrid}>
          {ACHIEVEMENTS.map((a) => {
            const got = unlockedAch?.has(a.key) ?? false;
            return (
              <View key={a.key} style={[styles.achTile, !got && styles.achLocked]}>
                <Text style={styles.achEmoji}>{got ? a.emoji : '🔒'}</Text>
                <Text variant="label" center color={got ? colors.textPrimary : colors.textMuted}>
                  {a.label}
                </Text>
                <Text variant="caption" center color={colors.textSecondary}>
                  {a.description}
                </Text>
              </View>
            );
          })}
        </View>
      </Screen>
    </View>
  );
}

function Row({ icon, text, pts }: { icon: keyof typeof Ionicons.glyphMap; text: string; pts: string }) {
  return (
    <View style={styles.giveRow}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text variant="bodyMedium" style={{ flex: 1 }}>{text}</Text>
      <Text variant="label" color={colors.success}>{pts}</Text>
    </View>
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
  xpCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  levelBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barTrack: { height: 10, borderRadius: 5, backgroundColor: colors.surfaceAlt, overflow: 'hidden', marginTop: spacing.xs },
  barFill: { height: '100%', backgroundColor: colors.accentSecondary, borderRadius: 5 },
  giveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  swatches: { flexDirection: 'row', borderRadius: radius.sm, overflow: 'hidden' },
  swatch: { width: 20, height: 36 },
  achGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  achTile: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  achLocked: { opacity: 0.5 },
  achEmoji: { fontSize: 30 },
});
