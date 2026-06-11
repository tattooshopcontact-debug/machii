/**
 * Suppression de compte — ecran de confirmation.
 *
 * Conforme exigences Google Play 2024 (User Data > Account deletion).
 * Double confirmation, conséquences listees clairement, action irreversible.
 *
 * Flux :
 *  1. Avertissement + liste des donnees supprimees + bouton "Supprimer".
 *  2. Modale "Es-tu sur ?" -> doit taper SUPPRIMER pour debloquer.
 *  3. Appel RPC delete_my_account() -> cascade DB + Storage.
 *  4. signOut + redirect vers ecran login.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useQueryClient } from '@tanstack/react-query';

import { Button, Card, Text } from '@/components/ui';
import { describeError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const CONFIRM_WORD = 'SUPPRIMER';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const qc = useQueryClient();
  const [confirmInput, setConfirmInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canDelete = confirmInput.trim().toUpperCase() === CONFIRM_WORD;

  async function onDelete() {
    if (!canDelete || !user) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('delete_my_account');
      if (error) throw error;
      const result = (data ?? {}) as { ok?: boolean; reason?: string };
      if (!result.ok) {
        throw new Error(result.reason ?? 'unknown_error');
      }
      qc.clear();
      await signOut();
      router.replace('/(auth)/phone');
      setTimeout(
        () =>
          Alert.alert(
            'Compte supprimé',
            'Ton compte Machii et toutes tes données ont été effacés. Tu peux à tout moment recréer un compte avec ton numéro.',
          ),
        300,
      );
    } catch (e: unknown) {
      Alert.alert('Suppression impossible', describeError(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.textOnPrimary} />
        </Pressable>
        <Text variant="subtitle" color={colors.textOnPrimary}>
          Supprimer mon compte
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.content}>
        <Card style={styles.warningCard}>
          <View style={styles.warningIcon}>
            <Ionicons name="warning" size={26} color={colors.danger} />
          </View>
          <Text variant="heading" color={colors.danger} center>
            Action irréversible
          </Text>
          <Text variant="body" color={colors.textPrimary} center style={{ marginTop: spacing.xs }}>
            Supprimer ton compte efface définitivement toutes tes données. Cette action ne peut pas être annulée.
          </Text>
        </Card>

        <Card style={{ gap: spacing.sm }}>
          <Text variant="label">Ce qui sera supprimé</Text>
          {[
            'Ton profil (nom, téléphone, photo, bio, rôle)',
            'Tous les trajets que tu as publiés',
            'Toutes tes réservations en cours et passées',
            'Toutes tes conversations et messages',
            'Tes notes données et reçues',
            'Tes contacts d\'urgence',
            'Tes documents de vérification (CIN, permis)',
            'Ton historique d\'activité',
          ].map((item) => (
            <View key={item} style={styles.bulletRow}>
              <Ionicons name="close-circle" size={16} color={colors.danger} />
              <Text variant="body" color={colors.textSecondary} style={{ flex: 1 }}>
                {item}
              </Text>
            </View>
          ))}
        </Card>

        <Card style={{ gap: spacing.sm }}>
          <Text variant="label">Pour confirmer</Text>
          <Text variant="caption" color={colors.textSecondary}>
            Tape « {CONFIRM_WORD} » en majuscules dans le champ ci-dessous, puis valide.
          </Text>
          <TextInput
            value={confirmInput}
            onChangeText={setConfirmInput}
            autoCapitalize="characters"
            placeholder={CONFIRM_WORD}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </Card>

        <Button
          label={submitting ? 'Suppression en cours…' : 'Supprimer définitivement mon compte'}
          onPress={onDelete}
          disabled={!canDelete || submitting}
          loading={submitting}
          variant="danger"
          left={!submitting ? <Ionicons name="trash" size={18} color={colors.textOnPrimary} /> : undefined}
        />

        <Pressable onPress={() => router.back()} style={styles.cancelLink}>
          <Text variant="label" color={colors.primary}>
            Annuler
          </Text>
        </Pressable>
      </View>
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
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  warningCard: {
    alignItems: 'center',
    backgroundColor: '#FDECEC',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  warningIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(220,53,69,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  cancelLink: {
    alignSelf: 'center',
    padding: spacing.md,
  },
});
