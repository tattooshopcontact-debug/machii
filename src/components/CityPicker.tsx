import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { CITIES, type CountryCode } from '@/constants/cities';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

type CityPickerProps = {
  label: string;
  value: string | null;
  /** Couleur du point de la timeline. */
  dotColor: string;
  onSelect: (city: string) => void;
  /** Cap Maroc M2 : ne lister que les villes du pays de l'utilisateur. */
  country?: CountryCode;
};

/** Champ de sélection d'une ville (ouvre une liste modale). */
export function CityPicker({ label, value, dotColor, onSelect, country = 'TN' }: CityPickerProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <View style={{ flex: 1 }}>
          <Text variant="caption">{label}</Text>
          <Text variant="bodyMedium" color={value ? colors.textPrimary : colors.textMuted}>
            {value ?? 'Choisir une ville'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.sheetHeader}>
            <Text variant="heading">{label}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>
          <FlatList
            data={CITIES.filter((c) => c.country === country)}
            keyExtractor={(c) => c.name}
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => {
                  onSelect(item.name);
                  setOpen(false);
                }}
              >
                <Ionicons name="location-outline" size={18} color={colors.primary} />
                <Text variant="body">{item.name}</Text>
                {value === item.name && <Ionicons name="checkmark" size={18} color={colors.success} style={{ marginLeft: 'auto' }} />}
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  dot: { width: 11, height: 11, borderRadius: 6 },
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    maxHeight: '70%',
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  sep: { height: 1, backgroundColor: colors.border },
});
