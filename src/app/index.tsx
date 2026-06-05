import { Redirect } from 'expo-router';

import { useAuthStore } from '@/stores/authStore';

/** Point d'entrée : redirige selon l'état de session. */
export default function Index() {
  const user = useAuthStore((s) => s.user);
  return <Redirect href={user ? '/(tabs)' : '/(auth)/phone'} />;
}
