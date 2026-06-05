import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Logo, Text } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

export default function PhoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setPendingPhone = useAuthStore((s) => s.setPendingPhone);
  const [local, setLocal] = useState('');

  const digits = local.replace(/\D/g, '');
  const valid = digits.length === 8; // numéro tunisien

  function onSubmit() {
    if (!valid) return;
    const phone = `+216${digits}`;
    setPendingPhone(phone);
    // Vrai flux : await supabase.auth.signInWithOtp({ phone })
    router.push('/(auth)/otp');
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.hero, { paddingTop: insets.top + spacing.xxl }]}>
        <Logo size={40} inverted />
        <Text variant="body" color="rgba(255,255,255,0.85)" style={styles.tagline}>
          L'app de covoiturage la plus sûre de Tunisie
        </Text>
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Text variant="title">Ton numéro</Text>
        <Text variant="body" color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
          On t'envoie un code par SMS pour te connecter.
        </Text>

        <View style={styles.inputRow}>
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>🇹🇳 +216</Text>
          </View>
          <TextInput
            value={local}
            onChangeText={setLocal}
            keyboardType="number-pad"
            placeholder="22 543 891"
            placeholderTextColor={colors.textMuted}
            maxLength={11}
            style={styles.input}
            autoFocus
          />
        </View>

        <Button label="Recevoir le code" onPress={onSubmit} disabled={!valid} style={{ marginTop: spacing.lg }} />

        <Text variant="caption" center style={{ marginTop: spacing.lg }}>
          En continuant, tu acceptes les CGU de Machii. Covoiturage gratuit — loi n° 2004-33.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  tagline: { textAlign: 'center' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
  },
  inputRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
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
