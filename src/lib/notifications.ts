/**
 * Helpers Expo Notifications pour Machii.
 *
 * - registerForPushNotifications() : demande la permission, récupère le token
 *   Expo Push (push_tokens.expo_token), l'enregistre en DB (upsert).
 *
 * En V0 : push gratuit via exp.host (le trigger Postgres send_expo_push fait
 * le POST direct vers Expo). Pas besoin d'API key.
 *
 * ⚠️ Expo Go (SDK 53+) a RETIRÉ le push Android. Importer `expo-notifications`
 * au niveau module y déclenche un crash qui fait tomber toute l'app. On charge
 * donc le module PARESSEUSEMENT et on court-circuite entièrement dans Expo Go.
 * Le push reste pleinement fonctionnel dans un vrai build (APK/dev-client).
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

// true dans Expo Go (storeClient) → le push natif n'est pas dispo.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let handlerConfigured = false;
function ensureHandler(Notifications: typeof import('expo-notifications')): void {
  if (handlerConfigured) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  handlerConfigured = true;
}

async function ensurePermission(Notifications: typeof import('expo-notifications')): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const ask = await Notifications.requestPermissionsAsync();
  return ask.granted;
}

async function ensureAndroidChannel(Notifications: typeof import('expo-notifications')): Promise<void> {
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
 * No-op dans Expo Go, sur simulateur, ou si la permission est refusée.
 * @returns expo_token ou null
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (isExpoGo || !Device.isDevice) return null;

  // Import paresseux : n'exécute le code natif d'expo-notifications QUE hors Expo Go.
  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  ensureHandler(Notifications);

  const ok = await ensurePermission(Notifications);
  if (!ok) return null;
  await ensureAndroidChannel(Notifications);

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
