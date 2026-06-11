import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarPicker } from '@/components/AvatarPicker';
import { Avatar, Button, Card, Screen, Text } from '@/components/ui';
import { pickImageFromLibrary, uploadAvatar } from '@/lib/avatars';
import type { AvatarKey } from '@/lib/avatarsCatalog';
import { describeError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import type { Role } from '@/types/models';

const ROLE_OPTIONS: { value: Role; label: string; sub: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'passenger', label: 'Passager', sub: 'Je cherche un trajet', icon: 'person-outline' },
  { value: 'driver', label: 'Conducteur', sub: 'Je propose des trajets', icon: 'car-outline' },
  { value: 'both', label: 'Les deux', sub: 'Je publie et je réserve', icon: 'swap-horizontal-outline' },
];

const BIO_MAX = 280;

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('both');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState<AvatarKey | null>(null);
  const [gender, setGender] = useState<'female' | 'male' | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setRole(user.role);
    setAvatarUrl(user.avatarUrl ?? null);
    setAvatarKey((user.avatarKey as AvatarKey | null | undefined) ?? null);
    setGender(user.gender ?? null);
    // user.bio n'est pas exposé dans UserProfile actuellement → on partira vide.
  }, [user]);

  async function onPickAvatar() {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const asset = await pickImageFromLibrary();
      if (!asset) return;
      const url = await uploadAvatar(user.id, asset);
      // Persiste l'URL dans profiles + update local pour le preview immédiat.
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', user.id);
      if (error) throw error;
      setAvatarUrl(url);
      // Recharge la session pour propager le nouvel avatar dans tout le store.
      await useAuthStore.getState().loadSession();
    } catch (e: unknown) {
      Alert.alert('Photo non envoyée', describeError(e));
    } finally {
      setUploadingAvatar(false);
    }
  }

  const nameOk = fullName.trim().length >= 2;
  const userAvatarKey = (user?.avatarKey as AvatarKey | null | undefined) ?? null;
  const dirty =
    user != null &&
    (fullName.trim() !== user.fullName ||
      role !== user.role ||
      bio.trim().length > 0 ||
      avatarKey !== userAvatarKey ||
      gender !== (user.gender ?? null));
  const canSave = nameOk && dirty && !submitting;

  async function onSave() {
    if (!canSave) return;
    setSubmitting(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        role,
        avatarKey,
        gender,
        ...(bio.trim() ? { bio: bio.trim() } : {}),
      });
      Alert.alert('Profil mis à jour', 'Tes changements ont été enregistrés.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      Alert.alert('Modification impossible', describeError(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.xl }]}>
        <Text variant="body" color={colors.textSecondary} center>
          Connecte-toi pour modifier ton profil.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.textOnPrimary} />
        </Pressable>
        <Text variant="subtitle" color={colors.textOnPrimary}>Modifier le profil</Text>
        <View style={{ width: 26 }} />
      </View>

      <Screen contentStyle={{ gap: spacing.md, paddingTop: spacing.lg }}>
        <Card style={styles.avatarCard}>
          <Pressable onPress={onPickAvatar} disabled={uploadingAvatar} style={styles.avatarPressable}>
            <Avatar
              name={fullName || user.fullName}
              uri={avatarKey ? null : avatarUrl}
              assetKey={avatarKey}
              tint={user.avatarTint}
              size={104}
            />
            <View style={styles.avatarOverlay}>
              {uploadingAvatar ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <Ionicons name="camera" size={20} color={colors.textOnPrimary} />
              )}
            </View>
          </Pressable>
          <Text variant="caption" color={colors.textSecondary} center>
            {uploadingAvatar
              ? 'Envoi…'
              : avatarKey
                ? 'Avatar Machii — touche pour mettre ta photo'
                : 'Touche pour changer ta photo'}
          </Text>
        </Card>

        <Card style={{ gap: spacing.sm }}>
          <AvatarPicker user={user} selected={avatarKey} onSelect={setAvatarKey} />
        </Card>

        <Card style={{ gap: spacing.sm }}>
          <Text variant="label">Ton prénom</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="ex : Ahmed"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            maxLength={40}
            style={styles.input}
          />
          <Text variant="caption" color={colors.textSecondary}>
            Affiché aux autres utilisateurs (3 à 40 caractères).
          </Text>
        </Card>

        <Card style={{ gap: spacing.sm }}>
          <Text variant="label">Comment tu utilises Machii ?</Text>
          {ROLE_OPTIONS.map((opt) => {
            const active = role === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setRole(opt.value)}
                style={[styles.roleRow, active && styles.roleRowActive]}
              >
                <Ionicons
                  name={opt.icon}
                  size={20}
                  color={active ? colors.primary : colors.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" color={active ? colors.primary : colors.textPrimary}>
                    {opt.label}
                  </Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {opt.sub}
                  </Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
              </Pressable>
            );
          })}
        </Card>

        {/* Genre (optionnel) — débloque l'option "trajet entre femmes" (M3). */}
        <Card style={{ gap: spacing.sm }}>
          <Text variant="label">Genre (optionnel)</Text>
          <Text variant="caption" color={colors.textSecondary}>
            Permet de proposer ou de filtrer les trajets entre femmes.
          </Text>
          <View style={styles.genderRow}>
            {([
              { value: 'female', label: 'Femme' },
              { value: 'male', label: 'Homme' },
              { value: null, label: 'Ne pas préciser' },
            ] as const).map((opt) => {
              const active = gender === opt.value;
              return (
                <Pressable
                  key={opt.label}
                  onPress={() => setGender(opt.value)}
                  style={[styles.genderChip, active && styles.genderChipActive]}
                >
                  <Text variant="label" color={active ? colors.textOnPrimary : colors.textPrimary}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={{ gap: spacing.sm }}>
          <View style={styles.bioHeader}>
            <Text variant="label">À propos (optionnel)</Text>
            <Text variant="caption" color={colors.textSecondary}>{bio.length}/{BIO_MAX}</Text>
          </View>
          <TextInput
            value={bio}
            onChangeText={(v) => setBio(v.slice(0, BIO_MAX))}
            placeholder="Quelques mots sur toi : fumeur/non-fumeur, musique préférée, animaux acceptés…"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.bioInput]}
          />
        </Card>

        <Button
          label="Enregistrer"
          onPress={onSave}
          disabled={!canSave}
          loading={submitting}
          style={{ marginTop: spacing.sm }}
        />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  genderRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  genderChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: '#E2E2E2', backgroundColor: '#FFF' },
  genderChipActive: { backgroundColor: '#1B3D6E', borderColor: '#1B3D6E' },
  root: { flex: 1, backgroundColor: colors.background },
  avatarCard: { alignItems: 'center', gap: spacing.sm },
  avatarPressable: { position: 'relative' },
  avatarImage: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.surfaceAlt },
  avatarOverlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
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
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  bioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bioInput: { minHeight: 100, textAlignVertical: 'top' },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  roleRowActive: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
});
