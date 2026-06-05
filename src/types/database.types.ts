/**
 * Types de la base Supabase.
 *
 * ⚠️ Placeholder. Une fois le projet Supabase créé et la migration appliquée,
 * régénère ce fichier automatiquement :
 *
 *   supabase gen types typescript --project-id <ref> > src/types/database.types.ts
 *
 * Garde ce type `Database` jusque-là pour que le client supabase soit typé.
 */
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
