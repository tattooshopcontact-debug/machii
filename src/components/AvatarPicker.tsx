/**
 * AvatarPicker — selecteur d avatars Machii avec etat verrouille/debloque.
 *
 * Affiche la grille des 8 avatars. Ceux que l user n a pas debloques sont
 * grises avec un cadenas. Tap sur un avatar debloque -> selection persiste.
 * Tap sur un avatar verrouille -> alerte explicative.
 */
import { Ionicons } from '@expo/vector-icons';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { AVATAR_CATALOG, type AvatarKey, type AvatarStats } from '@/lib/avatarsCatalog';
import { colors, radius, spacing } from '@/theme';
import type { UserProfile } from '@/types/models';

type Props = {
  user: UserProfile;
  selected: AvatarKey | null;
  onSelect: (key: AvatarKey | null) => void;
  stats?: Partial<AvatarStats>;
};

export function AvatarPicker({ user, selected, onSelect, stats }: Props) {
  const fullStats: AvatarStats = {
    totalTrips: stats?.totalTrips ?? 0,
    ratingAvg: stats?.ratingAvg ?? user.ratingAvg ?? 0,
    isVerified: stats?.isVerified ?? user.isVerified,
  };

  return (
    <View>
      <Text variant="label">Choisis ton avatar</Text>
      <Text variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
        Débloque de nouveaux avatars en progressant sur Machii. Touche un avatar verrouillé pour voir comment l’obtenir.
      </Text>

      <View style={styles.grid}>
        <Pressable
          onPress={() => onSelect(null)}
          style={[styles.item, selected === null && styles.itemSelected]}
        >
          <View style={[styles.fallback]}>
            <Ionicons name="person-circle-outline" size={48} color={colors.textSecondary} />
          </View>
          <Text variant="caption" center color={colors.textSecondary} style={{ marginTop: 4 }}>
            Initiale
          </Text>
        </Pressable>

        {AVATAR_CATALOG.map((avatar) => {
          const unlocked = avatar.isUnlocked(user, fullStats);
          const isSelected = selected === avatar.key;
          return (
            <Pressable
              key={avatar.key}
              onPress={() => {
                if (!unlocked) {
                  Alert.alert(`Avatar « ${avatar.label} » verrouillé`, avatar.unlockHint);
                  return;
                }
                onSelect(avatar.key);
              }}
              style={[styles.item, isSelected && styles.itemSelected]}
            >
              <View style={styles.imageWrap}>
                <Image
                  source={avatar.source}
                  style={[styles.image, !unlocked && styles.locked]}
                />
                {!unlocked && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={20} color={colors.textOnPrimary} />
                  </View>
                )}
              </View>
              <Text
                variant="caption"
                center
                color={unlocked ? colors.textPrimary : colors.textMuted}
                style={{ marginTop: 4 }}
              >
                {avatar.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const ITEM_SIZE = 88;

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  item: {
    width: ITEM_SIZE,
    alignItems: 'center',
    padding: 6,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(27,61,110,0.06)',
  },
  imageWrap: { position: 'relative' },
  image: {
    width: ITEM_SIZE - 16,
    height: ITEM_SIZE - 16,
    borderRadius: (ITEM_SIZE - 16) / 2,
    backgroundColor: colors.surfaceAlt,
  },
  locked: { opacity: 0.35 },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27,61,110,0.45)',
    borderRadius: (ITEM_SIZE - 16) / 2,
  },
  fallback: {
    width: ITEM_SIZE - 16,
    height: ITEM_SIZE - 16,
    borderRadius: (ITEM_SIZE - 16) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
