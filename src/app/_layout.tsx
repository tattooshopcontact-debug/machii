import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableFreeze } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { QueryClientProvider } from '@tanstack/react-query';

import { registerForPushNotifications } from '@/lib/notifications';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { colors, interFontMap } from '@/theme';

// ⚠️ Désactive le « gel » des écrans hors-champ (react-native-screens). Le
// détach/reattach d'un écran gelé pendant une transition de navigation
// déclenche, sous la New Architecture (Fabric), le crash
// `ReactClippingViewManager.addView` / IllegalStateException « child already
// has a parent » (via ReanimatedNativeHierarchyManager). Crash observé sur le
// build 13 (2 testeurs). Garde-fou documenté (reanimated GH #3234).
enableFreeze(false);

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(interFontMap);
  const loadSession = useAuthStore((s) => s.loadSession);
  const hydrated = useAuthStore((s) => s.hydrated);
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Enregistre le device pour les push dès qu'un user est loggé.
  // No-op silencieux si permission refusée ou simulateur.
  useEffect(() => {
    if (!userId) return;
    registerForPushNotifications(userId).catch(() => {});
  }, [userId]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && hydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, hydrated]);

  if ((!fontsLoaded && !fontError) || !hydrated) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="trip/[id]" />
            <Stack.Screen name="trip/create" options={{ presentation: 'modal' }} />
            <Stack.Screen name="trip/edit/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="profile/edit" options={{ presentation: 'modal' }} />
            <Stack.Screen name="messages/[id]" />
            <Stack.Screen name="profile/verify" />
            <Stack.Screen name="trip/rate/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="profile/sos" />
            <Stack.Screen name="profile/delete" />
            <Stack.Screen name="request/create" options={{ presentation: 'modal' }} />
            <Stack.Screen name="user/[id]" options={{ presentation: 'modal' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
