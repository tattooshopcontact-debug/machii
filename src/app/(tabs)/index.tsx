import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TripCard } from '@/components/TripCard';
import { Avatar, Button, Card, Logo, Text } from '@/components/ui';
import { DEMO_TRIPS } from '@/constants/mock';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, shadows, spacing, TAB_BAR_HEIGHT } from '@/theme';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

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
            <Avatar name={user?.fullName ?? 'F'} tint={user?.avatarTint ?? 'yellow'} size={40} />
          </View>
          <Text variant="title" color={colors.textOnPrimary} style={styles.greeting}>
            Salut {user?.fullName ?? ''} 👋{'\n'}Où veux-tu aller ?
          </Text>

          {/* Carte de recherche flottante */}
          <Card elevation="floating" style={styles.searchCard}>
            <Pressable style={styles.field} onPress={() => router.push('/(tabs)/search')}>
              <View style={[styles.dot, { backgroundColor: colors.accentSecondary }]} />
              <Text variant="bodyMedium" color={colors.textSecondary}>Départ</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.field} onPress={() => router.push('/(tabs)/search')}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <Text variant="bodyMedium" color={colors.textSecondary}>Arrivée</Text>
            </Pressable>
            <Button
              label="Rechercher un trajet"
              onPress={() => router.push('/(tabs)/search')}
              left={<Ionicons name="search" size={18} color={colors.primary} />}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        </View>

        {/* Sur ta route */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="heading">Sur ta route</Text>
            <Pressable onPress={() => router.push('/(tabs)/search')}>
              <Text variant="label" color={colors.primary}>Tout voir</Text>
            </Pressable>
          </View>

          {DEMO_TRIPS.map((trip) => (
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
  greeting: { marginTop: spacing.lg, lineHeight: 34 },
  searchCard: { marginTop: spacing.xl, marginBottom: -spacing.xxxl, gap: spacing.sm },
  field: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  dot: { width: 11, height: 11, borderRadius: 6 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.xl },
  section: { padding: spacing.lg, paddingTop: spacing.xxl + spacing.lg, gap: spacing.md },
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
