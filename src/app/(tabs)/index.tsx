import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TripCard } from '@/components/TripCard';
import { Avatar, Button, Card, Logo, Text } from '@/components/ui';
import { useSearchTrips } from '@/lib/trips';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, shadows, spacing, TAB_BAR_HEIGHT } from '@/theme';

/** Villes mises en avant sous la recherche (axe prioritaire + côte). */
const POPULAR_DESTINATIONS = ['Tunis', 'Sousse', 'Sfax', 'Hammamet', 'Nabeul', 'Djerba'];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  // Aperçu : 3 derniers trajets ouverts, sans filtre ville.
  const { data: tripsAll, isLoading: tripsLoading } = useSearchTrips(null, null);
  const tripsPreview = (tripsAll ?? []).filter((t) => t.driver.id !== user?.id).slice(0, 3);

  const firstName = (user?.fullName ?? '').split(' ')[0];

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + spacing.xl }}
      >
        {/* Header bleu */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.headerTop}>
            <Logo size={24} inverted />
            <Avatar
              name={user?.fullName ?? 'F'}
              uri={user?.avatarUrl ?? undefined}
              tint={user?.avatarTint ?? 'yellow'}
              size={40}
            />
          </View>

          <Text variant="bodyMedium" color="rgba(255,255,255,0.75)" style={styles.hello}>
            Salut {firstName} 👋
          </Text>
          <Text variant="title" color={colors.textOnPrimary} style={styles.greeting}>
            Où veux-tu aller ?
          </Text>

          {/* Carte de recherche flottante */}
          <Card elevation="floating" style={styles.searchCard}>
            <Pressable style={styles.field} onPress={() => router.push('/(tabs)/search')}>
              <View style={[styles.dot, { backgroundColor: colors.accentSecondary }]} />
              <View style={{ flex: 1 }}>
                <Text variant="caption">Départ</Text>
                <Text variant="bodyMedium" color={colors.textMuted}>Choisir une ville</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.field} onPress={() => router.push('/(tabs)/search')}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <View style={{ flex: 1 }}>
                <Text variant="caption">Arrivée</Text>
                <Text variant="bodyMedium" color={colors.textMuted}>Choisir une ville</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </Pressable>
            <Button
              label="Rechercher un trajet"
              onPress={() => router.push('/(tabs)/search')}
              left={<Ionicons name="search" size={18} color={colors.primary} />}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        </View>

        {/* Destinations populaires — pastilles scroll horizontal */}
        <View style={styles.popularBlock}>
          <Text variant="label" color={colors.textSecondary} style={styles.popularTitle}>
            Destinations populaires
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {POPULAR_DESTINATIONS.map((city) => (
              <Pressable
                key={city}
                style={styles.chip}
                onPress={() => router.push('/(tabs)/search')}
              >
                <Ionicons name="location" size={14} color={colors.accentSecondary} />
                <Text variant="label" color={colors.primary}>{city}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Bandeau conducteur */}
        <Pressable style={styles.driverBanner} onPress={() => router.push('/trip/create')}>
          <View style={styles.driverIcon}>
            <Ionicons name="car-sport" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="subtitle">Tu conduis ?</Text>
            <Text variant="caption" color={colors.textSecondary}>
              Publie ton trajet et partage les frais
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.primary} />
        </Pressable>

        {/* Sur ta route — vrais trajets DB, on cache les siens */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="heading">
              Trajets disponibles
              {tripsPreview.length > 0 ? `  (${tripsPreview.length})` : ''}
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/search')}>
              <Text variant="label" color={colors.primary}>Tout voir</Text>
            </Pressable>
          </View>

          {tripsLoading && (
            <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}

          {!tripsLoading && tripsPreview.length === 0 && (
            <Card style={{ backgroundColor: colors.surfaceAlt }}>
              <Text variant="body" color={colors.textSecondary}>
                Aucun trajet ouvert pour le moment. Reviens bientôt ou publie le tien.
              </Text>
            </Card>
          )}

          {tripsPreview.map((trip) => (
            <TripCard key={trip.id} trip={trip} onPress={() => router.push(`/trip/${trip.id}`)} />
          ))}
        </View>
      </ScrollView>

      {/* FAB publier un trajet */}
      <Pressable
        onPress={() => router.push('/trip/create')}
        style={[styles.fab, { bottom: TAB_BAR_HEIGHT + spacing.md }]}
      >
        <Ionicons name="add" size={26} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hello: { marginTop: spacing.lg },
  greeting: { marginTop: spacing.xs },
  searchCard: { marginTop: spacing.xl, marginBottom: -spacing.xxxl, gap: spacing.sm },
  field: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  dot: { width: 11, height: 11, borderRadius: 6 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.xl },

  // Destinations populaires
  popularBlock: { marginTop: spacing.xxl + spacing.lg, gap: spacing.sm },
  popularTitle: { paddingHorizontal: spacing.lg, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipsRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },

  // Bandeau conducteur
  driverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  driverIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: { padding: spacing.lg, paddingTop: spacing.xl, gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.cta,
  },
});
