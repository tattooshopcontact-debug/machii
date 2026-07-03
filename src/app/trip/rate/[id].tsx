import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Button, Card, Screen, Text } from '@/components/ui';
import { describeError } from '@/lib/errors';
import { useHasAlreadyRated, useInsertRating } from '@/lib/ratings';
import { useTrip } from '@/lib/trips';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';

type CriterionKey = 'punctuality' | 'cleanliness' | 'driving' | 'friendliness';

const CRITERIA: { key: CriterionKey; label: string; description: string }[] = [
  { key: 'punctuality', label: 'Ponctualité', description: 'A respecté l\'heure prévue.' },
  { key: 'driving', label: 'Conduite / Sécurité', description: 'A conduit prudemment, en sécurité.' },
  { key: 'cleanliness', label: 'Propreté', description: 'Véhicule propre et confortable.' },
  { key: 'friendliness', label: 'Communication & Sympathie', description: 'Agréable, courtois·e et communicatif·ve.' },
];

const MIN_COMMENT = 10;

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
          <Ionicons
            name={n <= value ? 'star' : 'star-outline'}
            size={28}
            color={n <= value ? colors.accent : colors.textMuted}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function RateTripScreen() {
  const { id, ratee } = useLocalSearchParams<{ id: string; ratee: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const { data: trip } = useTrip(id);
  const insertRating = useInsertRating();
  const { data: alreadyRated } = useHasAlreadyRated(
    user && ratee && id ? { tripId: id, raterId: user.id, rateeId: ratee } : undefined,
  );

  const [scores, setScores] = useState<Record<CriterionKey, number>>({
    punctuality: 5,
    cleanliness: 5,
    driving: 5,
    friendliness: 5,
  });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const commentOk = comment.trim().length >= MIN_COMMENT;

  const rateeIsDriver = trip?.driver.id === ratee;
  const rateeProfile = rateeIsDriver ? trip?.driver : null;
  const visibleCriteria = rateeIsDriver
    ? CRITERIA
    : CRITERIA.filter((c) => c.key !== 'driving' && c.key !== 'cleanliness');

  async function onSubmit() {
    if (!user || !id || !ratee) return;
    if (!commentOk) {
      Alert.alert('Avis requis', `Écris quelques mots (au moins ${MIN_COMMENT} caractères) pour aider les autres.`);
      return;
    }
    setSubmitting(true);
    try {
      // Si on note un passager, on ne renseigne pas driving / cleanliness.
      const criteria = rateeIsDriver
        ? scores
        : { ...scores, driving: 0, cleanliness: 0 };
      await insertRating.mutateAsync({
        tripId: id,
        raterId: user.id,
        rateeId: ratee,
        criteria: {
          punctuality: criteria.punctuality,
          cleanliness: rateeIsDriver ? criteria.cleanliness : 0,
          driving: rateeIsDriver ? criteria.driving : 0,
          friendliness: criteria.friendliness,
        },
        comment: comment.trim(),
      });
      Alert.alert('Merci pour ta note', 'Ton avis aide les autres utilisateurs.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Note impossible', describeError(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.textOnPrimary} />
        </Pressable>
        <Text variant="subtitle" color={colors.textOnPrimary}>Noter le trajet</Text>
        <View style={{ width: 26 }} />
      </View>

      <Screen contentStyle={{ gap: spacing.md, paddingTop: spacing.lg }}>
        {alreadyRated ? (
          <Card style={{ alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
            <Text variant="subtitle" center>Tu as déjà noté ce trajet</Text>
            <Text variant="body" color={colors.textSecondary} center>
              Une seule note est possible par trajet.
            </Text>
          </Card>
        ) : (
          <>
            {rateeProfile && (
              <Card style={styles.rateeCard}>
                <Avatar
                  name={rateeProfile.fullName}
                  uri={rateeProfile.avatarUrl ?? undefined}
                  tint={rateeProfile.avatarTint}
                  size={56}
                  verified={rateeProfile.isVerified}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="subtitle">{rateeProfile.fullName}</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    Trajet {trip?.origin} → {trip?.destination}
                  </Text>
                </View>
              </Card>
            )}

            {visibleCriteria.map((c) => (
              <Card key={c.key} style={{ gap: spacing.sm }}>
                <View style={styles.critHeader}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium">{c.label}</Text>
                    <Text variant="caption" color={colors.textSecondary}>{c.description}</Text>
                  </View>
                  <Text variant="subtitle" color={colors.primary}>{scores[c.key]}/5</Text>
                </View>
                <Stars value={scores[c.key]} onChange={(v) => setScores((s) => ({ ...s, [c.key]: v }))} />
              </Card>
            ))}

            <Card style={{ gap: spacing.sm }}>
              <Text variant="bodyMedium">Ton avis</Text>
              <Text variant="caption" color={colors.textSecondary}>
                Raconte en quelques mots comment s'est passé le trajet. Ton avis sera visible sur son profil.
              </Text>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Ex : Très ponctuel·le, conduite prudente, trajet agréable…"
                placeholderTextColor={colors.textMuted}
                multiline
                style={styles.commentInput}
                maxLength={500}
              />
              <Text variant="caption" color={commentOk ? colors.success : colors.textMuted} style={{ alignSelf: 'flex-end' }}>
                {comment.trim().length}/{500}
              </Text>
            </Card>

            <Button
              label="Envoyer mon avis"
              onPress={onSubmit}
              disabled={submitting || !commentOk}
              loading={submitting}
              style={{ marginTop: spacing.sm }}
            />
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
  rateeCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  critHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  starsRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  commentInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
});
