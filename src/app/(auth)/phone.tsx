import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Logo, Text } from '@/components/ui';
import { COUNTRIES, type Country } from '@/constants/cities';
import { describeError } from '@/lib/errors';
import { sendOtp } from '@/lib/otp';
import { useAuthStore } from '@/stores/authStore';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

export default function PhoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setPendingPhone = useAuthStore((s) => s.setPendingPhone);
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [local, setLocal] = useState('');
  const [sending, setSending] = useState(false);

  const digits = local.replace(/\D/g, '');
  const valid = digits.length === country.phoneLength;

  async function onSubmit() {
    if (!valid) return;
    const phone = `${country.dialCode}${digits}`;
    setSending(true);
    try {
      // Envoie le code via WhatsApp Cloud API (si configuré).
      // Sinon, le code est juste enregistré en DB (visible dans phone_otp).
      const r = await sendOtp(phone);
      setPendingPhone(phone);
      router.push('/(auth)/otp');
      if (!r.sent) {
        // Pas de WhatsApp configure : on previent doucement le user.
        setTimeout(() =>
          Alert.alert(
            'Code généré (mode démo)',
            'WhatsApp n\'est pas encore branché en V0 — le code est dans la base. Pour tester maintenant, saisis n\'importe quel code à 4 chiffres dans l\'écran suivant.',
          ),
          200,
        );
      }
    } catch (e) {
      Alert.alert('Envoi impossible', describeError(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
      <View style={[styles.hero, { paddingTop: insets.top + spacing.xxl }]}>
        <Logo size={40} inverted />
        <Text variant="body" color="rgba(255,255,255,0.85)" style={styles.tagline}>
          {country.code === 'MA'
            ? 'La communauté qui partage la route, en toute confiance'
            : 'La communauté qui partage la route, en toute confiance'}
        </Text>
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Text variant="title">Ton numéro</Text>
        <Text variant="body" color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
          On t'envoie un code par WhatsApp pour te connecter.
        </Text>

        {/* Sélecteur de pays (Cap Maroc M1) */}
        <View style={styles.countryRow}>
          {COUNTRIES.map((c) => {
            const active = country.code === c.code;
            return (
              <Pressable
                key={c.code}
                onPress={() => {
                  setCountry(c);
                  setLocal('');
                }}
                style={[styles.countryChip, active && styles.countryChipActive]}
              >
                <Text style={{ fontSize: fontSize.md }}>{c.flag}</Text>
                <Text
                  variant="label"
                  color={active ? colors.textOnPrimary : colors.textPrimary}
                >
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.inputRow}>
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>
              {country.flag} {country.dialCode}
            </Text>
          </View>
          <TextInput
            value={local}
            onChangeText={setLocal}
            keyboardType="number-pad"
            placeholder={country.phonePlaceholder}
            placeholderTextColor={colors.textMuted}
            maxLength={country.phoneLength + 3}
            style={styles.input}
            autoFocus
          />
        </View>

        <Button
          label="Recevoir le code"
          onPress={onSubmit}
          disabled={!valid || sending}
          loading={sending}
          style={{ marginTop: spacing.lg }}
        />

        <Text variant="caption" center style={{ marginTop: spacing.lg }}>
          {country.code === 'MA'
            ? 'En continuant, tu acceptes les CGU de Machii. Covoiturage = partage de frais entre particuliers, sans but lucratif.'
            : 'En continuant, tu acceptes les CGU de Machii. Covoiturage gratuit — loi n° 2004-33.'}
        </Text>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1, justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, minHeight: 180 },
  tagline: { textAlign: 'center' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
  },
  countryRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  countryChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  countryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  inputRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  prefix: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  prefixText: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.textPrimary },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.semibold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
});
