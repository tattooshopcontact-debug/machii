import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import { DEMO_PROFILE } from '@/constants/mock';
import { useAuthStore } from '@/stores/authStore';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

export default function OtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pendingPhone, setUser } = useAuthStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const valid = code.replace(/\D/g, '').length >= 4;

  function onVerify() {
    if (!valid) return;
    setLoading(true);
    // Vrai flux :
    //   const { data, error } = await supabase.auth.verifyOtp({ phone: pendingPhone, token: code, type: 'sms' })
    //   puis charger le profil depuis la table `profiles`.
    // V1 démo : on connecte avec le profil de démonstration.
    setTimeout(() => {
      setUser({ ...DEMO_PROFILE, phone: pendingPhone ?? DEMO_PROFILE.phone });
      router.replace('/(tabs)');
    }, 500);
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.content, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl }]}>
        <Text variant="title" color={colors.textOnPrimary}>
          Vérifie ton numéro
        </Text>
        <Text variant="body" color="rgba(255,255,255,0.85)" style={{ marginTop: spacing.xs }}>
          Code envoyé au {pendingPhone ?? 'ton numéro'}.
        </Text>

        <TextInput
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          placeholder="• • • •"
          placeholderTextColor="rgba(255,255,255,0.4)"
          maxLength={6}
          style={styles.codeInput}
          autoFocus
        />

        <Button label="Se connecter" onPress={onVerify} disabled={!valid} loading={loading} />

        <Pressable onPress={() => router.back()} style={styles.resend}>
          <Text variant="label" color={colors.accent}>
            Modifier le numéro
          </Text>
        </Pressable>

        <Text variant="caption" color="rgba(255,255,255,0.5)" center style={{ marginTop: spacing.md }}>
          Mode démo : saisis n'importe quel code à 4 chiffres.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  content: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'center' },
  codeInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: spacing.lg,
    textAlign: 'center',
    letterSpacing: 12,
    fontFamily: fonts.bold,
    fontSize: fontSize.xxl,
    color: colors.textOnPrimary,
    marginVertical: spacing.xl,
  },
  resend: { alignSelf: 'center', marginTop: spacing.lg, padding: spacing.sm },
});
