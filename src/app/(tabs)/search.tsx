import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityPicker } from '@/components/CityPicker';
import { TripCard } from '@/components/TripCard';
import { Card, Text } from '@/components/ui';
import { DEMO_MATCH, DEMO_TRIPS } from '@/constants/mock';
import { useTripSearchStore } from '@/stores/tripSearchStore';
import { colors, fonts, fontSize, radius, spacing, TAB_BAR_HEIGHT } from '@/theme';
import { Pressable } from 'react-native';

const FILTERS = ['⇅ Heure', '≤ 30 DT', '2 places', 'Vérifié'];

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { origin, destination, setOrigin, setDestination, swap } = useTripSearchStore();

  return (
    <View style={styles.root}>
      {/* Header bleu avec sélection trajet */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text variant="heading" color={colors.textOnPrimary} style={{ marginBottom: spacing.md }}>
          Trouver un trajet
        </Text>
        <Card elevation="floating" style={styles.searchCard}>
          <View style={styles.pickerRow}>
            <View style={{ flex: 1 }}>
              <CityPicker label="Départ" value={origin} dotColor={colors.accentSecondary} onSelect={setOrigin} />
              <View style={styles.divider} />
              <CityPicker label="Arrivée" value={destination} dotColor={colors.primary} onSelect={setDestination} />
            </View>
            <Pressable style={styles.swap} onPress={swap} hitSlop={8}>
              <Ionicons name="swap-vertical" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </Card>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: TAB_BAR_HEIGHT + spacing.xl, gap: spacing.md }}
      >
        {/* Filtres rapides */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => (
            <Pressable key={f} style={styles.chip}>
              <Text style={styles.chipText}>{f}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Suggestion match intelligent (différenciateur Machii) */}
        <Text variant="label" color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
          ⚡ Suggestion sur ta route
        </Text>
        <TripCard trip={DEMO_MATCH} asMatch onPress={() => router.push(`/trip/${DEMO_MATCH.id}`)} />

        {/* Trajets directs */}
        <Text variant="label" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
          Trajets directs · {DEMO_TRIPS.length}
        </Text>
        {DEMO_TRIPS.map((trip) => (
          <TripCard key={trip.id} trip={trip} onPress={() => router.push(`/trip/${trip.id}`)} />
        ))}

        <Card style={styles.hint}>
          <Text variant="body" color={colors.textSecondary}>
            💡 Tu ne trouves pas ? Publie ta demande de trajet et les conducteurs te contacteront.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  searchCard: {},
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.xl },
  swap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipText: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.textPrimary },
  hint: { backgroundColor: colors.surfaceAlt },
});
