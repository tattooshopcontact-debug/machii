import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityPicker } from '@/components/CityPicker';
import { Button, Card, LegalBanner, Screen, Text } from '@/components/ui';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function CreateTripScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [origin, setOrigin] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [recurring, setRecurring] = useState(false);
  const [days, setDays] = useState<number[]>([]);
  const [time, setTime] = useState('18:00');
  const [seats, setSeats] = useState(3);
  const [price, setPrice] = useState('');

  const valid = !!origin && !!destination && origin !== destination;

  function toggleDay(i: number) {
    setDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));
  }

  function onPublish() {
    if (!valid) return;
    Alert.alert('Trajet publié', `${origin} → ${destination} a été publié.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.textOnPrimary} />
        </Pressable>
        <Text variant="subtitle" color={colors.textOnPrimary}>Publier un trajet</Text>
        <View style={{ width: 26 }} />
      </View>

      <Screen contentStyle={{ gap: spacing.md, paddingTop: spacing.lg }}>
        {/* Trajet */}
        <Card>
          <CityPicker label="Départ" value={origin} dotColor={colors.accentSecondary} onSelect={setOrigin} />
          <View style={styles.divider} />
          <CityPicker label="Arrivée" value={destination} dotColor={colors.primary} onSelect={setDestination} />
        </Card>

        {/* Quand */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="heading">Quand ?</Text>
          <View style={styles.toggle}>
            <Pressable
              style={[styles.toggleItem, !recurring && styles.toggleActive]}
              onPress={() => setRecurring(false)}
            >
              <Text variant="label" color={!recurring ? colors.primary : colors.textSecondary}>Ponctuel</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleItem, recurring && styles.toggleActive]}
              onPress={() => setRecurring(true)}
            >
              <Text variant="label" color={recurring ? colors.primary : colors.textSecondary}>Répétitif</Text>
            </Pressable>
          </View>

          {recurring && (
            <View style={styles.daysRow}>
              {DAYS.map((d, i) => (
                <Pressable
                  key={i}
                  style={[styles.dayChip, days.includes(i) && styles.dayChipActive]}
                  onPress={() => toggleDay(i)}
                >
                  <Text variant="label" color={days.includes(i) ? colors.primary : colors.textSecondary}>{d}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text variant="bodyMedium">Heure de départ</Text>
            <TextInput value={time} onChangeText={setTime} style={styles.timeInput} keyboardType="numbers-and-punctuation" />
          </View>
        </Card>

        {/* Détails */}
        <Card style={{ gap: spacing.lg }}>
          <View style={styles.counterRow}>
            <Text variant="bodyMedium">Places disponibles</Text>
            <View style={styles.counter}>
              <Pressable onPress={() => setSeats((s) => Math.max(1, s - 1))} style={styles.counterBtn}>
                <Ionicons name="remove" size={18} color={colors.primary} />
              </Pressable>
              <Text variant="subtitle">{seats}</Text>
              <Pressable onPress={() => setSeats((s) => Math.min(8, s + 1))} style={styles.counterBtn}>
                <Ionicons name="add" size={18} color={colors.primary} />
              </Pressable>
            </View>
          </View>

          <View>
            <View style={styles.priceLabel}>
              <Text variant="bodyMedium">Participation suggérée</Text>
              <Text variant="caption">Facultatif</Text>
            </View>
            <View style={styles.priceInputRow}>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                style={styles.priceInput}
              />
              <Text variant="subtitle" color={colors.textSecondary}>DT</Text>
            </View>
          </View>
        </Card>

        <LegalBanner compact />

        <Button label="Publier le trajet" onPress={onPublish} disabled={!valid} style={{ marginTop: spacing.sm }} />
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
  divider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.xl },
  toggle: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 4, gap: 4 },
  toggleItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.sm },
  toggleActive: { backgroundColor: colors.accent },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: { backgroundColor: colors.accent },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timeInput: {
    marginLeft: 'auto',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    minWidth: 80,
    textAlign: 'center',
  },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  counterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceLabel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  priceInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  priceInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.semibold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
});
