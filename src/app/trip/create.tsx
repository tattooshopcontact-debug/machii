import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useQueryClient } from '@tanstack/react-query';

import { CityPicker } from '@/components/CityPicker';
import { Button, Card, LegalBanner, Screen, Text } from '@/components/ui';
import { describeError } from '@/lib/errors';
import { useFeature } from '@/lib/featureFlags';
import { cityToPoint, findCity, parseDepartureTime } from '@/lib/geo';
import { fetchTripCostPreview, type TripCostPreview } from '@/lib/pricing';
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
  // Le conducteur choisit : trajet Offert (gratuit) ou Participation aux frais.
  // En Participation, l'app PROPOSE le prix raisonnable (calcul serveur) et le PLAFONNE
  // au coût réel + marge (loi 2004-33 : partage de frais, jamais de bénéfice).
  const [priceMode, setPriceMode] = useState<'free' | 'participation'>('participation');
  const [price, setPrice] = useState('');
  const [preview, setPreview] = useState<TripCostPreview | null>(null);
  const [womenOnly, setWomenOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Prix conseillé + plafond : calculé dès que départ/arrivée/places sont connus.
  useEffect(() => {
    if (priceMode !== 'participation' || !origin || !destination || !user) {
      setPreview(null);
      return;
    }
    const o = findCity(origin);
    const d = findCity(destination);
    if (!o || !d) {
      setPreview(null);
      return;
    }
    let alive = true;
    fetchTripCostPreview({
      originLng: o.lng,
      originLat: o.lat,
      destLng: d.lng,
      destLat: d.lat,
      driverId: user.id,
      seats,
      country: o.country ?? user.country,
    })
      .then((p) => {
        if (!alive) return;
        setPreview(p);
        if (p) setPrice((cur) => (cur === '' ? String(p.totalSuggested) : cur));
      })
      .catch(() => alive && setPreview(null));
    return () => {
      alive = false;
    };
  }, [priceMode, origin, destination, seats, user]);

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
      // Offert = total 0 ; Participation = prix TOTAL du voyage, PLAFONNÉ (divisé ensuite entre occupants).
      let priceTotal: number;
      if (priceMode === 'free') {
        priceTotal = 0;
      } else {
        const val = Math.max(0, Math.round(Number(price) || 0));
        priceTotal = preview ? Math.min(val, Math.round(preview.totalMax)) : val;
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
        // Prix TOTAL du voyage (divisé dynamiquement) ; per_seat null en Participation (calculé à la volée).
        price_total: priceTotal,
        price_per_seat: priceMode === 'free' ? 0 : null,
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
                style={[styles.modeBtn, priceMode === 'participation' && styles.modeBtnActive]}
                onPress={() => setPriceMode('participation')}
              >
                <Ionicons name="cash-outline" size={18} color={priceMode === 'participation' ? colors.primary : colors.textMuted} />
                <Text variant="bodyMedium" color={priceMode === 'participation' ? colors.primary : colors.textSecondary}>Participation</Text>
              </Pressable>
            </View>

            {priceMode === 'free' ? (
              <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
                Tu offres le trajet à tes passagers.
              </Text>
            ) : preview ? (
              <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                <View style={styles.priceInputRow}>
                  <TextInput
                    value={price}
                    onChangeText={(v) => {
                      const digits = v.replace(/[^0-9]/g, '');
                      if (digits === '') { setPrice(''); return; }
                      const n = Math.min(Math.max(0, Number(digits)), Math.round(preview.totalMax));
                      setPrice(String(n));
                    }}
                    keyboardType="number-pad"
                    style={styles.priceInput}
                    placeholder={String(preview.totalSuggested)}
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text variant="subtitle" color={colors.textSecondary}>DT (tout le voyage)</Text>
                </View>
                <View style={styles.priceHintRow}>
                  <Ionicons name="bulb-outline" size={14} color={colors.primary} />
                  <Text variant="caption" color={colors.textSecondary}>
                    Prix conseillé : <Text variant="caption" color={colors.primary}>{preview.totalSuggested} DT</Text> · Maximum : {preview.totalMax} DT. Ce prix se <Text variant="caption" color={colors.textPrimary}>divise entre toi et les passagers</Text> : plus il y a de monde, moins cher pour chacun.
                    {price && Number(price) > 0 ? ` Avec ${seats} passager${seats > 1 ? 's' : ''} + toi, ce serait ${(Number(price) / (seats + 1)).toFixed(1)} DT chacun.` : ''}
                  </Text>
                </View>
              </View>
            ) : (
              <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
                Choisis le départ et l'arrivée pour voir le prix conseillé.
              </Text>
            )}
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
  priceInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  priceInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.semibold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  priceHintRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
});
