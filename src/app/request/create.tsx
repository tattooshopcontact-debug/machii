/**
 * Publier une demande de trajet (cote passager).
 * Le passager precise depart, arrivee, fourchette d horaire, places, message.
 * La demande devient visible par tous les conducteurs depuis leur accueil.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Screen, Text } from '@/components/ui';
import { CITIES } from '@/constants/cities';
import { describeError } from '@/lib/errors';
import { useCreateTripRequest } from '@/lib/tripRequests';
import { useAuthStore } from '@/stores/authStore';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const SEATS_OPTIONS = [1, 2, 3, 4] as const;
const WINDOWS: { label: string; startHour: number; endHour: number }[] = [
  { label: 'Tôt matin (5h-9h)', startHour: 5, endHour: 9 },
  { label: 'Matinée (9h-12h)', startHour: 9, endHour: 12 },
  { label: 'Après-midi (12h-17h)', startHour: 12, endHour: 17 },
  { label: 'Soir (17h-21h)', startHour: 17, endHour: 21 },
];
const DAYS: { label: string; offset: number }[] = [
  { label: "Aujourd'hui", offset: 0 },
  { label: 'Demain', offset: 1 },
  { label: 'Dans 2 jours', offset: 2 },
];
const MAX_MESSAGE = 200;

export default function CreateTripRequestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const create = useCreateTripRequest();

  const [origin, setOrigin] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState<number>(0);
  const [windowIndex, setWindowIndex] = useState<number>(1);
  const [seats, setSeats] = useState<(typeof SEATS_OPTIONS)[number]>(1);
  const [message, setMessage] = useState('');

  const valid =
    origin !== null && destination !== null && origin !== destination && user !== null;

  async function onSubmit() {
    if (!valid || !user) return;
    try {
      const day = DAYS[dayIndex];
      const window = WINDOWS[windowIndex];
      const base = new Date();
      base.setDate(base.getDate() + day.offset);
      const start = new Date(base);
      start.setHours(window.startHour, 0, 0, 0);
      const end = new Date(base);
      end.setHours(window.endHour, 0, 0, 0);

      // Si la fenetre est deja passee aujourd hui, on bascule sur demain.
      if (start.getTime() < Date.now() && day.offset === 0) {
        start.setDate(start.getDate() + 1);
        end.setDate(end.getDate() + 1);
      }

      await create.mutateAsync({
        passengerId: user.id,
        originCity: origin!,
        destinationCity: destination!,
        departureStart: start.toISOString(),
        departureEnd: end.toISOString(),
        seatsNeeded: seats,
        message: message.trim() || undefined,
      });

      Alert.alert(
        'Demande publiée',
        'Les conducteurs sur ta route peuvent maintenant te proposer leur trajet.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (e: unknown) {
      Alert.alert('Publication impossible', describeError(e));
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.textOnPrimary} />
        </Pressable>
        <Text variant="subtitle" color={colors.textOnPrimary}>
          Publier ma demande
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <Screen contentStyle={{ gap: spacing.md, paddingTop: spacing.lg }}>
        <Text variant="caption" color={colors.textSecondary}>
          Tu ne trouves pas de trajet ? Dis aux conducteurs où tu vas, ils pourront te contacter.
        </Text>

        <Card style={{ gap: spacing.sm }}>
          <Text variant="label">Départ</Text>
          <CityRow value={origin} onChange={setOrigin} exclude={destination} />
          <Text variant="label" style={{ marginTop: spacing.sm }}>
            Arrivée
          </Text>
          <CityRow value={destination} onChange={setDestination} exclude={origin} />
        </Card>

        <Card style={{ gap: spacing.sm }}>
          <Text variant="label">Quel jour ?</Text>
          <View style={styles.chipsRow}>
            {DAYS.map((d, i) => {
              const active = dayIndex === i;
              return (
                <Pressable
                  key={d.label}
                  onPress={() => setDayIndex(i)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text
                    variant="label"
                    color={active ? colors.textOnPrimary : colors.textPrimary}
                  >
                    {d.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text variant="label" style={{ marginTop: spacing.sm }}>
            Quelle fenêtre ?
          </Text>
          <View style={{ gap: spacing.xs }}>
            {WINDOWS.map((w, i) => {
              const active = windowIndex === i;
              return (
                <Pressable
                  key={w.label}
                  onPress={() => setWindowIndex(i)}
                  style={[styles.windowRow, active && styles.windowRowActive]}
                >
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={active ? colors.primary : colors.textMuted}
                  />
                  <Text
                    variant="bodyMedium"
                    color={active ? colors.primary : colors.textPrimary}
                  >
                    {w.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={{ gap: spacing.sm }}>
          <Text variant="label">Combien de places ?</Text>
          <View style={styles.chipsRow}>
            {SEATS_OPTIONS.map((s) => {
              const active = seats === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => setSeats(s)}
                  style={[styles.seatChip, active && styles.chipActive]}
                >
                  <Text
                    variant="subtitle"
                    color={active ? colors.textOnPrimary : colors.textPrimary}
                  >
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={{ gap: spacing.sm }}>
          <View style={styles.row}>
            <Text variant="label">Message (optionnel)</Text>
            <Text variant="caption" color={colors.textSecondary}>
              {message.length}/{MAX_MESSAGE}
            </Text>
          </View>
          <TextInput
            value={message}
            onChangeText={(v) => setMessage(v.slice(0, MAX_MESSAGE))}
            placeholder="ex : je peux partir à n'importe quelle heure"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.bioInput]}
          />
        </Card>

        <Button
          label="Publier ma demande"
          onPress={onSubmit}
          disabled={!valid || create.isPending}
          loading={create.isPending}
          left={<Ionicons name="paper-plane" size={18} color={colors.textOnPrimary} />}
        />

        <Text variant="caption" center color={colors.textMuted} style={{ marginTop: spacing.sm }}>
          Ta demande reste visible 7 jours. Tu peux l'annuler à tout moment.
        </Text>
      </Screen>
    </View>
  );
}

function CityRow({
  value,
  onChange,
  exclude,
}: {
  value: string | null;
  onChange: (v: string) => void;
  exclude?: string | null;
}) {
  return (
    <View style={styles.chipsRow}>
      {CITIES.filter((c) => c.name !== exclude).map((c) => {
        const active = value === c.name;
        return (
          <Pressable
            key={c.name}
            onPress={() => onChange(c.name)}
            style={[styles.cityChip, active && styles.chipActive]}
          >
            <Text variant="label" color={active ? colors.textOnPrimary : colors.textPrimary}>
              {c.name}
            </Text>
          </Pressable>
        );
      })}
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
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  cityChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  seatChip: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  windowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  windowRowActive: { borderColor: colors.primary, backgroundColor: 'rgba(27,61,110,0.06)' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
});
