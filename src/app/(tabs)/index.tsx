import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TripCard } from '@/components/TripCard';
import { Avatar, Button, Card, Logo, Text } from '@/components/ui';
import { useMyIncomingBookings } from '@/lib/bookings';
import { useMyPublishedTrips, useSearchTrips } from '@/lib/trips';
import { resolveEffectiveMode, useAppModeStore, type AppMode } from '@/stores/appModeStore';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, shadows, spacing, TAB_BAR_HEIGHT } from '@/theme';

const POPULAR_DESTINATIONS = ['Tunis', 'Sousse', 'Sfax', 'Hammamet', 'Nabeul', 'Djerba'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const mode = useAppModeStore((s) => s.mode);
  const setMode = useAppModeStore((s) => s.setMode);
  const effectiveMode = resolveEffectiveMode(role, mode);
  const isBothRoles = role === 'both';

  const firstName = (user?.fullName ?? '').split(' ')[0];

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + spacing.xl }}
      >
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.headerTop}>
            <Logo size={24} inverted />
            <Avatar
              name={user?.fullName ?? 'F'}
              uri={user?.avatarKey ? null : user?.avatarUrl ?? undefined}
              assetKey={user?.avatarKey}
              tint={user?.avatarTint ?? 'yellow'}
              size={40}
            />
          </View>

          {isBothRoles && <ModeSwitcher current={effectiveMode} onChange={setMode} />}

          <Text variant="bodyMedium" color="rgba(255,255,255,0.75)" style={styles.hello}>
            Salut {firstName} 👋
          </Text>
          <Text variant="title" color={colors.textOnPrimary} style={styles.greeting}>
            {effectiveMode === 'driver' ? 'Prêt à conduire ?' : 'Où veux-tu aller ?'}
          </Text>

          {effectiveMode === 'driver' ? <DriverHero /> : <PassengerHero />}
        </View>

        {effectiveMode === 'driver' ? <DriverBody userId={user?.id} /> : <PassengerBody userId={user?.id} />}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Switcher passager / conducteur (visible uniquement si role='both')
// ============================================================================
function ModeSwitcher({ current, onChange }: { current: AppMode; onChange: (m: AppMode) => void }) {
  return (
    <View style={styles.switcher}>
      <Pressable
        onPress={() => onChange('passenger')}
        style={[styles.switcherBtn, current === 'passenger' && styles.switcherBtnActive]}
      >
        <Ionicons
          name="search"
          size={14}
          color={current === 'passenger' ? colors.primary : 'rgba(255,255,255,0.85)'}
        />
        <Text
          variant="label"
          color={current === 'passenger' ? colors.primary : 'rgba(255,255,255,0.85)'}
        >
          Passager
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('driver')}
        style={[styles.switcherBtn, current === 'driver' && styles.switcherBtnActive]}
      >
        <Ionicons
          name="car"
          size={14}
          color={current === 'driver' ? colors.primary : 'rgba(255,255,255,0.85)'}
        />
        <Text
          variant="label"
          color={current === 'driver' ? colors.primary : 'rgba(255,255,255,0.85)'}
        >
          Conducteur
        </Text>
      </Pressable>
    </View>
  );
}

// ============================================================================
// Hero passager : carte de recherche flottante (ce qu'on avait avant)
// ============================================================================
function PassengerHero() {
  const router = useRouter();
  return (
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
  );
}

// ============================================================================
// Hero conducteur : gros CTA "Publier un trajet"
// ============================================================================
function DriverHero() {
  const router = useRouter();
  return (
    <Card elevation="floating" style={styles.driverHeroCard}>
      <View style={styles.driverHeroIcon}>
        <Ionicons name="car-sport" size={28} color={colors.primary} />
      </View>
      <Text variant="heading" color={colors.primary}>Publier un trajet</Text>
      <Text variant="caption" color={colors.textSecondary} center>
        Renseigne ton départ, ton arrivée et le nombre de places. Les passagers te trouveront automatiquement.
      </Text>
      <Button
        label="Nouveau trajet"
        onPress={() => router.push('/trip/create')}
        left={<Ionicons name="add-circle" size={20} color={colors.primary} />}
        style={{ marginTop: spacing.md, alignSelf: 'stretch' }}
      />
    </Card>
  );
}

