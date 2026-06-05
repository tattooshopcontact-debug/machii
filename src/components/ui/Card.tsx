import { Pressable, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '@/theme';

export type CardProps = ViewProps & {
  /** Niveau d'élévation visuel. */
  elevation?: 'flat' | 'card' | 'floating';
  /** Bordure jaune d'accent (cards "match intelligent", thème actif…). */
  highlighted?: boolean;
  padded?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

/** Surface surélevée Machii (crème/blanc, ombres en cascade). */
export function Card({
  elevation = 'card',
  highlighted = false,
  padded = true,
  onPress,
  style,
  children,
  ...rest
}: CardProps) {
  const content = (
    <View
      style={[
        styles.base,
        padded && styles.padded,
        elevation === 'card' && shadows.card,
        elevation === 'floating' && shadows.floating,
        highlighted && styles.highlighted,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => (pressed ? styles.pressed : null)}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  padded: { padding: spacing.lg },
  highlighted: { borderColor: colors.accent, borderWidth: 2 },
  pressed: { opacity: 0.96, transform: [{ scale: 0.995 }] },
});
