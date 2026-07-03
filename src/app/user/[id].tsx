import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Badge, Card, RatingBar, Screen, Stars, Text, VerifiedShield } from '@/components/ui';
import { usePublicProfile } from '@/lib/profile';
import { useProfileReviews, type Review } from '@/lib/ratings';
import { colors, fonts, radius, spacing } from '@/theme';

const ROLE_LABEL: Record<string, string> = {
  passenger: 'Passager·ère',
  driver: 'Conducteur·rice',
  both: 'Conducteur·rice & Passager·ère',
};

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const CRIT_LABELS: { key: keyof Review['scores']; label: string }[] = [
  { key: 'punctuality', label: 'Ponctualité' },
  { key: 'driving', label: 'Conduite' },
  { key: 'cleanliness', label: 'Propreté' },
  { key: 'friendliness', label: 'Sympathie' },
];

function ReviewRow({ review }: { review: Review }) {
  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={styles.reviewHead}>
        <Avatar name={review.author.fullName} uri={review.author.avatarUrl ?? undefined} assetKey={review.author.avatarKey} size={38} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyMedium" numberOfLines={1}>{review.author.fullName}</Text>
          <Text variant="caption" color={colors.textSecondary}>{fmtDate(review.createdAt)}</Text>
        </View>
        <Stars value={review.average} size={15} />
      </View>
      {!!review.comment && <Text variant="body" color={colors.textPrimary}>{review.comment}</Text>}
    </Card>
  );
}

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: profile, isLoading } = usePublicProfile(id);
  const { data: reviews } = useProfileReviews(id);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Ionicons name="chevron-back" size={26} color={colors.textOnPrimary} onPress={() => router.back()} />
        <Text variant="subtitle" color={colors.textOnPrimary}>Profil</Text>
        <View style={{ width: 26 }} />
      </View>

      <Screen contentStyle={{ gap: spacing.md, paddingTop: spacing.lg }}>
        {isLoading || !profile ? (
          <Text variant="body" color={colors.textSecondary} center style={{ marginTop: spacing.xl }}>
            Chargement…
          </Text>
        ) : (
          <>
            {/* Carte identité */}
            <Card style={{ alignItems: 'center', gap: spacing.xs }}>
              <Avatar
                name={profile.fullName}
                uri={profile.avatarKey ? null : profile.avatarUrl ?? undefined}
                assetKey={profile.avatarKey}
                tint={profile.avatarTint}
                size={88}
              />
              <Text variant="title" style={{ marginTop: spacing.sm }}>{profile.fullName}</Text>
              <View style={styles.badgeRow}>
                <Badge label={ROLE_LABEL[profile.role] ?? profile.role} tone="recurring" />
                {profile.isVerified ? (
                  <VerifiedShield />
                ) : (
                  <Badge label="Profil non vérifié" tone="unverified" icon="!" />
                )}
              </View>
              {!!profile.createdAt && (
                <Text variant="caption" color={colors.textSecondary}>
                  Membre depuis {new Date(profile.createdAt).getFullYear()}
                </Text>
              )}
            </Card>

            {/* Résumé des avis */}
            <Card style={{ gap: spacing.md }}>
              {reviews && reviews.count > 0 ? (
                <>
                  <View style={styles.summaryTop}>
                    <Text style={styles.bigScore}>{reviews.overall.toFixed(1)}</Text>
                    <View>
                      <Stars value={reviews.overall} size={18} />
                      <Text variant="caption" color={colors.textSecondary}>
                        {reviews.count} avis
                      </Text>
                    </View>
                  </View>
                  <View style={{ gap: spacing.sm }}>
                    {CRIT_LABELS.map(({ key, label }) =>
                      reviews.byCriterion[key] != null ? (
                        <RatingBar key={key} label={label} value={reviews.byCriterion[key] as number} />
                      ) : null,
                    )}
                  </View>
                </>
              ) : (
                <View style={{ alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm }}>
                  <Ionicons name="star-outline" size={32} color={colors.textMuted} />
                  <Text variant="bodyMedium" center>Pas encore d'avis</Text>
                  <Text variant="caption" color={colors.textSecondary} center>
                    Les avis apparaîtront ici après ses premiers trajets.
                  </Text>
                </View>
              )}
            </Card>

            {/* Liste des avis */}
            {reviews?.reviews.map((r) => <ReviewRow key={r.id} review={r} />)}
          </>
        )}
      </Screen>
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
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bigScore: { fontFamily: fonts.heavy, fontSize: 40, color: colors.primary },
});
