/**
 * Mon véhicule (#12-A). Formulaire ULTRA-SIMPLE (façon BlaBlaCar) : marque /
 * modèle / couleur / places. Aucun champ obligatoire au-delà de marque+couleur.
 * Photo OPTIONNELLE : elle rend le conducteur plus crédible auprès des
 * passagers (elle est publique) et rapporte +15 XP la première fois (trigger
 * server-side). La plaque reste optionnelle et privée (révélée seulement aux
 * passagers acceptés — révélation échelonnée côté serveur).
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Screen, Text } from '@/components/ui';
import { describeError } from '@/lib/errors';
import { pickVehiclePhoto, uploadVehiclePhoto, useMyVehicle, useUpsertVehicle } from '@/lib/vehicles';
import { useAuthStore } from '@/stores/authStore';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const SEATS = [1, 2, 3, 4, 5, 6] as const;

export default function VehicleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { data: vehicle } = useMyVehicle(user?.id);
  const upsert = useUpsertVehicle();

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [plate, setPlate] = useState('');
  const [seats, setSeats] = useState(4);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!vehicle) return;
    setMake(vehicle.make ?? '');
    setModel(vehicle.model ?? '');
    setColor(vehicle.color ?? '');
    setPlate(vehicle.plate ?? '');
    setSeats(vehicle.seats ?? 4);
    setPhotoUrl(vehicle.photo_url ?? null);
  }, [vehicle]);

  async function onPickPhoto() {
    if (!user) return;
    setUploadingPhoto(true);
    try {
      const asset = await pickVehiclePhoto();
      if (!asset) return;
      const url = await uploadVehiclePhoto(user.id, asset);
      setPhotoUrl(url);
    } catch (e: unknown) {
      Alert.alert('Photo non envoyée', describeError(e));
    } finally {
      setUploadingPhoto(false);
    }
  }

  // Simple : seules la marque et la couleur sont requises. Le reste est libre.
  const valid = make.trim().length >= 2 && color.trim().length >= 2;
  const hadPhoto = !!vehicle?.photo_url;

  async function onSave() {
    if (!user || !valid) return;
    try {
      await upsert.mutateAsync({
        driverId: user.id,
        vehicle: { make, model, color, plate, seats, photo_url: photoUrl },
      });
      const earnedXp = !!photoUrl && !hadPhoto;
      Alert.alert(
        'Véhicule enregistré',
        earnedXp ? 'Merci pour la photo ! +15 XP 🎉 Tu es plus crédible auprès des passagers.' : 'Tes infos véhicule sont à jour.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (e: unknown) {
      Alert.alert('Enregistrement impossible', describeError(e));
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.textOnPrimary} />
        </Pressable>
        <Text variant="subtitle" color={colors.textOnPrimary}>Mon véhicule</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Screen contentStyle={{ gap: spacing.md, paddingTop: spacing.lg }}>
          <Text variant="caption" color={colors.textSecondary}>
            La marque, le modèle et la couleur sont visibles par tous. La plaque (optionnelle)
            n'apparaît qu'aux passagers dont tu as accepté la demande.
          </Text>

          <Card style={{ gap: spacing.md }}>
            <Field label="Marque" value={make} onChange={setMake} placeholder="ex : Renault" />
            <Field label="Modèle (optionnel)" value={model} onChange={setModel} placeholder="ex : Clio" />
            <Field label="Couleur" value={color} onChange={setColor} placeholder="ex : bleue" />
            <Field label="Plaque (optionnel)" value={plate} onChange={setPlate} placeholder="ex : 5847 TUN 142" autoCapitalize="characters" />
          </Card>

          <Card style={{ gap: spacing.sm }}>
            <View style={styles.photoTitleRow}>
              <Text variant="label">Photo du véhicule (optionnel)</Text>
              {!hadPhoto && (
                <View style={styles.xpPill}>
                  <Ionicons name="sparkles" size={12} color={colors.primary} />
                  <Text variant="caption" color={colors.primary}>+15 XP</Text>
                </View>
              )}
            </View>
            <Text variant="caption" color={colors.textSecondary}>
              Une photo de ta voiture te rend plus crédible auprès des passagers.
            </Text>
            <Pressable onPress={onPickPhoto} disabled={uploadingPhoto} style={styles.photoBox}>
              {uploadingPhoto ? (
                <ActivityIndicator color={colors.primary} />
              ) : photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
              ) : (
                <View style={styles.photoEmpty}>
                  <Ionicons name="camera-outline" size={28} color={colors.textMuted} />
                  <Text variant="caption" color={colors.textSecondary}>Ajouter une photo</Text>
                </View>
              )}
            </Pressable>
          </Card>

          <Card style={{ gap: spacing.sm }}>
            <Text variant="label">Nombre de places passagers</Text>
            <View style={styles.seatsRow}>
              {SEATS.map((s) => {
                const active = seats === s;
                return (
                  <Pressable key={s} onPress={() => setSeats(s)} style={[styles.seatChip, active && styles.seatChipActive]}>
                    <Text variant="subtitle" color={active ? colors.textOnPrimary : colors.textPrimary}>{s}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Button
            label="Enregistrer mon véhicule"
            onPress={onSave}
            disabled={!valid || upsert.isPending}
            loading={upsert.isPending}
            style={{ marginTop: spacing.sm }}
          />
        </Screen>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize={autoCapitalize}
        maxLength={40}
        style={styles.input}
      />
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
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  photoTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  photoBox: {
    height: 160,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { width: '100%', height: '100%' },
  photoEmpty: { alignItems: 'center', gap: spacing.xs },
  seatsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  seatChip: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  seatChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
});