// ============================================================================
// Corps passager : destinations populaires + trajets dispos
// ============================================================================
function PassengerBody({ userId }: { userId: string | undefined }) {
  const router = useRouter();
  const { data: tripsAll, isLoading: tripsLoading } = useSearchTrips(null, null);
  const tripsPreview = (tripsAll ?? []).filter((t) => t.driver.id !== userId).slice(0, 3);

  return (
    <>
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
    </>
  );
}

// ============================================================================
// Corps conducteur : stats + demandes en attente + mes prochains trajets
// ============================================================================
function DriverBody({ userId }: { userId: string | undefined }) {
  const router = useRouter();
  const myTrips = useMyPublishedTrips(userId);
  const incoming = useMyIncomingBookings(userId);

  const openTrips = useMemo(
    () => (myTrips.data ?? []).filter((t) => t.status === 'open' || t.status === 'full'),
    [myTrips.data],
  );
  const pendingRequests = useMemo(
    () => (incoming.data ?? []).filter((b) => b.status === 'pending'),
    [incoming.data],
  );
  const upcomingPreview = openTrips.slice(0, 3);

  return (
    <>
      <View style={styles.statsRow}>
        <Pressable
          style={styles.statCard}
          onPress={() => router.push('/(tabs)/trips')}
        >
          <View style={[styles.statIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="car-sport" size={20} color={colors.primary} />
          </View>
          <Text variant="title" color={colors.primary}>{openTrips.length}</Text>
          <Text variant="caption" color={colors.textSecondary}>Trajets ouverts</Text>
        </Pressable>

        <Pressable
          style={styles.statCard}
          onPress={() => router.push('/(tabs)/trips')}
        >
          <View
            style={[
              styles.statIcon,
              { backgroundColor: pendingRequests.length > 0 ? colors.accentSecondary : colors.surfaceAlt },
            ]}
          >
            <Ionicons
              name="notifications"
              size={20}
              color={pendingRequests.length > 0 ? colors.textOnPrimary : colors.textMuted}
            />
          </View>
          <Text variant="title" color={colors.primary}>{pendingRequests.length}</Text>
          <Text variant="caption" color={colors.textSecondary}>Demandes à valider</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="heading">Mes prochains trajets</Text>
          <Pressable onPress={() => router.push('/(tabs)/trips')}>
            <Text variant="label" color={colors.primary}>Tout voir</Text>
          </Pressable>
        </View>

        {myTrips.isLoading && (
          <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {!myTrips.isLoading && upcomingPreview.length === 0 && (
          <Card style={{ backgroundColor: colors.surfaceAlt }}>
            <Text variant="body" color={colors.textSecondary}>
              Aucun trajet publié pour le moment. Publie ton premier trajet pour commencer.
            </Text>
          </Card>
        )}

        {upcomingPreview.map((trip) => (
          <TripCard key={trip.id} trip={trip} onPress={() => router.push(`/trip/${trip.id}`)} />
        ))}
      </View>
    </>
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

  // Switcher passager/conducteur (role='both')
  switcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    padding: 4,
    marginTop: spacing.lg,
    gap: 4,
  },
  switcherBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  switcherBtnActive: {
    backgroundColor: colors.surface,
  },

  hello: { marginTop: spacing.lg },
  greeting: { marginTop: spacing.xs },

  // Hero passager (carte recherche)
  searchCard: { marginTop: spacing.xl, marginBottom: -spacing.xxxl, gap: spacing.sm },
  field: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  dot: { width: 11, height: 11, borderRadius: 6 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.xl },

  // Hero conducteur
  driverHeroCard: {
    marginTop: spacing.xl,
    marginBottom: -spacing.xxxl,
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  driverHeroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

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

  // Stats conducteur
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl + spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: 'flex-start',
    ...shadows.card,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: { padding: spacing.lg, paddingTop: spacing.xl, gap: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
});
