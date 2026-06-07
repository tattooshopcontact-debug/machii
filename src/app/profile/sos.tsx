import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Screen, Text } from '@/components/ui';
import { describeError } from '@/lib/errors';
import {
  triggerSos,
  useAddEmergencyContact,
  useDeleteEmergencyContact,
  useMyEmergencyContacts,
} from '@/lib/sos';
import { useAuthStore } from '@/stores/authStore';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const MAX_CONTACTS = 3;

export default function SosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const { data: contacts } = useMyEmergencyContacts(user?.id);
  const addContact = useAddEmergencyContact();
  const deleteContact = useDeleteEmergencyContact();

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [triggering, setTriggering] = useState(false);

  if (!user) return null;

  async function onAdd() {
    if (!user) return;
    const name = newName.trim();
    const phone = newPhone.trim();
    if (name.length < 2 || phone.length < 6) {
      Alert.alert('Champ manquant', 'Donne un nom et un numéro de téléphone valides.');
      return;
    }
    try {
      await addContact.mutateAsync({ userId: user.id, name, phone });
      setNewName('');
      setNewPhone('');
    } catch (e) {
      Alert.alert('Ajout impossible', describeError(e));
    }
  }

  function onDelete(contactId: string) {
    if (!user) return;
    Alert.alert('Supprimer ce contact ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () =>
          deleteContact.mutate({ contactId, userId: user.id }, {
            onError: (e) => Alert.alert('Erreur', describeError(e)),
          }),
      },
    ]);
  }

  async function onTriggerSos() {
    if (!user) return;
    if (!contacts || contacts.length === 0) {
      Alert.alert(
        'Aucun contact d\'urgence',
        'Ajoute au moins un contact pour activer le SOS.',
      );
      return;
    }
    Alert.alert(
      'Déclencher le SOS ?',
      'Tes contacts vont recevoir un SMS avec ta position GPS. Le 197 reste joignable si besoin.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer SOS',
          style: 'destructive',
          onPress: async () => {
            setTriggering(true);
            try {
              const r = await triggerSos({
                userId: user.id,
                tripId: null,
                contacts: contacts ?? [],
              });
              if (r.sent) {
                Alert.alert(
                  'SOS envoyé',
                  'Tes contacts ont reçu un SMS avec ta position. Si la situation est grave, appelle aussi le 197.',
                );
              } else if (!r.smsAvailable) {
                Alert.alert(
                  'SMS indisponible',
                  'On ouvre directement le 197. Garde ton téléphone à portée de main.',
                );
              } else {
                Alert.alert(
                  'SMS non envoyé',
                  'Ton SMS n\'a pas été confirmé. Vérifie ta messagerie et réessaie.',
                );
              }
            } catch (e) {
              Alert.alert('SOS impossible', describeError(e));
            } finally {
              setTriggering(false);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.textOnPrimary} />
        </Pressable>
        <Text variant="subtitle" color={colors.textOnPrimary}>SOS / Urgence</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Screen contentStyle={{ gap: spacing.md, paddingTop: spacing.lg }}>
          <Card style={{ alignItems: 'center', gap: spacing.sm }}>
            <Text variant="heading" center>Bouton SOS</Text>
            <Text variant="body" color={colors.textSecondary} center>
              En cas de danger pendant un trajet, ce bouton envoie un SMS avec ta position à tous tes contacts d'urgence ci-dessous.
            </Text>
            <Pressable
              onPress={onTriggerSos}
              disabled={triggering}
              style={[styles.sosButton, triggering && styles.sosButtonDisabled]}
            >
              <Ionicons name="alert" size={40} color={colors.textOnPrimary} />
              <Text variant="subtitle" color={colors.textOnPrimary} style={{ marginTop: 6 }}>
                SOS
              </Text>
            </Pressable>
            <Text variant="caption" color={colors.textSecondary} center>
              En cas d'extrême urgence, compose toi-même le <Text variant="caption" color={colors.danger}>197</Text>.
            </Text>
          </Card>

          <Card style={{ gap: spacing.md }}>
            <Text variant="heading">Mes contacts d'urgence ({contacts?.length ?? 0}/{MAX_CONTACTS})</Text>

            {(contacts ?? []).length === 0 && (
              <Text variant="body" color={colors.textSecondary}>
                Aucun contact pour le moment. Ajoutes-en au moins un.
              </Text>
            )}

            {(contacts ?? []).map((c) => (
              <View key={c.id} style={styles.contactRow}>
                <View style={styles.contactIcon}>
                  <Ionicons name="person-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium">{c.name}</Text>
                  <Text variant="caption" color={colors.textSecondary}>{c.phone}</Text>
                </View>
                <Pressable onPress={() => onDelete(c.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            ))}

            {(contacts?.length ?? 0) < MAX_CONTACTS && (
              <View style={{ gap: spacing.sm }}>
                <Text variant="label">Ajouter un contact</Text>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Nom"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
                <TextInput
                  value={newPhone}
                  onChangeText={setNewPhone}
                  placeholder="Téléphone (ex : +21652123456)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  style={styles.input}
                />
                <Button
                  label="Ajouter"
                  variant="secondary"
                  onPress={onAdd}
                  disabled={addContact.isPending}
                  loading={addContact.isPending}
                  left={<Ionicons name="add" size={18} color={colors.textOnPrimary} />}
                />
              </View>
            )}
          </Card>
        </Screen>
      </KeyboardAvoidingView>
    </View>
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
  sosButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  sosButtonDisabled: { opacity: 0.5 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
});
