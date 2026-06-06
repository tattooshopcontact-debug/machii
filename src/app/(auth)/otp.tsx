import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import { describeError } from '@/lib/errors';
import { useAuthStore } from '@/stores/authStore';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

export default function OtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pendingPhone = useAuthStore((s) => s.pendingPhone);
  const signInAnonymous = useAuthStore((s) => s.signInAnonymous);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const codeOk = code.replace(/\D/g, '').length >= 4;
  const nameOk = name.trim().length >= 2;
  const valid = codeOk && nameOk;

  async function onVerify() {
    if (!valid || !pendingPhone) return;
    setLoading(true);
    try {
      // V0 : le code OTP est mocké côté client (n'importe quel 4 chiffres).
      // Auth Supabase anonyme → JWT + ligne profiles créée par trigger.
      await signInAnonymous(pendingPhone, name);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      Alert.alert('Connexion impossible', describeError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
          Mode démo : n'importe quel code à 4 chiffres marche.
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
