/**
 * Parrainage (#15 / #17). Affiche mon code à partager + mon nombre de filleuls,
 * et permet de saisir le code de mon parrain (une seule fois).
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Screen, Text } from '@/components/ui';
import { describeError } from '@/lib/errors';
import { useApplyReferral, useMyReferral } from '@/lib/referral';
import { useAuthStore } from '@/stores/authStore';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

export default function ReferralScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useMyReferral(user?.id);
  const apply = useApplyReferral();
  const [code, setCode] = useState('');

  const alreadyReferred = !!data?.referredBy;

  async function onShare() {
    if (!data?.code) return;
    await Share.share({
      message: `Rejoins-moi sur Machii, la communauté qui partage la route 🚗\nUtilise mon code parrain : ${data.code}`,
    });
  }

  function onApply() {
    const c = code.trim();
    if (c.length < 4) {
      Alert.alert('Code parrain', 'Saisis le code que ton parrain t\'a donné.');
      return;
    }
    apply.mutate(
      { code: c },
      {
        onSuccess: () => {
          setCode('');
          Alert.alert('Parrainage validé 🎉', 'Ton parrain gagne +20 XP, et tu reçois +10 XP de bienvenue !');
        },
        onError: (e) => Alert.alert('Code refusé', describeError(e)),
      },
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Ionicons name="chevron-back" size={26} color={colors.textOnPrimary} onPress={() => router.back()} />
        <Text variant="subtitle" color={colors.textOnPrimary}>Parrainage</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Screen contentStyle={{ gap: spacing.md, paddingTop: spacing.lg }}>
          <Text variant="caption" color={colors.textSecondary}>
            Partage ton code : pour chaque ami qui rejoint Machii avec, tu gagnes +20 XP
            (et lui +10 XP de bienvenue).
          </Text>

          {/* Mon code */}
          <Card style={styles.codeCard}>
            <Text variant="caption" color={colors.textSecondary}>TON CODE PARRAIN</Text>
            <Text style={styles.codeText}>{isLoading ? '…' : data?.code ?? '—'}</Text>
            <Button
              label="Partager mon code"
              onPress={onShare}
              left={<Ionicons name="share-social-outline" size={18} color={colors.primary} />}
              style={{ alignSelf: 'stretch', marginTop: spacing.sm }}
            />
          </Card>

          {/* Mes filleuls */}
          <Card style={styles.statRow}>
            <Ionicons name="people-outline" size={22} color={colors.primary} />
            <Text variant="bodyMedium" style={{ flex: 1 }}>Mes filleuls</Text>
            <Text variant="title" color={colors.primary}>{data?.count ?? 0}</Text>
          </Card>

          {/* Saisir un code parrain */}
          <Card style={{ gap: spacing.sm }}>
            <Text variant="label">J'ai un code parrain</Text>
            {alreadyReferred ? (
              <View style={styles.doneRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text variant="bodyMedium" color={colors.success}>Tu as déjà été parrainé. Merci !</Text>
              </View>
            ) : (
              <>
                <TextInput
                  value={code}
                  onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  placeholder="ex : BRHHFF"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  maxLength={6}
                  style={styles.input}
                />
                <Button label="Valider le code" onPress={onApply} loading={apply.isPending} disabled={apply.isPending} />
              </>
            )}
          </Card>
        </Screen>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  codeCard: { alignItems: 'center', gap: spacing.xs, backgroundColor: colors.accent },
  codeText: { fontSize: 40, fontWeight: '800', letterSpacing: 8, color: colors.primary },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: fontSize.xl,
    letterSpacing: 6,
    color: colors.textPrimary,
  },
});
