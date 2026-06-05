import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import type { Database } from '@/types/database.types';

import { env, isSupabaseConfigured } from './env';

/**
 * Client Supabase Machii.
 *
 * En V1 (mode démo), les clés peuvent être vides : le client est tout de même
 * créé mais aucune requête n'est faite tant que les écrans utilisent les mocks.
 * Renseigne `.env` puis branche les écrans sur ces requêtes au fur et à mesure.
 */
export const supabase = createClient<Database>(
  env.supabaseUrl || 'https://placeholder.supabase.co',
  env.supabaseAnonKey || 'public-anon-key-placeholder',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

export { isSupabaseConfigured };
