import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useQueryClient } from '@tanstack/react-query';

import { CityPicker } from '@/components/CityPicker';
import { Button, Card, LegalBanner, Screen, Text } from '@/components/ui';
import { describeError } from '@/lib/errors';
import { useFeature } from '@/lib/featureFlags';
import { cityToPoint, findCity, parseDepartureTime } from '@/lib/geo';
import { supabase } from '@/lib/supabase';
import { useMyVehicle } from '@/lib/vehicles';
import { useAuthStore } from '@/stores/authStore';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function CreateTripScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { data: myVehicle } = useMyVehicle(user?.id);
  const queryClient = useQueryClient();

  const [origin, setOrigin] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [recurring, setRecurring] = useState(false);
  const [days, setDays] = useState<number[]>([]);
  const [time, setTime] = useState('18:00');
  const [seats, setSeats] = useState(3);
  const [price, setPrice] = useState('');
  const [womenOnly, setWomenOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Option femmes : proposée uniquement aux conductrices (gender = female).
  const canOfferWomenOnly = user?.gender === 'female';

  // F10 — verrou KYC : quand le flag est ON, il faut être vérifié pour publier.
  // (Le serveur applique le même verrou via trigger, l'UI ne fait que l'expliquer.)
  const kycGateEnabled = useFeature('kyc_publish_gate');
  const blockedByKyc = kycGateEnabled && !!user && !user.isVerified;

  const valid = !!origin && !!destination && origin !== destination;

  function toggleDay(i: number) {
    setDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));
  }

  async function onPublish() {
    if (!valid || !origin || !destination) return;
    if (!user) {
      Alert.alert('Erreur', 'Connecte-toi avant de publier un trajet.');
      return;
    }
    if (blockedByKyc) {
      Alert.alert(
        'Vérification requise',
        'Pour la sécurité des passagers, fais vérifier ton identité avant de publier un trajet.',
        [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Se faire vérifier', onPress: () => router.push('/profile/verify') },
        ],
      );
      return;
    }

    const originPoint = cityToPoint(origin);
    const destPoint = cityToPoint(destination);
    if (!originPoint || !destPoint) {
      Alert.alert('Erreur', 'Ville inconnue (coordonnées manquantes).');
      return;
    }

    setSubmitting(true);
    try {
      const departureTime = parseDepartureTime(time);
      const parsedPrice = price.trim() === '' ? null : Number(price);
      if (parsedPrice !== null && Number.isNaN(parsedPrice)) {
        throw new Error('Prix invalide.');
      }

      const { error } = await supabase.from('trips').insert({
        driver_id: user.id,
        origin_label: origin,
        destination_label: destination,
        origin: originPoint,
        destination: destPoint,
        departure_time: departureTime,
        seats_total: seats,
        seats_available: seats,
        price_per_seat: parsedPrice,
        status: 'open',
        is_recurring: recurring,
        // Cap Maroc M2 : le trajet hérite du pays de la ville de départ.
        country: findCity(origin)?.country ?? user.country,
        // M3 : trajet entre femmes (seulement si la conductrice l'active).
        women_only: canOfferWomenOnly && womenOnly,
        // #12-A : associe le véhicule enregistré du conducteur (s'il existe).
        vehicle_id: myVehicle?.id ?? null,
      });
      if (error) throw error;

      // Invalide tous les caches trips pour que l'écran "Mes trajets"
      // et la liste "Recherche" voient le nouveau trajet immédiatement.
      await queryClient.invalidateQueries({ queryKey: ['trips'] });

      Alert.alert('Trajet publié', `${origin} → ${destination} a été publié.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      const msg = describeError(e);
      Alert.alert(
        'Publication impossible',
        msg.includes('kyc_required')
          ? 'Fais vérifier ton identité (Profil → Se faire vérifier) avant de publier un trajet.'
          : msg,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.textOnPrimary} />
        </Pressable>
        <Text variant="subtitle" color={colors.textOnPrimary}>Publier un trajet</Text>
        <View style={{ width: 26 }} />
      </View>

      <Screen contentStyle={{ gap: spacing.md, paddingTop: spacing.lg }}>
        {/* Trajet */}
        <Card>
          <CityPicker label="Départ" value={origin} dotColor={colors.accentSecondary} onSelect={setOrigin} country={user?.country ?? 'TN'} />
          <View style={styles.divider} />
          <CityPicker label="Arrivée" value={destination} dotColor={colors.primary} onSelect={setDestination} country={user?.country ?? 'TN'} />
        </Card>

        {/* Quand */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="heading">Quand ?</Text>
          <View style={styles.toggle}>
            <Pressable
              style={[styles.toggleItem, !recurring && styles.toggleActive]}
              onPress={() => setRecurring(false)}
            >
              <Text variant="label" color={!recurring ? colors.primary : colors.textSecondary}>Ponctuel</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleItem, recurring && styles.toggleActive]}
              onPress={() => setRecurring(true)}
            >
              <Text variant="label" color={recurring ? colors.primary : colors.textSecondary}>Répétitif</Text>
            </Pressable>
          </View>

          {recurring && (
            <View style={styles.daysRow}>
              {DAYS.map((d, i) => (
                <Pressable
                  key={i}
                  style={[styles.dayChip, days.includes(i) && styles.dayChipActive]}
                  onPress={() => toggleDay(i)}
                >
                  <Text variant="label" color={days.includes(i) ? colors.primary : colors.textSecondary}>{d}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text variant="bodyMedium">Heure de départ</Text>
            <TextInput value={time} onChangeText={setTime} style={styles.timeInput} keyboardType="numbers-and-punctuation" />
          </View>
        </Card>

        {/* Détails */}
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
              <Text variant="bodyMedium">Participation suggérée</Text>
              <Text variant="caption">Facultatif</Text>
            </View>
            <View style={styles.priceInputRow}>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                style={styles.priceInput}
              />
              <Text variant="subtitle" color={colors.textSecondary}>{(user?.country ?? 'TN') === 'MA' ? 'DH' : 'DT'}</Text>
            </View>
          </View>
        </Card>

        {/* M3 — Trajet entre femmes (réservé aux conductrices) */}
        {canOfferWomenOnly && (
          <Pressable style={styles.womenRow} onPress={() => setWomenOnly((v) => !v)}>
            <Ionicons
              name={womenOnly ? 'checkbox' : 'square-outline'}
              size={22}
              color={womenOnly ? colors.primary : colors.textMuted}
            />
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" color={colors.primary}>
                👩 Trajet entre femmes uniquement
              </Text>
              <Text variant="caption" color={colors.textSecondary}>
                Seules des passagères pourront réserver ce trajet.
              </Text>
            </View>
          </Pressable>
        )}

        <LegalBanner compact country={user?.country ?? 'TN'} />

        {blockedByKyc && (
          <Pressable style={styles.kycNotice} onPress={() => router.push('/profile/verify')}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" color={colors.primary}>
                Vérification d'identité requise
              </Text>
              <Text variant="caption" color={colors.textSecondary}>
                Envoie ta CIN, ton permis, ta carte grise et une photo du véhicule pour pouvoir
                publier. Appuie ici pour commencer.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        )}

        <Button
          label={blockedByKyc ? 'Se faire vérifier pour publier' : 'Publier le trajet'}
          onPress={blockedByKyc ? () => router.push('/profile/verify') : onPublish}
          disabled={(!valid && !blockedByKyc) || submitting}
          loading={submitting}
          style={{ marginTop: spacing.sm }}
        />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  womenRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: 'rgba(27,61,110,0.05)', borderRadius: 12 },
  kycNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: 'rgba(255,199,44,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
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
  divider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.xl },
  toggle: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 4, gap: 4 },
  toggleItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.sm },
  toggleActive: { backgroundColor: colors.accent },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: { backgroundColor: colors.accent },
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
  priceInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  priceInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.semibold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
});
