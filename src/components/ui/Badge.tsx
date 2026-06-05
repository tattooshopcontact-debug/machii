import { StyleSheet, View } from 'react-native';

import { colors, fonts, fontSize, radius, spacing } from '@/theme';

import { Text } from './Text';

type Tone = 'free' | 'verified' | 'new' | 'negotiable' | 'recurring' | 'punctual' | 'danger' | 'neutral';

const tones: Record<Tone, { bg: string; fg: string }> = {
  free: { bg: colors.accent, fg: colors.primary },
  verified: { bg: 'rgba(74, 222, 128, 0.18)', fg: '#15803D' },
  new: { bg: 'rgba(241, 138, 77, 0.18)', fg: '#C2510A' },
  negotiable: { bg: '#EFEAE1', fg: colors.textSecondary },
  recurring: { bg: 'rgba(27, 61, 110, 0.10)', fg: colors.primary },
  punctual: { bg: 'rgba(27, 61, 110, 0.10)', fg: colors.primary },
  danger: { bg: 'rgba(201, 42, 42, 0.12)', fg: colors.danger },
  neutral: { bg: '#EFEAE1', fg: colors.textSecondary },
};

export type BadgeProps = {
  label: string;
  tone?: Tone;
  icon?: string;
};

/** Petit badge d'état (Free, Vérifié, Nouveau, Récurrent…). */
export function Badge({ label, tone = 'neutral', icon }: BadgeProps) {
  const { bg, fg } = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>
        {icon ? `${icon} ` : ''}
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  text: { fontFamily: fonts.semibold, fontSize: fontSize.xs },
});
