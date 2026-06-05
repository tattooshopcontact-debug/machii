import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';

import { colors, fonts, fontSize } from '@/theme';

type Variant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subtitle'
  | 'body'
  | 'bodyMedium'
  | 'label'
  | 'caption';

export type TextProps = RNTextProps & {
  variant?: Variant;
  color?: string;
  center?: boolean;
};

const variantStyles = StyleSheet.create({
  display: { fontFamily: fonts.bold, fontSize: fontSize.display, color: colors.textPrimary },
  title: { fontFamily: fonts.bold, fontSize: fontSize.xxl, color: colors.textPrimary },
  heading: { fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.textPrimary },
  body: { fontFamily: fonts.regular, fontSize: fontSize.base, color: colors.textPrimary },
  bodyMedium: { fontFamily: fonts.medium, fontSize: fontSize.base, color: colors.textPrimary },
  label: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  caption: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textSecondary },
});

/** Texte de base Machii : impose Inter et l'échelle typographique. */
export function Text({ variant = 'body', color, center, style, ...rest }: TextProps) {
  return (
    <RNText
      style={[variantStyles[variant], color ? { color } : null, center ? { textAlign: 'center' } : null, style]}
      {...rest}
    />
  );
}
