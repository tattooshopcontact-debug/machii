/**
 * Variables d'environnement publiques (préfixe EXPO_PUBLIC_, injectées au build).
 * Renseigne-les dans un fichier `.env` (voir `.env.example`).
 */
export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

/** True si Supabase est configuré. En V1, l'app tourne en mode démo sans backend. */
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
