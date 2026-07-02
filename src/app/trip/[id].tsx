import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconCar, IconClock, IconLock, IconStar } from '@/components/icons';
import { TripMap } from '@/components/TripMap';
import { Avatar, Badge, Button, Card, LegalBanner, RoutePoints, Screen, Text } from '@/components/ui';
import { useCreateBooking, useMyBookingForTrip } from '@/lib/bookings';
import { describeError } from '@/lib/errors';
import { useFeature } from '@/lib/featureFlags';
import { formatDay, formatPrice, formatTime } from '@/lib/format';
import { useLivePosition, useShareLivePosition } from '@/lib/liveTracking';
import { useShareTrip } from '@/lib/tripShare';
import { useTrip } from '@/lib/trips';
import { useTripVehicle } from '@/lib/vehicles';
import { useAuthStore } from '@/stores/authStore';
import { colors, fontSize, radius, spacing } from '@/theme';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const { data: trip, isLoading, error } = useTrip(id);
  const createBooking = useCreateBooking();

  const isOwnTrip = !!user && !!trip && trip.driver.id === user.id;

  // Une seule demande ACTIVE possible par trajet. Une demande refusée/annulée
  // peut être renvoyée (la RPC request_booking la réactive côté serveur).
  const { data: myBooking, isLoading: bookingLoading } = useMyBookingForTrip(
    !isOwnTrip ? trip?.id : undefined,
    !isOwnTrip ? user?.id : undefined,
  );
  const bookingIsActive = !!myBooking && (myBooking.status === 'pending' || myBooking.status === 'accepted' || myBooking.status === 'completed');

  const canRequest =
    !!user && !!trip && !isOwnTrip && !bookingLoading && !bookingIsActive && trip.seatsAvailable > 0;

  // Temps réel (décision #11) : chacun peut partager SA position sur ce trajet.
  // Conducteur -> visible par les passagers acceptés (in-app).
  // Passager   -> visible par son proche via le lien web (#11-B).
  const myShare = useShareLivePosition(trip?.id, user?.id);
  const livePosition = useLivePosition(
    !isOwnTrip ? trip?.id : undefined,
    !isOwnTrip ? trip?.driver.id : undefined,
  );

  // #11-B : partage du trajet à un proche (lien web 4h).
  const shareTrip = useShareTrip();

  // F4 : carte du trajet (désactivable à distance si un build pose problème).
  const mapEnabled = useFeature('trip_map');

  // #12-A : véhicule + affichage échelonné (option F7).
  const vehicleEnabled = useFeature('vehicle_info');
  const { data: vehicle } = useTripVehicle(vehicleEnabled ? id : undefined);
  const vehicleShown = vehicleEnabled && vehicle?.ok;

  async function onShareToContact() {
    if (!trip || !user) return;
    try {
      await shareTrip.mutateAsync({
        tripId: trip.id,
        userId: user.id,
        originLabel: trip.origin,
        destinationLabel: trip.destination,
      });
      // Active aussi le partage de position pour que le proche voie le point bouger.
      if (!myShare.sharing) await myShare.start();
    } catch (e: unknown) {
      Alert.alert('Partage impossible', describeError(e));
    }
  }

  function onRequest() {
    if (!trip || !user) return;
    createBooking.mutate(
      { tripId: trip.id },
      {
        onSuccess: () => {
          Alert.alert(
            'Demande envoyée',
            `${trip.driver.fullName} va recevoir ta demande et te répondra. Tu pourras voir son numéro dès qu'elle sera acceptée.`,
            [{ text: 'OK', onPress: () => router.back() }],
          );
        },
        onError: (e: unknown) => Alert.alert('Demande impossible', describeError(e)),
      },
    );
  }

  // Statuts ACTIFS → on affiche l'état. Refusé/annulé → on laisse re-demander.
  const activeBookingNotice: Record<string, string> = {
    pending: `Demande envoyée ✓ — en attente de la réponse de ${trip?.driver.fullName ?? 'la conductrice'}.`,
    accepted: 'Demande acceptée ✓ — retrouve les détails dans « Mes trajets ».',
    completed: 'Ce trajet est terminé.',
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={colors.textOnPrimary} />
        </Pressable>
        <Text variant="subtitle" color={colors.textOnPrimary}>Détail du trajet</Text>
        <View style={{ width: 26 }} />
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {error && !isLoading && (
        <View style={styles.center}>
          <Text variant="body" color={colors.textSecondary}>
            ⚠️ Impossible de charger : {error instanceof Error ? error.message : 'erreur'}
          </Text>
        </View>
      )}

      {!isLoading && !error && !trip && (
        <View style={styles.center}>
          <Text variant="body" color={colors.textSecondary}>Trajet introuvable.</Text>
        </View>
      )}

      {trip && (
        <>
          <Screen contentStyle={{ gap: spacing.md, paddingTop: spacing.lg }}>
            <Card style={styles.driver}>
              <Avatar
                name={trip.driver.fullName}
                uri={trip.driver.avatarUrl ?? undefined}
                tint={trip.driver.avatarTint}
                size={56}
                verified={trip.driver.isVerified}
              />
              <View style={{ flex: 1 }}>
                <Text variant="subtitle">{trip.driver.fullName}</Text>
                <View style={styles.metaRow}>
                  <IconStar size={15} />
                  <Text variant="caption">
                    {trip.driver.isNew ? 'Nouveau' : `${trip.driver.ratingAvg.toFixed(1)} · ${trip.driver.tripCount} trajets`}
                  </Text>
                </View>
              </View>
              {trip.driver.isVerified && <Badge label="Vérifié" tone="verified" icon="✓" />}
            </Card>

            {mapEnabled && (
              <TripMap
                originLabel={trip.origin}
                destinationLabel={trip.destination}
                livePosition={livePosition}
              />
            )}

            {livePosition && (
              <Card style={styles.liveBanner}>
                <View style={styles.liveDot} />
                <Text variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
                  {trip.driver.fullName} partage sa position en direct
                </Text>
              </Card>
            )}

            {isOwnTrip && (
              <Button
                label={myShare.sharing ? 'Arrêter le partage de position' : 'Partager ma position en direct'}
                variant={myShare.sharing ? 'outline' : 'secondary'}
                left={
                  <Ionicons
                    name={myShare.sharing ? 'location' : 'location-outline'}
                    size={18}
                    color={myShare.sharing ? colors.primary : colors.textOnPrimary}
                  />
                }
                onPress={() => (myShare.sharing ? myShare.stop() : myShare.start())}
              />
            )}

            {/* #11-B — Partage à un proche : pour TOUT participant (1 tap). */}
            {user && (
              <Button
                label="Partager mon trajet à un proche"
                variant="outline"
                left={<Ionicons name="share-social-outline" size={18} color={colors.primary} />}
                onPress={onShareToContact}
                loading={shareTrip.isPending}
              />
            )}
            {myShare.sharing && !isOwnTrip && (
              <Text variant="caption" color={colors.textSecondary} center>
                Position partagée avec ton proche (s'arrête à la fermeture de l'app ou après 4h)
              </Text>
            )}
            {myShare.error && (
              <Text variant="caption" color={colors.danger} center>
                {myShare.error}
              </Text>
            )}

            <Card style={{ gap: spacing.lg }}>
              <RoutePoints origin={trip.origin} destination={trip.destination} via={trip.via} />
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <Text variant="bodyMedium">{formatDay(trip.departureTime)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <IconClock size={18} />
                  <Text variant="bodyMedium">{formatTime(trip.departureTime)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="people-outline" size={18} color={colors.primary} />
                  <Text variant="bodyMedium">{trip.seatsAvailable} places</Text>
                </View>
              </View>
            </Card>

            {vehicleShown ? (
              <Card style={styles.locked}>
                <View style={styles.lockRow}>
                  <IconCar size={22} />
                  <Text variant="bodyMedium" style={{ flex: 1 }}>
                    {[vehicle?.make, vehicle?.model].filter(Boolean).join(' ') || 'Véhicule'}
                    {vehicle?.color ? ` · ${vehicle.color}` : ''}
                  </Text>
                </View>
                {vehicle?.revealed ? (
                  <>
                    <View style={styles.lockNotice}>
                      <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
                      <Text variant="bodyMedium" style={{ flex: 1 }}>
                        Plaque : {vehicle?.plate ?? '—'}
                      </Text>
                    </View>
                    {vehicle?.photo_url && (
                      <Image
                        source={{ uri: vehicle.photo_url }}
                        style={styles.vehiclePhoto}
                        resizeMode="cover"
                      />
                    )}
                  </>
                ) : (
                  <View style={styles.lockNotice}>
                    <IconLock size={18} />
                    <Text variant="caption" style={{ flex: 1 }}>
                      Plaque et photo visibles dès que ta demande sera acceptée.
                    </Text>
                  </View>
                )}
              </Card>
            ) : (
              <Card style={styles.locked}>
                <View style={styles.lockRow}>
                  <IconCar size={22} />
                  <Text variant="bodyMedium" style={{ flex: 1 }}>Véhicule communiqué après acceptation</Text>
                </View>
                <View style={styles.lockNotice}>
                  <IconLock size={18} />
                  <Text variant="caption" style={{ flex: 1 }}>
                    Plaque, photo réelle et numéro de téléphone visibles dès que ta demande sera acceptée.
                  </Text>
                </View>
              </Card>
            )}

            <Card style={styles.priceCard}>
              <Text variant="body" color={colors.textSecondary}>Participation suggérée</Text>
              <Text variant="title" color={trip.pricePerSeat === 0 ? colors.success : colors.primary}>
                {formatPrice(trip.pricePerSeat, trip.country)}
              </Text>
            </Card>

            <LegalBanner compact country={trip.country} />
          </Screen>

          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
            {isOwnTrip ? (
              <Text variant="body" color={colors.textSecondary} center>
                C'est ton propre trajet — gère les demandes reçues dans l'onglet « Mes trajets ».
              </Text>
            ) : bookingLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : bookingIsActive ? (
              <Text
                variant="body"
                color={myBooking?.status === 'accepted' ? colors.success : colors.textSecondary}
                center
              >
                {activeBookingNotice[myBooking?.status ?? ''] ?? 'Demande déjà enregistrée pour ce trajet.'}
              </Text>
            ) : (
              <>
                {(myBooking?.status === 'rejected' || myBooking?.status === 'cancelled') && (
                  <Text variant="caption" color={colors.textSecondary} center style={{ marginBottom: spacing.sm }}>
                    {myBooking?.status === 'rejected'
                      ? 'Ta demande précédente a été refusée — tu peux en renvoyer une.'
                      : 'Tu avais annulé ta demande — tu peux en renvoyer une.'}
                  </Text>
                )}
                <Button
                  label="Demander à réserver"
                  onPress={onRequest}
                  disabled={!canRequest || createBooking.isPending}
                  loading={createBooking.isPending}
                />
              </>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(40,167,69,0.08)',
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
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
  back: { width: 26 },
  driver: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  locked: { gap: spacing.md },
  vehiclePhoto: { width: '100%', height: 160, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  priceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
