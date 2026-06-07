import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { TripCard } from '@/components/TripCard';
import { Avatar, Badge, Button, Card, Screen, ScreenHeader, Text } from '@/components/ui';
import {
  useMyIncomingBookings,
  useMyOutgoingBookings,
  useUpdateBookingStatus,
  type BookingWithRelations,
} from '@/lib/bookings';
import { describeError } from '@/lib/errors';
import { formatDay, formatTime } from '@/lib/format';
import { useMyPublishedTrips } from '@/lib/trips';
import { useAuthStore } from '@/stores/authStore';
import { colors, fontSize, radius, spacing } from '@/theme';

const TABS = ['Conduit', 'Réserve'] as const;

export default function TripsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Conduit');

  const myTrips = useMyPublishedTrips(user?.id);
  const incoming = useMyIncomingBookings(user?.id);
  const outgoing = useMyOutgoingBookings(user?.id);

  const pendingIncomingCount = useMemo(
    () => incoming.data?.filter((b) => b.status === 'pending').length ?? 0,
    [incoming.data],
  );

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Mes trajets"
        right={
          <View style={styles.counts}>
            <Text variant="caption" color="rgba(255,255,255,0.8)">À venir</Text>
            <Text variant="heading" color={colors.textOnPrimary}>
              {myTrips.data?.length ?? 0}
            </Text>
          </View>
        }
      />

      <Screen tabBarSpacing contentStyle={{ gap: spacing.md, paddingTop: spacing.lg }}>
        <View style={styles.segment}>
          {TABS.map((t) => (
            <Pressable
              key={t}
              style={[styles.segItem, tab === t && styles.segItemActive]}
              onPress={() => setTab(t)}
            >
              <Text variant="label" color={tab === t ? colors.primary : colors.textSecondary}>
                {t}
              </Text>
              {t === 'Conduit' && pendingIncomingCount > 0 && (
                <View style={styles.badge}>
                  <Text variant="caption" color={colors.textOnPrimary}>{pendingIncomingCount}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {tab === 'Conduit' ? (
          <DriverPanel
            trips={myTrips.data ?? []}
            tripsLoading={myTrips.isLoading}
            tripsError={myTrips.error}
            bookings={incoming.data ?? []}
            bookingsLoading={incoming.isLoading}
            bookingsError={incoming.error}
            onPressTrip={(id) => router.push(`/trip/edit/${id}`)}
          />
        ) : (
          <PassengerPanel
            bookings={outgoing.data ?? []}
            loading={outgoing.isLoading}
            error={outgoing.error}
            onPressTrip={(id) => router.push(`/trip/${id}`)}
          />
        )}

        <Button
          label="Publier un nouveau trajet"
          variant="secondary"
          onPress={() => router.push('/trip/create')}
          left={<Ionicons name="add" size={18} color={colors.textOnPrimary} />}
          style={{ marginTop: spacing.sm }}
        />
      </Screen>
    </View>
  );
}

function DriverPanel({
  trips,
  tripsLoading,
  tripsError,
  bookings,
  bookingsLoading,
  bookingsError,
  onPressTrip,
}: {
  trips: Awaited<ReturnType<typeof useMyPublishedTrips>>['data'] extends infer T
    ? T extends undefined
      ? never
      : T
    : never;
  tripsLoading: boolean;
  tripsError: unknown;
  bookings: BookingWithRelations[];
  bookingsLoading: boolean;
  bookingsError: unknown;
  onPressTrip: (id: string) => void;
}) {
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="label" color={colors.textSecondary}>
        Demandes reçues
      </Text>
      <IncomingBookingsList bookings={bookings} loading={bookingsLoading} error={bookingsError} />

      <Text variant="label" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
        Mes trajets publiés
      </Text>

      {tripsLoading && (
        <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!!tripsError && (
        <Card style={{ backgroundColor: colors.surfaceAlt }}>
          <Text variant="body" color={colors.textSecondary}>
            ⚠️ {tripsError instanceof Error ? tripsError.message : 'Erreur de chargement'}
          </Text>
        </Card>
      )}

      {!tripsLoading && !tripsError && trips.length === 0 && (
        <Card style={styles.empty}>
          <Ionicons name="car-outline" size={40} color={colors.textMuted} />
          <Text variant="subtitle" center style={{ marginTop: spacing.sm }}>
            Aucun trajet publié
          </Text>
          <Text variant="body" color={colors.textSecondary} center>
            Publie ton premier trajet pour que d'autres puissent réserver.
          </Text>
        </Card>
      )}

      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} onPress={() => onPressTrip(trip.id)} />
      ))}
    </View>
  );
}

