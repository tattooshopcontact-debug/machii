import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, Button, Card, Screen, Text } from '@/components/ui';
import { describeError } from '@/lib/errors';
import { pickKycImage, useMyKyc, useUploadKyc, type KycDocType, type KycStatus } from '@/lib/kyc';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';

type Doc = {
  type: KycDocType;
  label: string;
  description: string;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  driverOnly?: boolean;
};

const DOCS: Doc[] = [
  {
    type: 'cin',
    label: 'Pièce d\'identité (CIN)',
    description: 'Photo recto ou recto/verso, lisible et non floue.',
    icon: 'card-outline',
  },
  {
    type: 'permis',
    label: 'Permis de conduire',
    description: 'Recto du permis, photo nette.',
    icon: 'car-outline',
    driverOnly: true,
  },
  {
    type: 'carte_grise',
    label: 'Carte grise du véhicule',
    description: 'Document du véhicule que tu utilises pour le covoiturage.',
    icon: 'document-text-outline',
    driverOnly: true,
  },
  {
    type: 'photo_vehicule',
    label: 'Photo du véhicule',
    description: 'Vue extérieure (face avant), plaque visible.',
    icon: 'camera-outline',
    driverOnly: true,
  },
];

function statusBadge(status: KycStatus | null) {
  if (status === 'approved') return <Badge label="Validé" tone="verified" icon="✓" />;
  if (status === 'pending') return <Badge label="En attente" tone="neutral" />;
  if (status === 'rejected') return <Badge label="Refusé" tone="neutral" />;
  return <Badge label="À envoyer" tone="neutral" />;
}

export default function VerifyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { data: docs, isLoading } = useMyKyc(user?.id);
  const uploadKyc = useUploadKyc();
  const [uploading, setUploading] = useState<KycDocType | null>(null);

  if (!user) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={26} color={colors.textOnPrimary} />
          </Pressable>
          <Text variant="subtitle" color={colors.textOnPrimary}>Vérification</Text>
          <View style={{ width: 26 }} />
        </View>
      </View>
    );
  }

  const isDriverRole = user.role === 'driver' || user.role === 'both';
  const docsToShow = DOCS.filter((d) => !d.driverOnly || isDriverRole);

  async function onUpload(type: KycDocType) {
    if (!user) return;
    setUploading(type);
    try {
      const asset = await pickKycImage();
      if (!asset) return;
      await uploadKyc.mutateAsync({ userId: user.id, docType: type, asset });
      Alert.alert('Document envoyé', 'Il sera examiné dans les 24 à 48h.');
    } catch (e) {
      Alert.alert('Envoi impossible', describeError(e));
    } finally {
      setUploading(null);
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.textOnPrimary} />
        </Pressable>
        <Text variant="subtitle" color={colors.textOnPrimary}>Vérification</Text>
        <View style={{ width: 26 }} />
      </View>

      <Screen contentStyle={{ gap: spacing.md, paddingTop: spacing.lg }}>
        <Card style={{ gap: spacing.sm }}>
          <Text variant="heading">Devenir un utilisateur vérifié</Text>
          <Text variant="body" color={colors.textSecondary}>
            Envoie tes documents officiels pour obtenir le badge {' '}
            <Text variant="body" color={colors.primary}>« Vérifié »</Text>. Les utilisateurs vérifiés gagnent la confiance des autres et leurs trajets sont mis en avant.
          </Text>
          <View style={styles.note}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
            <Text variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
              Tes documents sont stockés de manière privée. Seul toi peux les voir, et Machii les examine pour validation.
            </Text>
          </View>
        </Card>

        {isLoading && (
          <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {!isLoading && docsToShow.map((doc) => {
          const existing = (docs ?? []).find((d) => d.docType === doc.type);
          const isUploading = uploading === doc.type;
          return (
            <Card key={doc.type} style={{ gap: spacing.sm }}>
              <View style={styles.docHeader}>
                <View style={styles.docIcon}>
                  <Ionicons name={doc.icon} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium">{doc.label}</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {doc.description}
                  </Text>
                </View>
                {statusBadge(existing?.status ?? null)}
              </View>
              <Button
                variant={existing ? 'outline' : 'primary'}
                label={isUploading ? 'Envoi…' : existing ? 'Remplacer la photo' : 'Choisir une photo'}
                onPress={() => onUpload(doc.type)}
                disabled={isUploading}
                loading={isUploading}
                left={
                  <Ionicons
                    name="cloud-upload-outline"
                    size={18}
                    color={existing ? colors.primary : colors.textOnPrimary}
                  />
                }
              />
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
  docHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
});
