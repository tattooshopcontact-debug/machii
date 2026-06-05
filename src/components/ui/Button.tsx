import { useState } from 'react';
import { ActivityIndicator, Pressable, PressableProps, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, fonts, fontSize, palette, radius, shadows, spacing } from '@/theme';

import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  left?: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Bouton Machii. Le CTA primaire (jaune) est une "plaque 3D" : sous-plaque
 * sombre décalée de 4px, face jaune en relief, qui s'enfonce de 3px au press.
 */
export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = true,
  left,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || loading;
  const is3D = variant === 'primary';

  const face = (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        !is3D && fullWidth && styles.fullWidth,
        is3D && pressed && styles.pressedPlate,
        !is3D && pressed && styles.pressedFlat,
        isDisabled && styles.disabled,
        !is3D && style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? colors.surface : colors.primary} />
      ) : (
        <View style={styles.content}>
          {left}
          <Text
            variant="label"
            color={labelColor[variant]}
            style={{ fontFamily: fonts.heavy, fontSize: size === 'lg' ? fontSize.md : fontSize.base }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );

  if (!is3D) return face;

  // Plaque 3D : sous-plaque sombre derrière la face jaune.
  return (
    <View style={[styles.plateWrap, fullWidth && styles.fullWidth, isDisabled && styles.disabled, style]}>
      <View style={styles.underPlate} />
      {face}
    </View>
  );
}

const labelColor: Record<Variant, string> = {
  primary: palette.onYellow,
  secondary: colors.textOnPrimary,
  outline: colors.primary,
  danger: colors.surface,
  ghost: colors.primary,
};

const styles = StyleSheet.create({
  base: { borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pressedFlat: { transform: [{ translateY: 1 }], opacity: 0.92 },
  disabled: { opacity: 0.45 },

  // Plaque 3D
  plateWrap: { position: 'relative' },
  underPlate: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 4,
    bottom: -4,
    borderRadius: radius.lg,
    backgroundColor: '#B88A00',
  },
  pressedPlate: { transform: [{ translateY: 3 }] },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  md: { paddingVertical: spacing.md + 2, paddingHorizontal: spacing.xl },
  lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.accent, ...shadows.glow },
  secondary: { backgroundColor: colors.primary },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  danger: { backgroundColor: colors.danger },
  ghost: { backgroundColor: 'transparent' },
});
