import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconCar, IconClock, IconLock, IconStar } from '@/components/icons';
import { Avatar, Badge, Button, Card, LegalBanner, RoutePoints, Screen, Text } from '@/components/ui';
import { DEMO_MATCH, DEMO_TRIPS } from '@/constants/mock';
import { formatDay, formatPrice, formatTime } from '@/lib/format';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const trip = [...DEMO_TRIPS, DEMO_MATCH].find((t) => t.id === id) ?? DEMO_TRIPS[0];

  function onRequest() {
    Alert.alert(
      'Demande envoyée',
      `Ta demande a été envoyée à ${trip.driver.fullName}. (Démo : on simule l'acceptation.)`,
      [{ text: 'Voir la confirmation', onPress: () => router.push({ pathname: '/trip/confirmed', params: { id: trip.id } }) }],
    );
  }

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

      <Screen contentStyle={{ gap: spacing.md, paddingTop: spacing.lg }}>
        {/* Conducteur */}
        <Card style={styles.driver}>
          <Avatar name={trip.driver.fullName} tint={trip.driver.avatarTint} size={56} verified={trip.driver.isVerified} />
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

        {/* Trajet */}
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

        {/* Véhicule générique + cadenas (affichage échelonné, décision #12) */}
        <Card style={styles.locked}>
          <View style={styles.lockRow}>
            <IconCar size={22} />
            <Text variant="bodyMedium" style={{ flex: 1 }}>Renault Clio · Couleur bleue</Text>
          </View>
          <View style={styles.lockNotice}>
            <IconLock size={18} />
            <Text variant="caption" style={{ flex: 1 }}>
              Plaque et photo réelle du véhicule visibles après confirmation de ta réservation.
            </Text>
          </View>
        </Card>

        {/* Prix */}
        <Card style={styles.priceCard}>
          <Text variant="body" color={colors.textSecondary}>Participation suggérée</Text>
          <Text variant="title" color={trip.pricePerSeat === 0 ? colors.success : colors.primary}>
            {formatPrice(trip.pricePerSeat)}
          </Text>
        </Card>

        <LegalBanner compact />
      </Screen>

      {/* CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button label="Demander à réserver" onPress={onRequest} />
      </View>
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
  back: { width: 26 },
  driver: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  locked: { gap: spacing.md },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lockNotice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceAlt, padding: spacing.md, borderRadius: radius.md },
  priceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