function IncomingBookingsList({
  bookings,
  loading,
  error,
}: {
  bookings: BookingWithRelations[];
  loading: boolean;
  error: unknown;
}) {
  const updateStatus = useUpdateBookingStatus();

  function accept(b: BookingWithRelations) {
    Alert.alert('Accepter la demande ?', `${b.passenger?.full_name ?? 'Un passager'} attend ta réponse.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Accepter',
        onPress: () =>
          updateStatus.mutate({ bookingId: b.id, status: 'accepted' }, {
            onError: (e) => Alert.alert('Erreur', describeError(e)),
          }),
      },
    ]);
  }
  function refuse(b: BookingWithRelations) {
    Alert.alert('Refuser la demande ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Refuser',
        style: 'destructive',
        onPress: () =>
          updateStatus.mutate({ bookingId: b.id, status: 'rejected' }, {
            onError: (e) => Alert.alert('Erreur', describeError(e)),
          }),
      },
    ]);
  }

  if (loading) {
    return (
      <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <Card style={{ backgroundColor: colors.surfaceAlt }}>
        <Text variant="body" color={colors.textSecondary}>
          ⚠️ {error instanceof Error ? error.message : 'Erreur de chargement des demandes'}
        </Text>
      </Card>
    );
  }
  if (bookings.length === 0) {
    return (
      <Card style={{ backgroundColor: colors.surfaceAlt }}>
        <Text variant="body" color={colors.textSecondary}>
          Aucune demande pour le moment.
        </Text>
      </Card>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      {bookings.map((b) => (
        <BookingCard key={b.id} booking={b} variant="incoming" onAccept={accept} onRefuse={refuse} />
      ))}
    </View>
  );
}

function PassengerPanel({
  bookings,
  loading,
  error,
  onPressTrip,
}: {
  bookings: BookingWithRelations[];
  loading: boolean;
  error: unknown;
  onPressTrip: (id: string) => void;
}) {
  if (loading) {
    return (
      <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <Card style={{ backgroundColor: colors.surfaceAlt }}>
        <Text variant="body" color={colors.textSecondary}>
          ⚠️ {error instanceof Error ? error.message : 'Erreur de chargement'}
        </Text>
      </Card>
    );
  }
  if (bookings.length === 0) {
    return (
      <Card style={styles.empty}>
        <Ionicons name="search-outline" size={40} color={colors.textMuted} />
        <Text variant="subtitle" center style={{ marginTop: spacing.sm }}>
          Aucune réservation
        </Text>
        <Text variant="body" color={colors.textSecondary} center>
          Cherche un trajet et demande à réserver — tes demandes apparaîtront ici.
        </Text>
      </Card>
    );
  }
  return (
    <View style={{ gap: spacing.md }}>
      {bookings.map((b) => (
        <BookingCard key={b.id} booking={b} variant="outgoing" onPressTrip={onPressTrip} />
      ))}
    </View>
  );
}

function BookingCard({
  booking,
  variant,
  onAccept,
  onRefuse,
  onPressTrip,
}: {
  booking: BookingWithRelations;
  variant: 'incoming' | 'outgoing';
  onAccept?: (b: BookingWithRelations) => void;
  onRefuse?: (b: BookingWithRelations) => void;
  onPressTrip?: (id: string) => void;
}) {
  const trip = booking.trip;
  const otherParty = variant === 'incoming' ? booking.passenger : trip?.driver ?? null;
  const phoneVisible = booking.status === 'accepted';
  const phone = otherParty?.phone ?? null;

  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={styles.bookingHeader}>
        <Avatar
          name={otherParty?.full_name ?? '?'}
          size={40}
          tint={pickTint(otherParty?.id ?? booking.id)}
          verified={otherParty?.is_verified ?? false}
        />
        <View style={{ flex: 1 }}>
          <Text variant="bodyMedium">{otherParty?.full_name ?? 'Utilisateur'}</Text>
          {trip && (
            <Text variant="caption" color={colors.textSecondary}>
              {trip.origin_label} → {trip.destination_label} · {formatDay(trip.departure_time)} {formatTime(trip.departure_time)}
            </Text>
          )}
        </View>
        <StatusBadge status={booking.status} />
      </View>

      {phoneVisible && phone && (
        <Pressable
          style={styles.phoneRow}
          onPress={() => Linking.openURL(`tel:${phone}`)}
        >
          <Ionicons name="call" size={16} color={colors.primary} />
          <Text variant="bodyMedium" color={colors.primary}>{phone}</Text>
        </Pressable>
      )}

      {variant === 'incoming' && booking.status === 'pending' && (
        <View style={styles.actions}>
          <Button variant="secondary" label="Refuser" onPress={() => onRefuse?.(booking)} style={{ flex: 1 }} />
          <Button label="Accepter" onPress={() => onAccept?.(booking)} style={{ flex: 1 }} />
        </View>
      )}

      {variant === 'outgoing' && trip && (
        <Pressable onPress={() => onPressTrip?.(trip.id)} style={styles.detailLink}>
          <Text variant="caption" color={colors.primary}>Voir le trajet</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </Pressable>
      )}
    </Card>
  );
}

function StatusBadge({ status }: { status: BookingWithRelations['status'] }) {
  switch (status) {
    case 'pending':
      return <Badge label="En attente" tone="neutral" />;
    case 'accepted':
      return <Badge label="Accepté" tone="verified" icon="✓" />;
    case 'rejected':
      return <Badge label="Refusé" tone="neutral" />;
    case 'cancelled':
      return <Badge label="Annulé" tone="neutral" />;
    case 'completed':
      return <Badge label="Terminé" tone="verified" />;
    default:
      return null;
  }
}

const TINTS: ('orange' | 'navy' | 'yellow')[] = ['orange', 'navy', 'yellow'];
function pickTint(id: string): 'orange' | 'navy' | 'yellow' {
  const idx = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % TINTS.length;
  return TINTS[idx];
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  counts: { alignItems: 'flex-end' },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  segItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  segItemActive: { backgroundColor: colors.accent },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: 2 },
  bookingHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
});
