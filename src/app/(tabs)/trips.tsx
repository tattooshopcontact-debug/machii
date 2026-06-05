import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TripCard } from '@/components/TripCard';
import { Button, Card, Screen, ScreenHeader, Text } from '@/components/ui';
import { DEMO_TRIPS } from '@/constants/mock';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const TABS = ['À venir', 'Passés', 'Tous'] as const;

export default function TripsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>('À venir');

  const trips = tab === 'Passés' ? [] : DEMO_TRIPS;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Mes trajets"
        right={
          <View style={styles.counts}>
            <Text variant="caption" color="rgba(255,255,255,0.8)">À venir</Text>
            <Text variant="heading" color={colors.textOnPrimary}>{DEMO_TRIPS.length}</Text>
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
              <Text
                variant="label"
                color={tab === t ? colors.primary : colors.textSecondary}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>

        {trips.length > 0 ? (
          trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onPress={() => router.push(`/trip/${trip.id}`)} />
          ))
        ) : (
          <Card style={styles.empty}>
            <Ionicons name="car-outline" size={40} color={colors.textMuted} />
            <Text variant="subtitle" center style={{ marginTop: spacing.sm }}>
              Aucun trajet ici
            </Text>
            <Text variant="body" color={colors.textSecondary} center>
              Tes trajets passés apparaîtront ici.
            </Text>
          </Card>
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
  segItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.sm },
  segItemActive: { backgroundColor: colors.accent },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: 2 },
});
