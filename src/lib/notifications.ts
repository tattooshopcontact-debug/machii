/**
 * Helpers Expo Notifications pour Machii.
 *
 * - registerForPushNotifications() : demande la permission, récupère le token
 *   Expo Push (push_tokens.expo_token), l'enregistre en DB (upsert).
 * - configureNotificationHandler() : foreground / lock screen / sound.
 *
 * En V0 : push gratuit via exp.host (le trigger Postgres send_expo_push fait
 * le POST direct vers Expo). Pas besoin d'API key.
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const ask = await Notifications.requestPermissionsAsync();
  return ask.granted;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Notifications Machii',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
}

/**
 * Enregistre le device pour les push. À appeler après que le user est loggé.
 * No-op si on est dans Expo Go simulateur ou si la permission est refusée.
 * @returns expo_token ou null
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null;
  const ok = await ensurePermission();
  if (!ok) return null;
  await ensureAndroidChannel();

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const tokenData = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();
  const expoToken = tokenData.data;
  if (!expoToken) return null;

  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
  const { error } = await supabase
    .from('push_tokens')
    .upsert({ user_id: userId, expo_token: expoToken, platform }, { onConflict: 'user_id' });
  if (error) {
    console.warn('push_tokens upsert failed', error.message);
    return expoToken; // le token est valide même si le save a foiré.
  }
  return expoToken;
}
