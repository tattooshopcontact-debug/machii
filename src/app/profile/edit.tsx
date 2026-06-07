import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Button, Card, Screen, Text } from '@/components/ui';
import { pickImageFromLibrary, uploadAvatar } from '@/lib/avatars';
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setRole(user.role);
    setAvatarUrl(user.avatarUrl ?? null);
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
  const dirty =
    user != null &&
    (fullName.trim() !== user.fullName || role !== user.role || bio.trim().length > 0);
  const canSave = nameOk && dirty && !submitting;

  async function onSave() {
    if (!canSave) return;
    setSubmitting(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        role,
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
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Avatar name={fullName || user.fullName} tint={user.avatarTint} size={104} />
            )}
            <View style={styles.avatarOverlay}>
              {uploadingAvatar ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <Ionicons name="camera" size={20} color={colors.textOnPrimary} />
              )}
            </View>
          </Pressable>
          <Text variant="caption" color={colors.textSecondary} center>
            {uploadingAvatar ? 'Envoi…' : 'Touche pour changer ta photo'}
          </Text>
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
