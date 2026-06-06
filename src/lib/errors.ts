/**
 * Extrait un message lisible depuis n'importe quelle erreur (Error native,
 * PostgrestError / AuthError Supabase, objet quelconque).
 */
export function describeError(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e !== null) {
    const obj = e as { message?: string; error_description?: string; details?: string; hint?: string; code?: string | number };
    const main = obj.message || obj.error_description || obj.details || obj.hint;
    if (main) return obj.code ? `${main} (code ${obj.code})` : main;
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }
  return String(e);
}
