import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useQueryClient } from '@tanstack/react-query';

import { Button, Text } from '@/components/ui';
import { describeError } from '@/lib/errors';
import { otpLogin } from '@/lib/otp';
import { useAuthStore } from '@/stores/authStore';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const OTP_ERRORS: Record<string, string> = {
  no_active_code: 'Aucun code en cours. Demande un nouveau code.',
  bad_code: 'Le code ne correspond pas. Réessaie.',
  too_many_attempts: 'Trop de tentatives. Demande un nouveau code.',
  invalid_phone: 'Numéro invalide.',
};

export default function OtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pendingPhone = useAuthStore((s) => s.pendingPhone);
  const signInWithVerifiedOtp = useAuthStore((s) => s.signInWithVerifiedOtp);
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const codeDigits = code.replace(/\D/g, '');
  const codeOk = codeDigits.length === 6;
  const nameOk = name.trim().length >= 2;
  const valid = codeOk && nameOk;

  async function onVerify() {
    if (!valid || !pendingPhone) return;
    setLoading(true);
    try {
      // Toute la validation se fait côté serveur (RPC otp_login) : il vérifie
      // le code, applique les limites anti-brute-force, et ne renvoie les
      // identifiants de session qu'en cas de succès. Aucun bypass côté client.
      const result = await otpLogin(pendingPhone, codeDigits, name);
      if (!result.ok) {
        Alert.alert('Code invalide', OTP_ERRORS[result.reason] ?? 'Vérification impossible. Réessaie.');
        return;
      }

      await signInWithVerifiedOtp({
        phone: pendingPhone,
        fullName: name,
        email: result.email,
        password: result.password,
      });
      // Le user vient de changer : on vide le cache pour repartir propre.
      queryClient.clear();
      router.replace('/(tabs)');
    } catch (e: unknown) {
      Alert.alert('Connexion impossible', describeError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Text variant="title" color={colors.textOnPrimary}>
          Vérifie ton numéro
        </Text>
        <Text variant="body" color="rgba(255,255,255,0.85)" style={{ marginTop: spacing.xs }}>
          Code à 6 chiffres envoyé sur WhatsApp au {pendingPhone ?? 'ton numéro'}.
        </Text>

        <TextInput
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          placeholder="• • • • • •"
          placeholderTextColor="rgba(255,255,255,0.4)"
          maxLength={6}
          style={styles.codeInput}
          autoFocus
        />

        <Text variant="label" color={colors.textOnPrimary} style={{ marginBottom: spacing.xs }}>
          Ton prénom
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="ex : Ahmed"
          placeholderTextColor="rgba(255,255,255,0.4)"
          maxLength={40}
          autoCapitalize="words"
          style={styles.nameInput}
        />

        <Button label="Se connecter" onPress={onVerify} disabled={!valid} loading={loading} />

        <Pressable onPress={() => router.back()} style={styles.resend}>
          <Text variant="label" color={colors.accent}>
            Modifier le numéro
          </Text>
        </Pressable>

        <Text variant="caption" color="rgba(255,255,255,0.5)" center style={{ marginTop: spacing.md }}>
          Le code arrive sur WhatsApp 📱 — il expire dans 10 minutes.
        </Text>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1 },
  content: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'center' },
  codeInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: spacing.lg,
    textAlign: 'center',
    letterSpacing: 8,
    fontFamily: fonts.bold,
    fontSize: fontSize.xxl,
    color: colors.textOnPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  nameInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSize.lg,
    color: colors.textOnPrimary,
    marginBottom: spacing.xl,
  },
  resend: { alignSelf: 'center', marginTop: spacing.lg, padding: spacing.sm },
});
