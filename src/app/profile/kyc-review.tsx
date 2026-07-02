/**
 * Écran ADMIN — validation des documents KYC (migration 0034).
 *
 * Visible uniquement pour les profils `is_admin`. Liste tous les documents
 * envoyés (en attente d'abord), avec aperçu (signed URL du bucket privé) et
 * boutons Approuver / Refuser. Le badge "Vérifié" du profil est recalculé
 * côté serveur à chaque décision (RPC admin_review_kyc).
 */
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, Button, Card, Screen, Text } from '@/components/ui';
import { describeError } from '@/lib/errors';
import {
  getKycSignedUrl,
  useKycAdminList,
  useReviewKyc,
  type KycAdminEntry,
  type KycDocType,
} from '@/lib/kyc';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';

const DOC_LABEL: Record<KycDocType, string> = {
  cin: "Pièce d'identité (CIN)",
  permis: 'Permis de conduire',
  carte_grise: 'Carte grise',
  photo_vehicule: 'Photo du véhicule',
};

const ROLE_LABEL: Record<string, string> = {
  passenger: 'Passager',
  driver: 'Conducteur',
  both: 'Passager + conducteur',
};

function DocPreview({ path }: { path: string }) {
  const { data: uri, isLoading } = useQuery({
    queryKey: ['kyc', 'signed', path],
    queryFn: () => getKycSignedUrl(path),
    staleTime: 30 * 60_000,
  });
  if (isLoading) {
    return (
      <View style={[styles.preview, styles.previewCenter]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!uri) {
    return (
      <View style={[styles.preview, styles.previewCenter]}>
        <Text variant="caption" color={colors.textSecondary}>Aperçu indisponible</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={styles.preview} resizeMode="contain" />;
}

function statusBadge(status: KycAdminEntry['status']) {
  if (status === 'approved') return <Badge label="Validé" tone="verified" icon="✓" />;
  if (status === 'rejected') return <Badge label="Refusé" tone="neutral" />;
  return <Badge label="En attente" tone="recurring" />;
}

export default function KycReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isAdmin = !!user?.isAdmin;

  const { data: entries, isLoading, error } = useKycAdminList(isAdmin);
  const review = useReviewKyc();

  async function onReview(docId: string, approve: boolean) {
    try {
      await review.mutateAsync({ docId, approve });
    } catch (e) {
      Alert.alert('Validation impossible', describeError(e));
    }
  }

  // Regroupe les documents par utilisateur pour un examen dossier par dossier.
  const byProfile = new Map<string, KycAdminEntry[]>();
  for (const e of entries ?? []) {
    const list = byProfile.get(e.profileId) ?? [];
    list.push(e);
    byProfile.set(e.profileId, list);
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.textOnPrimary} />
        </Pressable>
        <Text variant="subtitle" color={colors.textOnPrimary}>Validation des documents</Text>
        <View style={{ width: 26 }} />
      </View>

      <Screen contentStyle={{ gap: spacing.md, paddingTop: spacing.lg }}>
        {!isAdmin && (
          <Card>
            <Text variant="body" color={colors.textSecondary}>
              Cet écran est réservé à l'administration.
            </Text>
          </Card>
        )}

        {isAdmin && isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {isAdmin && !!error && (
          <Card>
            <Text variant="body" color={colors.textSecondary}>
              ⚠️ Impossible de charger : {describeError(error)}
            </Text>
          </Card>
        )}

        {isAdmin && !isLoading && byProfile.size === 0 && !error && (
          <Card>
            <Text variant="body" color={colors.textSecondary}>
              Aucun document à examiner pour le moment.
            </Text>
          </Card>
        )}

        {[...byProfile.entries()].map(([profileId, docs]) => {
          const head = docs[0];
          return (
            <Card key={profileId} style={{ gap: spacing.md }}>
              <View style={styles.profileRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="subtitle">{head.fullName}</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {ROLE_LABEL[head.role] ?? head.role}
                    {head.phone ? ` · ${head.phone}` : ''}
                  </Text>
                </View>
                {head.isVerified && <Badge label="Vérifié" tone="verified" icon="✓" />}
              </View>

              {docs.map((doc) => (
                <View key={doc.docId} style={styles.docBlock}>
                  <View style={styles.docHeader}>
                    <Text variant="bodyMedium" style={{ flex: 1 }}>
                      {DOC_LABEL[doc.docType] ?? doc.docType}
                    </Text>
                    {statusBadge(doc.status)}
                  </View>
                  <DocPreview path={doc.filePath} />
                  <View style={styles.actions}>
                    <Button
                      label="Refuser"
                      variant="outline"
                      style={{ flex: 1 }}
                      disabled={review.isPending || doc.status === 'rejected'}
                      onPress={() => onReview(doc.docId, false)}
                    />
                    <Button
                      label="Approuver"
                      style={{ flex: 1 }}
                      disabled={review.isPending || doc.status === 'approved'}
                      onPress={() => onReview(doc.docId, true)}
                    />
                  </View>
                </View>
              ))}
            </Card>
          );
        })}
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
  center: { paddingTop: spacing.xl, alignItems: 'center' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  docBlock: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  docHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  previewCenter: { alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
