import { StyleSheet, View } from 'react-native';

import { IconStar } from '@/components/icons';
import { Avatar, Badge, Card, RoutePoints, Text } from '@/components/ui';
import { formatDay, formatPrice, formatTime } from '@/lib/format';
import { colors, fonts, fontSize, spacing } from '@/theme';
import type { Trip } from '@/types/models';

type TripCardProps = {
  trip: Trip;
  onPress?: () => void;
  /** Variante "match intelligent" : bordure jaune + badge waypoint. */
  asMatch?: boolean;
};

export function TripCard({ trip, onPress, asMatch = false }: TripCardProps) {
  const priceTone = trip.pricePerSeat === 0 ? 'free' : trip.pricePerSeat === null ? 'negotiable' : 'neutral';

  return (
    <Card onPress={onPress} highlighted={asMatch} style={styles.card}>
      {asMatch && (
        <View style={styles.matchRow}>
          <Badge label="MATCH INTELLIGENT" tone="free" icon="⚡" />
          {trip.detourMinutes != null && (
            <Text style={styles.detour}>+{trip.detourMinutes} min de route</Text>
          )}
        </View>
      )}

      <View style={styles.topRow}>
        <Avatar
          name={trip.driver.fullName}
          uri={trip.driver.avatarUrl ?? undefined}
          tint={trip.driver.avatarTint}
          size={44}
          verified={trip.driver.isVerified}
        />
        <View style={styles.driverInfo}>
          <Text variant="subtitle" numberOfLines={1}>
            {trip.driver.fullName}
          </Text>
          <View style={styles.metaRow}>
            {trip.driver.isNew ? (
              <Badge label="NOUVEAU" tone="new" />
            ) : (
              <>
                <IconStar size={15} />
                <Text style={styles.meta}>
                  {trip.driver.ratingAvg.toFixed(1)} · {trip.driver.tripCount} trajets
                </Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.priceCol}>
          {priceTone === 'free' ? (
            <Badge label="Gratuit" tone="free" />
          ) : (
            <Text style={styles.price}>{formatPrice(trip.pricePerSeat)}</Text>
          )}
        </View>
      </View>

      <View style={styles.routeRow}>
        <RoutePoints origin={trip.origin} destination={trip.destination} via={trip.via} compact />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {formatDay(trip.departureTime)} · {formatTime(trip.departureTime)}
        </Text>
        <View style={styles.footerTags}>
          {trip.isRecurring && <Badge label="Récurrent" tone="recurring" icon="🔄" />}
          <Text style={styles.seats}>
            {trip.seatsAvailable}/{trip.seatsTotal} places
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detour: { fontFamily: fonts.semibold, fontSize: fontSize.xs, color: colors.success },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  driverInfo: { flex: 1, gap: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  meta: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textSecondary },
  priceCol: { alignItems: 'flex-end' },
  price: { fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.primary },
  routeRow: { paddingLeft: spacing.xs },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  footerText: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.textPrimary },
  footerTags: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  seats: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textSecondary },
});
