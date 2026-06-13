/**
 * Mon véhicule (#12-A). Le conducteur enregistre marque / modèle / couleur /
 * plaque / nombre de places. La plaque ne sera JAMAIS montrée aux passagers
 * avant qu'ils soient acceptés (révélation échelonnée côté serveur).
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
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
import { useMyVehicle, useUpsertVehicle } from '@/lib/vehicles';
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

  useEffect(() => {
    if (!vehicle) return;
    setMake(vehicle.make ?? '');
    setModel(vehicle.model ?? '');
    setColor(vehicle.color ?? '');
    setPlate(vehicle.plate ?? '');
    setSeats(vehicle.seats ?? 4);
  }, [vehicle]);

  const valid = make.trim().length >= 2 && color.trim().length >= 2 && plate.trim().length >= 3;

  async function onSave() {
    if (!user || !valid) return;
    try {
      await upsert.mutateAsync({
        driverId: user.id,
        vehicle: { make, model, color, plate, seats },
      });
      Alert.alert('Véhicule enregistré', 'Tes infos véhicule sont à jour.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
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
            La marque, le modèle et la couleur sont visibles par tous. La plaque n'apparaît
            qu'aux passagers dont tu as accepté la demande.
          </Text>

          <Card style={{ gap: spacing.md }}>
            <Field label="Marque" value={make} onChange={setMake} placeholder="ex : Renault" />
            <Field label="Modèle (optionnel)" value={model} onChange={setModel} placeholder="ex : Clio" />
            <Field label="Couleur" value={color} onChange={setColor} placeholder="ex : bleue" />
            <Field label="Plaque d'immatriculation" value={plate} onChange={setPlate} placeholder="ex : 5847 TUN 142" autoCapitalize="characters" />
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
