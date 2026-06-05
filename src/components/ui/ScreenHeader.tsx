import { StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme';

import { Logo } from './Logo';
import { Text } from './Text';

type ScreenHeaderProps = {
  title?: string;
  subtitle?: string;
  /** Affiche le logo Machii à la place du titre. */
  showLogo?: boolean;
  right?: React.ReactNode;
  /** Arrondit le bas du header (style "vague" Machii). */
  rounded?: boolean;
  style?: ViewStyle;
};

/**
 * Header bleu profond Machii. (Le fond animé — particules + lignes GPS — est
 * prévu en Phase polish ; ici fond uni navy, conforme à la baseline.)
 */
export function ScreenHeader({ title, subtitle, showLogo, right, rounded = true, style }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.header,
        rounded && styles.rounded,
        { paddingTop: insets.top + spacing.sm },
        style,
      ]}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          {showLogo ? (
            <Logo size={26} inverted />
          ) : (
            <>
              {!!title && (
                <Text variant="title" color={colors.textOnPrimary}>
                  {title}
                </Text>
              )}
              {!!subtitle && (
                <Text variant="body" color="rgba(255,255,255,0.8)" style={{ marginTop: 2 }}>
                  {subtitle}
                </Text>
              )}
            </>
          )}
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  rounded: {
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flex: 1 },
});
