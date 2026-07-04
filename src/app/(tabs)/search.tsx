import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityPicker } from '@/components/CityPicker';
import { TripCard } from '@/components/TripCard';
import { Card, Text } from '@/components/ui';
import { useSearchTrips } from '@/lib/trips';
import { useAuthStore } from '@/stores/authStore';
import { useTripSearchStore } from '@/stores/tripSearchStore';
import { colors, radius, spacing, TAB_BAR_HEIGHT } from '@/theme';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { origin, destination, setOrigin, setDestination, swap } = useTripSearchStore();
  const user = useAuthStore((s) => s.user);
  const { data: trips, isLoading, error } = useSearchTrips(origin, destination, user?.country ?? 'TN');

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
              <CityPicker label="Départ" value={origin} dotColor={colors.accentSecondary} onSelect={setOrigin} country={user?.country ?? 'TN'} />
              <View style={styles.divider} />
              <CityPicker label="Arrivée" value={destination} dotColor={colors.primary} onSelect={setDestination} country={user?.country ?? 'TN'} />
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
        {/* Liste des trajets en DB */}
        <Text variant="label" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
          Trajets disponibles · {trips?.length ?? 0}
        </Text>

        {isLoading && (
          <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {error && (
          <Card style={styles.hint}>
            <Text variant="body" color={colors.textSecondary}>
              ⚠️ Impossible de charger les trajets : {error instanceof Error ? error.message : 'erreur réseau'}
            </Text>
          </Card>
        )}

        {!isLoading && trips && trips.length === 0 && (
          <Card style={styles.hint}>
            <Text variant="body" color={colors.textSecondary}>
              Aucun trajet pour le moment. Reviens bientôt ou publie une demande.
            </Text>
          </Card>
        )}

        {trips?.map((trip) => (
          <TripCard key={trip.id} trip={trip} onPress={() => router.push(`/trip/${trip.id}`)} onPressDriver={() => router.push(`/user/${trip.driver.id}` as Href)} />
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
  hint: { backgroundColor: colors.surfaceAlt },
});
