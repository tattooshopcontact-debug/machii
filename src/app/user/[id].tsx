import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderBackdrop } from '@/components/home/HeaderBackdrop';
import { Avatar, Badge, Card, RatingBar, Screen, Stars, Text } from '@/components/ui';
import { usePublicProfile } from '@/lib/profile';
import { useProfileReviews, type Review } from '@/lib/ratings';
import { colors, fonts, radius, spacing } from '@/theme';

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
        <HeaderBackdrop />
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.glassBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.textOnPrimary} />
          </Pressable>
          <Text variant="subtitle" color={colors.textOnPrimary}>Profil</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Identité intégrée au header (style v5) */}
        {profile && (
          <View style={styles.hero}>
            <Avatar
              name={profile.fullName}
              uri={profile.avatarKey ? null : profile.avatarUrl ?? undefined}
              assetKey={profile.avatarKey}
              tint={profile.avatarTint}
              size={88}
              verified={profile.isVerified}
            />
            <Text style={styles.heroName}>{profile.fullName}</Text>
            <View style={styles.pillRow}>
              {profile.isVerified ? (
                <View style={[styles.pill, styles.pillGreen]}>
                  <Ionicons name="checkmark" size={11} color="#fff" />
                  <Text style={styles.pillText}>VÉRIFIÉ</Text>
                </View>
              ) : (
                <View style={[styles.pill, styles.pillGlass]}>
                  <Text style={styles.pillText}>PROFIL NON VÉRIFIÉ</Text>
                </View>
              )}
            </View>
            {!!profile.createdAt && (
              <Text style={styles.heroSince}>
                Membre depuis {MONTHS[new Date(profile.createdAt).getMonth()]} {new Date(profile.createdAt).getFullYear()}
              </Text>
            )}
          </View>
        )}
      </View>

      <Screen contentStyle={{ gap: spacing.md, paddingTop: 0 }}>
        {isLoading || !profile ? (
          <Text variant="body" color={colors.textSecondary} center style={{ marginTop: spacing.xl }}>
            Chargement…
          </Text>
        ) : (
          <>
            {/* Stats flottantes (chevauchent le header) */}
            <Card elevation="floating" style={styles.statsCard}>
              <View style={styles.headStats}>
                <View style={styles.headStat}>
                  <Text style={styles.headStatN}>{profile.tripCount}</Text>
                  <Text variant="caption" color={colors.textSecondary}>Trajets</Text>
                </View>
                <View style={styles.headStat}>
                  <Text style={styles.headStatN}>{profile.ratingCount > 0 ? profile.ratingAvg.toFixed(1) : '—'}</Text>
                  <Text variant="caption" color={colors.textSecondary}>Note</Text>
                </View>
                <View style={styles.headStat}>
                  <Text style={styles.headStatN}>N{profile.level}</Text>
                  <Text variant="caption" color={colors.textSecondary}>Niveau</Text>
                </View>
              </View>
            </Card>

            {/* À propos */}
            <Card style={{ gap: spacing.xs }}>
              <Text variant="bodyMedium">À propos</Text>
              <Text variant="body" color={colors.textSecondary}>
                {profile.bio?.trim() || "Ce membre n'a pas encore renseigné de bio."}
              </Text>
              {!!profile.city && <Text variant="caption" color={colors.textSecondary}>📍 {profile.city}</Text>}
            </Card>

            {/* Préférences de trajet */}
            <Card style={{ gap: spacing.sm }}>
              <Text variant="bodyMedium">Préférences de trajet</Text>
              <View style={styles.prefRow}>
                <Badge label={profile.prefSmoking ? 'Fumeur accepté' : 'Non-fumeur'} tone="neutral" />
                {profile.prefMusic && <Badge label="Musique" tone="neutral" />}
                {profile.prefPets && <Badge label="Animaux OK" tone="neutral" />}
                {profile.prefChat === 'quiet' && <Badge label="Trajet calme" tone="neutral" />}
                {profile.prefChat === 'chatty' && <Badge label="Discussion" tone="neutral" />}
              </View>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  glassBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  heroName: {
    color: colors.textOnPrimary,
    fontFamily: fonts.heavy,
    fontSize: 22,
    letterSpacing: -0.4,
    marginTop: spacing.sm,
  },
  heroSince: { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.semibold, fontSize: 12.5 },
  pillRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  pillGreen: { backgroundColor: colors.success },
  pillGlass: { backgroundColor: 'rgba(255,255,255,0.16)' },
  pillText: { color: '#fff', fontFamily: fonts.heavy, fontSize: 10, letterSpacing: 0.8 },
  statsCard: { marginTop: spacing.md, paddingVertical: spacing.md },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  headStats: { flexDirection: 'row', alignSelf: 'stretch', marginTop: spacing.sm },
  headStat: { flex: 1, alignItems: 'center', gap: 2 },
  headStatN: { fontFamily: fonts.heavy, fontSize: 20, color: colors.primary },
  prefRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bigScore: { fontFamily: fonts.heavy, fontSize: 40, color: colors.primary },
});
