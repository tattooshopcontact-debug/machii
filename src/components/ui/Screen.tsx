import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, TAB_BAR_HEIGHT } from '@/theme';

type ScreenProps = {
  children: React.ReactNode;
  /** Active le scroll (sinon View simple). */
  scroll?: boolean;
  /** Padding horizontal du contenu. */
  padded?: boolean;
  /** Laisse de la place pour la bottom-nav. */
  tabBarSpacing?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

/** Conteneur d'écran Machii (fond crème). */
export function Screen({
  children,
  scroll = true,
  padded = true,
  tabBarSpacing = false,
  style,
  contentStyle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const baseBottom = tabBarSpacing ? TAB_BAR_HEIGHT + spacing.lg : spacing.xl;
  const padding: ViewStyle = {
    paddingHorizontal: padded ? spacing.lg : 0,
    paddingBottom: baseBottom + (tabBarSpacing ? 0 : insets.bottom),
  };

  if (scroll) {
    return (
      <ScrollView
        style={[styles.root, style]}
        contentContainerStyle={[padding, contentStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.root, padding, contentStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
