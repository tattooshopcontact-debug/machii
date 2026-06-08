import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { resolveEffectiveMode, useAppModeStore } from '@/stores/appModeStore';
import { useAuthStore } from '@/stores/authStore';
import { colors, fonts, fontSize } from '@/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(focused: IoniconName, unfocused: IoniconName) {
  return ({ color, focused: isFocused, size }: { color: ColorValue; focused: boolean; size: number }) => (
    <Ionicons name={isFocused ? focused : unfocused} size={size} color={color} />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
  const role = useAuthStore((s) => s.user?.role);
  const mode = useAppModeStore((s) => s.mode);
  const effectiveMode = resolveEffectiveMode(role, mode);
  const isDriver = effectiveMode === 'driver';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60 + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: fontSize.xs },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Accueil', tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Recherche',
          tabBarIcon: tabIcon('search', 'search-outline'),
          // Un conducteur ne cherche pas, il publie depuis l'accueil.
          href: isDriver ? null : '/(tabs)/search',
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: isDriver ? 'Trajets' : 'Courses',
          tabBarIcon: tabIcon(isDriver ? 'car' : 'ticket', isDriver ? 'car-outline' : 'ticket-outline'),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: 'Chat', tabBarIcon: tabIcon('chatbubble', 'chatbubble-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: tabIcon('person', 'person-outline') }}
      />
    </Tabs>
  );
}
