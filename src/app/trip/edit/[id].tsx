import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityPicker } from '@/components/CityPicker';
import { Button, Card, LegalBanner, Screen, Text } from '@/components/ui';
import { describeError } from '@/lib/errors';
import { useDeleteTrip, useTrip, useUpdateTrip } from '@/lib/trips';
import { useAuthStore } from '@/stores/authStore';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/**
 * Édition d'un trajet existant.
 * Accessible uniquement au conducteur du trip (la RLS bloque côté DB et l'UI
 * cache aussi le formulaire si on n'est pas le proprio).
 */
export default function EditTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { data: trip, isLoading } = useTrip(id);
  const updateTrip = useUpdateTrip();
  const deleteTrip = useDeleteTrip();

  const [origin, setOrigin] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [time, setTime] = useState('18:00');
  const [seats, setSeats] = useState(3);
  // Offert (0) ou participation à convenir de gré à gré (null) — pas de montant.
  const [priceMode, setPriceMode] = useState<'free' | 'negotiable'>('negotiable');

  // Charge les valeurs du trip dès qu'il arrive.
  useEffect(() => {
    if (!trip) return;
    setOrigin(trip.origin);
    setDestination(trip.destination);
    const d = new Date(trip.departureTime);
    setTime(`${pad2(d.getHours())}:${pad2(d.getMinutes())}`);
    setSeats(trip.seatsTotal);
    setPriceMode(trip.pricePerSeat === 0 ? 'free' : 'negotiable');
  }, [trip]);

  const isOwner = !!user && !!trip && trip.driver.id === user.id;
  const validForm = !!origin && !!destination && origin !== destination;
  // Villes + cadre légal suivent le PAYS DU TRAJET (pas celui du user) :
  // un trajet marocain s'édite avec les villes MA, même chose pour la TN.
  const tripCountry = trip?.country ?? 'TN';

  async function onSave() {
    if (!trip || !validForm) return;
    try {
      await updateTrip.mutateAsync({
        id: trip.id,
        patch: {
          origin: origin!,
          destination: destination!,
          time,
          seats,
          price: priceMode === 'free' ? 0 : null,
        },
      });
      Alert.alert('Trajet modifié', 'Tes changements ont été enregistrés.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      Alert.alert('Modification impossible', describeError(e));
    }
  }

  function onDelete() {
    if (!trip) return;
    Alert.alert(
      'Supprimer ce trajet ?',
      "Cette action est définitive. Toutes les demandes liées seront aussi annulées.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTrip.mutateAsync(trip.id);
              Alert.alert('Trajet supprimé', undefined, [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (e: unknown) {
              Alert.alert('Suppression impossible', describeError(e));
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.textOnPrimary} />
        </Pressable>
        <Text variant="subtitle" color={colors.textOnPrimary}>Modifier le trajet</Text>
        <View style={{ width: 26 }} />
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!isLoading && !trip && (
        <View style={styles.center}>
          <Text variant="body" color={colors.textSecondary}>Trajet introuvable.</Text>
        </View>
      )}

      {trip && !isOwner && (
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={40} color={colors.textMuted} />
          <Text variant="body" color={colors.textSecondary} center style={{ marginTop: spacing.md }}>
            Seul le conducteur peut modifier ce trajet.
          </Text>
        </View>
      )}

      {trip && isOwner && (
        <Screen contentStyle={{ gap: spacing.md, paddingTop: spacing.lg }}>
          <Card>
            <CityPicker
              label="Départ"
              value={origin}
              dotColor={colors.accentSecondary}
              onSelect={setOrigin}
              country={tripCountry}
            />
            <View style={styles.divider} />
            <CityPicker
              label="Arrivée"
              value={destination}
              dotColor={colors.primary}
              onSelect={setDestination}
              country={tripCountry}
            />
          </Card>

          <Card style={{ gap: spacing.md }}>
            <Text variant="heading">Heure de départ</Text>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text variant="bodyMedium">Heure</Text>
              <TextInput
                value={time}
                onChangeText={setTime}
                style={styles.timeInput}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
          </Card>

          <Card style={{ gap: spacing.lg }}>
            <View style={styles.counterRow}>
              <Text variant="bodyMedium">Places disponibles</Text>
              <View style={styles.counter}>
                <Pressable onPress={() => setSeats((s) => Math.max(1, s - 1))} style={styles.counterBtn}>
                  <Ionicons name="remove" size={18} color={colors.primary} />
                </Pressable>
                <Text variant="subtitle">{seats}</Text>
                <Pressable onPress={() => setSeats((s) => Math.min(8, s + 1))} style={styles.counterBtn}>
                  <Ionicons name="add" size={18} color={colors.primary} />
                </Pressable>
              </View>
            </View>

            <View>
              <View style={styles.priceLabel}>
                <Text variant="bodyMedium">Participation aux frais</Text>
              </View>
              <View style={styles.modeRow}>
                <Pressable
                  style={[styles.modeBtn, priceMode === 'free' && styles.modeBtnActive]}
                  onPress={() => setPriceMode('free')}
                >
                  <Ionicons name="gift-outline" size={18} color={priceMode === 'free' ? colors.primary : colors.textMuted} />
                  <Text variant="bodyMedium" color={priceMode === 'free' ? colors.primary : colors.textSecondary}>Offert</Text>
                </Pressable>
                <Pressable
                  style={[styles.modeBtn, priceMode === 'negotiable' && styles.modeBtnActive]}
                  onPress={() => setPriceMode('negotiable')}
                >
                  <Ionicons name="chatbubbles-outline" size={18} color={priceMode === 'negotiable' ? colors.primary : colors.textMuted} />
                  <Text variant="bodyMedium" color={priceMode === 'negotiable' ? colors.primary : colors.textSecondary}>À convenir</Text>
                </Pressable>
              </View>
              <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
                {priceMode === 'free'
                  ? 'Tu offres le trajet à tes passagers.'
                  : 'Vous convenez ensemble de la participation aux frais, dans le chat.'}
              </Text>
            </View>
          </Card>

          <LegalBanner compact country={tripCountry} />

          <Button
            label="Enregistrer les modifications"
            onPress={onSave}
            disabled={!validForm || updateTrip.isPending}
            loading={updateTrip.isPending}
            style={{ marginTop: spacing.sm }}
          />

          <Button
            label="Supprimer ce trajet"
            variant="outline"
            onPress={onDelete}
            disabled={deleteTrip.isPending}
            loading={deleteTrip.isPending}
            left={<Ionicons name="trash-outline" size={18} color={colors.danger} />}
            style={{ marginTop: spacing.xs }}
          />
        </Screen>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
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
  divider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.xl },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timeInput: {
    marginLeft: 'auto',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    minWidth: 80,
    textAlign: 'center',
  },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  counterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceLabel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  modeRow: { flexDirection: 'row', gap: spacing.sm },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingVertical: spacing.md,
  },
  modeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(27,61,110,0.06)',
  },
});
