import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

import type { Database } from '@/types/database.types';

import { env, isSupabaseConfigured } from './env';

/**
 * Storage SSR-safe.
 *
 * Expo Router exécute un rendu Node (SSR) pour la version web : `window`
 * n'existe pas à ce moment, et AsyncStorage tente d'y accéder → crash.
 * Sur le web client on utilise `window.localStorage` (sync mappé en Promise),
 * sur le SSR on retourne du no-op, sur natif on garde AsyncStorage.
 */
type SupabaseStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const noopStorage: SupabaseStorage = {
  getItem: () => Promise.resolve(null),
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
};

function buildStorage(): SupabaseStorage {
  if (Platform.OS !== 'web') {
    return AsyncStorage as unknown as SupabaseStorage;
  }
  if (typeof window === 'undefined' || !window.localStorage) {
    return noopStorage;
  }
  const ls = window.localStorage;
  return {
    getItem: (k) => Promise.resolve(ls.getItem(k)),
    setItem: (k, v) => {
      ls.setItem(k, v);
      return Promise.resolve();
    },
    removeItem: (k) => {
      ls.removeItem(k);
      return Promise.resolve();
    },
  };
}

const storage = buildStorage();
const isClient = Platform.OS !== 'web' || typeof window !== 'undefined';

/**
 * Client Supabase Machii.
 * Pas de clés → placeholders (l'app reste navigable côté UI mais les requêtes échoueront).
 */
export const supabase = createClient<Database>(
  env.supabaseUrl || 'https://placeholder.supabase.co',
  env.supabaseAnonKey || 'public-anon-key-placeholder',
  {
    auth: {
      storage,
      autoRefreshToken: isClient,
      persistSession: isClient,
      detectSessionInUrl: false,
    },
  },
);

export { isSupabaseConfigured };
