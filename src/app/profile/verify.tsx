import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

import { Badge, Button, Card, Screen, Text } from '@/components/ui';
import { useFeature } from '@/lib/featureFlags';
import { describeError } from '@/lib/errors';
import { pickKycImage, pickKycSelfie, startAutoVerification, checkAutoVerification, useMyKyc, useUploadKyc, type KycDocType, type KycStatus, type VerifState } from '@/lib/kyc';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';

type Doc = {
  type: KycDocType;
  label: string;
  description: string;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  driverOnly?: boolean;
  /** true = photo prise EN DIRECT avec la caméra (selfie), pas depuis la galerie. */
  selfie?: boolean;
};

const DOCS: Doc[] = [
  {
    type: 'cin',
    label: 'Pièce d\'identité (CIN)',
    description: 'Photo recto ou recto/verso, lisible et non floue.',
    icon: 'card-outline',
  },
  {
    type: 'selfie',
    label: 'Selfie (photo de ton visage)',
    description: 'Prends-toi en photo maintenant, visage bien visible. On vérifie que tu es la même personne que sur ta CIN.',
    icon: 'happy-outline',
    selfie: true,
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
    description: 'Document du véhicule que tu utilises pour partager tes trajets.',
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
  const loadSession = useAuthStore((s) => s.loadSession);
  const { data: docs, isLoading } = useMyKyc(user?.id);
  const uploadKyc = useUploadKyc();
  const [uploading, setUploading] = useState<KycDocType | null>(null);
  const [autoLoading, setAutoLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [verifState, setVerifState] = useState<VerifState>(
    user?.isVerified ? 'verified' : 'idle',
  );
  const autoVerifyEnabled = useFeature('auto_verify');

  // Interroge Didit et met à jour l'état affiché (+ rafraîchit le badge si validé).
  async function refreshStatus() {
    if (!autoVerifyEnabled || !user) return;
    const res = await checkAutoVerification();
    setVerifState(res.state);
    if (res.verified && !user.isVerified) await loadSession();
  }

  // À l'ouverture de l'écran : rattrape l'état réel (page blanche Didit → au
  // retour, l'écran affiche « en cours / vérifié / refusé »).
  useEffect(() => {
    if (user?.isVerified) { setVerifState('verified'); return; }
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoVerifyEnabled]);

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

  async function onAutoVerify() {
    setAutoLoading(true);
    try {
      const url = await startAutoVerification();
      setVerifState('pending'); // dès qu'on lance, l'écran passe en « en cours »
      // Didit renvoie vers https://machii.net/verif-retour à la fin. openAuthSession
      // intercepte cette URL EN INTERNE et referme le navigateur → retour DIRECT
      // dans l'app, sans page blanche NI popup (le lien vérifié Android couvre
      // aussi le cas du scan depuis un autre appareil).
      await WebBrowser.openAuthSessionAsync(url, 'https://machii.net/verif-retour');
      // Au retour : on interroge Didit plusieurs fois (finalisation ~quelques s).
      const res = await checkAutoVerification();
      setVerifState(res.state);
      if (res.verified) {
        await loadSession();
        Alert.alert('Identité vérifiée ✓', 'Ton badge « Vérifié » est maintenant actif. Merci !');
      } else if (res.state === 'declined') {
        Alert.alert('Vérification refusée', 'Tes documents n\'ont pas pu être validés. Tu peux réessayer.');
      } else {
        // en cours : on repolle en arrière-plan pour rattraper l'approbation
        [4000, 9000, 15000].forEach((ms) =>
          setTimeout(() => refreshStatus(), ms),
        );
      }
    } catch (e) {
      setVerifState('idle');
      Alert.alert('Vérification impossible', describeError(e));
    } finally {
      setAutoLoading(false);
    }
  }

  async function onUpload(type: KycDocType, useSelfie = false) {
    if (!user) return;
    setUploading(type);
    try {
      const asset = useSelfie ? await pickKycSelfie() : await pickKycImage();
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
        {/* ── Héros : vérification automatique (avec statut) ── */}
        {autoVerifyEnabled ? (
          verifState === 'verified' ? (
            <Card style={StyleSheet.flatten([styles.hero, { borderColor: colors.success, backgroundColor: 'rgba(40,167,69,0.06)' }])}>
              <View style={StyleSheet.flatten([styles.heroIcon, { backgroundColor: 'rgba(40,167,69,0.12)' }])}>
                <Ionicons name="checkmark-circle" size={30} color={colors.success} />
              </View>
              <Text variant="heading" center>Identité vérifiée</Text>
              <Text variant="body" color={colors.textSecondary} center>
                Ton badge « Vérifié » est actif. Les autres utilisateurs te font davantage confiance.
              </Text>
            </Card>
          ) : verifState === 'pending' ? (
            <Card style={styles.hero}>
              <View style={styles.heroIcon}>
                <ActivityIndicator color={colors.primary} />
              </View>
              <Text variant="heading" center>Vérification en cours…</Text>
              <Text variant="body" color={colors.textSecondary} center>
                On valide tes documents. Ton badge « Vérifié » s'activera dans quelques instants.
              </Text>
              <Button
                label="Actualiser"
                variant="outline"
                onPress={refreshStatus}
                left={<Ionicons name="refresh" size={18} color={colors.primary} />}
                style={{ marginTop: spacing.xs, alignSelf: 'stretch' }}
              />
            </Card>
          ) : (
            <Card style={styles.hero}>
              <View style={styles.heroIcon}>
                <Ionicons
                  name={verifState === 'declined' ? 'close-circle' : 'shield-checkmark'}
                  size={28}
                  color={verifState === 'declined' ? colors.danger : colors.primary}
                />
              </View>
              <Text variant="heading" center>
                {verifState === 'declined' ? 'Vérification refusée' : 'Vérifie ton identité'}
              </Text>
              <Text variant="body" color={colors.textSecondary} center>
                {verifState === 'declined'
                  ? 'Tes documents n\'ont pas pu être validés. Vérifie que ta CIN est nette et réessaie.'
                  : isDriverRole
                    ? 'Scanne ta CIN et prends un selfie. Ton badge « Vérifié » s\'active en quelques minutes.'
                    : 'Une CIN et un selfie suffisent. Ton badge « Vérifié » s\'active en quelques minutes.'}
              </Text>
              <Button
                label={autoLoading ? 'Ouverture…' : verifState === 'declined' ? 'Réessayer' : 'Vérifier mon identité'}
                onPress={onAutoVerify}
                disabled={autoLoading}
                loading={autoLoading}
                left={<Ionicons name="flash" size={18} color={colors.textOnPrimary} />}
                style={{ marginTop: spacing.xs, alignSelf: 'stretch' }}
              />
              <View style={styles.heroReassure}>
                <Ionicons name="lock-closed-outline" size={13} color={colors.textSecondary} />
                <Text variant="caption" color={colors.textSecondary}>
                  Rapide, chiffré et confidentiel
                </Text>
              </View>
            </Card>
          )
        ) : (
          <Card style={{ gap: spacing.sm }}>
            <Text variant="heading">Devenir un utilisateur vérifié</Text>
            <Text variant="body" color={colors.textSecondary}>
              Envoie tes documents officiels pour obtenir le badge{' '}
              <Text variant="body" color={colors.primary}>« Vérifié »</Text>.
            </Text>
          </Card>
        )}

        {/* ── Manuel : discret, replié par défaut quand l'auto est dispo ── */}
        {autoVerifyEnabled && (
          <Pressable style={styles.manualToggle} onPress={() => setShowManual((v) => !v)}>
            <Text variant="caption" color={colors.textSecondary}>
              Je préfère envoyer mes documents manuellement
            </Text>
            <Ionicons
              name={showManual ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textSecondary}
            />
          </Pressable>
        )}

        {(showManual || !autoVerifyEnabled) && (
          <>
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
                    label={
                      isUploading
                        ? 'Envoi…'
                        : doc.selfie
                          ? existing ? 'Reprendre le selfie' : 'Prendre un selfie'
                          : existing ? 'Remplacer la photo' : 'Choisir une photo'
                    }
                    onPress={() => onUpload(doc.type, doc.selfie)}
                    disabled={isUploading}
                    loading={isUploading}
                    left={
                      <Ionicons
                        name={doc.selfie ? 'camera-outline' : 'cloud-upload-outline'}
                        size={18}
                        color={existing ? colors.primary : colors.textOnPrimary}
                      />
                    }
                  />
                </Card>
              );
            })}
            {!isLoading && !isDriverRole && (
              <View style={styles.note}>
                <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                <Text variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
                  En tant que passager, seule ton identité (CIN + selfie) est nécessaire.
                </Text>
              </View>
            )}
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
  hero: {
    gap: spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: 'rgba(255,199,44,0.06)',
    paddingVertical: spacing.lg,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heroReassure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  manualToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
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
