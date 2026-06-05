import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconCar, IconChat, IconShare, IconStar } from '@/components/icons';
import { Avatar, Badge, Button, Card, RoutePoints, Screen, Text } from '@/components/ui';
import { DEMO_MATCH, DEMO_TRIPS } from '@/constants/mock';
import { formatDay, formatTime } from '@/lib/format';
import { colors, fonts, fontSize, palette, radius, shadows, spacing } from '@/theme';

const PICKUP_CODE = ['7', '2', '4', '9'];

export default function TripConfirmedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trip = [...DEMO_TRIPS, DEMO_MATCH].find((t) => t.id === id) ?? DEMO_TRIPS[0];

  function onCancel() {
    Alert.alert('Annuler la réservation', 'Es-tu sûr de vouloir annuler ?', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui, annuler', style: 'destructive', onPress: () => router.replace('/(tabs)') },
    ]);
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 26 }}>
          <Ionicons name="chevron-back" size={26} color={colors.textOnPrimary} />
        </Pressable>
        <Text variant="subtitle" color={colors.textOnPrimary}>Réservation</Text>
        <View style={{ width: 26 }} />
      </View>

      <Screen contentStyle={{ gap: spacing.md, paddingTop: spacing.lg }}>
        {/* Bannière de confirmation */}
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={20} color={palette.white} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" color={palette.white}>
              Ta réservation est confirmée par {trip.driver.fullName.split(' ')[0]}
            </Text>
            <Text variant="caption" color="rgba(255,255,255,0.85)">Départ dans 17h 32min</Text>
          </View>
        </View>

        {/* Conducteur */}
        <Card style={styles.driver}>
          <Avatar name={trip.driver.fullName} tint={trip.driver.avatarTint} size={52} verified={trip.driver.isVerified} />
          <View style={{ flex: 1 }}>
            <Text variant="subtitle">{trip.driver.fullName}</Text>
            <View style={styles.metaRow}>
              <IconStar size={14} />
              <Text variant="caption">{trip.driver.ratingAvg.toFixed(1)} · {trip.driver.tripCount} trajets</Text>
            </View>
          </View>
          <Badge label="VÉRIFIÉ" tone="verified" icon="✓" />
        </Card>

        {/* Code de prise en charge */}
        <Card style={{ alignItems: 'center', gap: spacing.md }}>
          <Text variant="label" color={colors.textSecondary}>CODE DE PRISE EN CHARGE</Text>
          <View style={styles.codeRow}>
            {PICKUP_CODE.map((d, i) => (
              <View key={i} style={styles.codeTile}>
                <Text style={styles.codeDigit}>{d}</Text>
              </View>
            ))}
          </View>
          <Text variant="caption" center>
            Communique ce code au conducteur au moment du départ.
          </Text>
        </Card>

        {/* Trajet */}
        <Card style={{ gap: spacing.lg }}>
          <RoutePoints origin={trip.origin} destination={trip.destination} via={trip.via} />
          <Text variant="bodyMedium" color={colors.textSecondary}>
            {formatDay(trip.departureTime)} · {formatTime(trip.departureTime)}
          </Text>
        </Card>

        {/* Véhicule révélé */}
        <Card style={styles.vehicle}>
          <View style={styles.vehiclePhoto}>
            <IconCar size={40} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium">Renault Clio · Bleue</Text>
            <View style={styles.plate}>
              <Text style={styles.plateText}>5847 TUN 142</Text>
            </View>
          </View>
        </Card>

        {/* Pack sécurité */}
        <View style={styles.safetyRow}>
          <Pressable style={[styles.safetyBtn, { backgroundColor: colors.primary }]}>
            <IconShare size={22} />
            <Text variant="label" color={palette.white}>Partager mon trajet</Text>
          </Pressable>
          <Pressable style={[styles.safetyBtn, { backgroundColor: colors.danger }]}>
            <Text style={{ fontSize: 22 }}>🚨</Text>
            <Text variant="label" color={palette.white}>SOS</Text>
          </Pressable>
        </View>

        {/* Chat */}
        <Button
          label={`Discuter avec ${trip.driver.fullName.split(' ')[0]}`}
          variant="secondary"
          left={<IconChat size={20} />}
          onPress={() => router.push('/(tabs)/messages')}
        />

        <Button label="Annuler la réservation" variant="outline" onPress={onCancel} style={{ borderColor: colors.danger }} />
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  driver: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  codeRow: { flexDirection: 'row', gap: spacing.sm },
  codeTile: {
    width: 56,
    height: 68,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  codeDigit: { fontFamily: fonts.heavy, fontSize: 36, color: palette.onYellow },
  vehicle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  vehiclePhoto: {
    width: 72,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plate: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  plateText: { fontFamily: fonts.heavy, fontSize: fontSize.base, color: colors.primary, letterSpacing: 1 },
  safetyRow: { flexDirection: 'row', gap: spacing.md },
  safetyBtn: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
});
