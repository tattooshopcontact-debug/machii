import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderBackdrop } from '@/components/home/HeaderBackdrop';
import { IconCar, IconLock, IconStar } from '@/components/icons';
import { TripMap } from '@/components/TripMap';
import { Avatar, Button, Card, LegalBanner, RoutePoints, Screen, Text } from '@/components/ui';
import { useCreateBooking, useMyBookingForTrip } from '@/lib/bookings';
import { describeError } from '@/lib/errors';
import { useFeature } from '@/lib/featureFlags';
import { formatDay, formatPrice, formatTime } from '@/lib/format';
import { useLivePosition, useShareLivePosition } from '@/lib/liveTracking';
import { usePublicProfile } from '@/lib/profile';
import { useShareTrip } from '@/lib/tripShare';
import { useTrip } from '@/lib/trips';
import { useTripVehicle } from '@/lib/vehicles';
import { useAuthStore } from '@/stores/authStore';
import { colors, fonts, palette, radius, shadows, spacing } from '@/theme';

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

  // Préférences du conducteur (chips) — même RPC que le pop-up profil.
  const { data: driverProfile } = usePublicProfile(trip?.driver.id);
  const prefChips = driverProfile
    ? [
        driverProfile.prefSmoking ? '🚬 Fumeur OK' : '🚭 Non-fumeur',
        driverProfile.prefMusic ? '🎵 Musique OK' : '🔇 Sans musique',
        ...(driverProfile.prefPets ? ['🐾 Animaux OK'] : []),
        ...(driverProfile.prefChat === 'quiet'
          ? ['🤫 Trajet calme']
          : driverProfile.prefChat === 'chatty'
            ? ['💬 Discussion']
            : []),
      ]
    : [];

  return (
    <View style={styles.root}>
      {/* Header v5 : fond navy animé + conducteur intégré */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <HeaderBackdrop />
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.glassBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.textOnPrimary} />
          </Pressable>
          <Text variant="subtitle" color={colors.textOnPrimary}>Détail du trajet</Text>
          {trip && user ? (
            <Pressable onPress={onShareToContact} hitSlop={10} style={styles.glassBtn}>
              <Ionicons name="share-outline" size={19} color={colors.textOnPrimary} />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {trip && (
          <Pressable
            style={styles.driverHeader}
            onPress={() => router.push(`/user/${trip.driver.id}` as Href)}
          >
            <Avatar
              name={trip.driver.fullName}
              uri={trip.driver.avatarUrl ?? undefined}
              tint={trip.driver.avatarTint}
              size={72}
              verified={trip.driver.isVerified}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.driverName} numberOfLines={1}>{trip.driver.fullName}</Text>
              <View style={styles.driverMeta}>
                <IconStar size={14} />
                <Text style={styles.driverMetaText}>
                  {trip.driver.isNew
                    ? 'Nouveau membre'
                    : `${trip.driver.ratingAvg.toFixed(1)} · ${trip.driver.tripCount} trajets`}
                </Text>
              </View>
              <View style={styles.pillRow}>
                {trip.driver.isVerified ? (
                  <View style={[styles.pill, styles.pillGreen]}>
                    <Ionicons name="checkmark" size={11} color="#fff" />
                    <Text style={styles.pillText}>VÉRIFIÉ</Text>
                  </View>
                ) : (
                  <View style={[styles.pill, styles.pillNavy]}>
                    <Text style={styles.pillText}>NOUVEAU PROFIL</Text>
                  </View>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
          </Pressable>
        )}
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
          <Screen contentStyle={{ gap: spacing.md, paddingTop: 0 }}>
            {/* Carte détails flottante (chevauche le header, style v5) */}
            <Card elevation="floating" style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Détails du trajet</Text>
              <RoutePoints origin={trip.origin} destination={trip.destination} via={trip.via} labels />
              <View style={styles.detailsDivider} />
              <View style={styles.detailsFooter}>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.infoItem}>
                    <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                    <Text variant="bodyMedium">
                      {formatDay(trip.departureTime)} · {formatTime(trip.departureTime)}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="people-outline" size={16} color={colors.primary} />
                    <Text variant="caption" color={colors.textSecondary}>
                      {trip.seatsAvailable} place{trip.seatsAvailable > 1 ? 's' : ''} disponible
                      {trip.seatsAvailable > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>{formatPrice(trip.pricePerSeat, trip.country)}</Text>
                </View>
              </View>
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

            {/* #11-B — Partage à un proche : bouton déplacé dans le header (icône). */}
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

            {prefChips.length > 0 && (
              <View style={{ gap: spacing.sm }}>
                <Text style={styles.sectionTitle}>Préférences du conducteur</Text>
                <View style={styles.chipsWrap}>
                  {prefChips.map((c) => (
                    <View key={c} style={styles.prefChip}>
                      <Text style={styles.prefChipText}>{c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {!!driverProfile?.bio && (
              <View style={{ gap: spacing.sm }}>
                <Text style={styles.sectionTitle}>À propos</Text>
                <Card>
                  <Text style={styles.bioText}>« {driverProfile.bio} »</Text>
                </Card>
              </View>
            )}

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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  glassBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Conducteur intégré au header (style v5)
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  driverName: {
    color: colors.textOnPrimary,
    fontFamily: fonts.heavy,
    fontSize: 21,
    letterSpacing: -0.4,
  },
  driverMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 3 },
  driverMetaText: { color: 'rgba(255,255,255,0.78)', fontFamily: fonts.semibold, fontSize: 13 },
  pillRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  pillGreen: { backgroundColor: colors.success },
  pillNavy: { backgroundColor: 'rgba(255,255,255,0.16)' },
  pillText: {
    color: '#fff',
    fontFamily: fonts.heavy,
    fontSize: 10,
    letterSpacing: 0.8,
  },

  // Carte détails flottante
  detailsCard: { marginTop: spacing.md, gap: spacing.md },
  sectionTitle: {
    color: colors.primary,
    fontFamily: fonts.heavy,
    fontSize: 12,
    letterSpacing: 1.9,
    textTransform: 'uppercase',
  },
  detailsDivider: { height: 1, backgroundColor: 'rgba(15,42,82,0.08)' },
  detailsFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  priceBadge: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md + 2,
    backgroundColor: colors.accent,
    ...shadows.cta,
  },
  priceBadgeText: {
    color: palette.onYellow,
    fontFamily: fonts.heavy,
    fontSize: 18,
    letterSpacing: -0.3,
  },

  // Préférences + bio
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  prefChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  prefChipText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 13 },
  bioText: {
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 22,
    fontStyle: 'italic',
  },
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
