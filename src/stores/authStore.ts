import { create } from 'zustand';

import { mapProfileFromDb } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type { UserProfile } from '@/types/models';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Construit le couple (email, password) déterministe pour un numéro de téléphone.
 *
 * V0 : pas de Twilio, on simule une auth "par téléphone" en utilisant un
 * email synthétique qui n'existe pas vraiment. Comme c'est déterministe à
 * partir du numéro, la même personne avec le même numéro retombe sur le même
 * compte Supabase à chaque connexion → la persistance fonctionne réellement.
 *
 * Quand Twilio sera branché, on remplacera tout ce mécanisme par
 * `supabase.auth.signInWithOtp({ phone })` qui gère ça nativement.
 */
function credentialsFromPhone(phone: string): { email: string; password: string } {
  const digits = phone.replace(/\D/g, '');
  // Email purement synthétique, jamais envoyé vraiment : pas de risque de leak.
  const email = `${digits}@machii.local`;
  // Password déterministe stable. Côté Supabase il est stocké hashé (bcrypt).
  // Cette stratégie est V0 — quand Twilio sera là, on remplacera.
  const password = `machii-v0-${digits}`;
  return { email, password };
}

type AuthState = {
  /** null = non connecté. */
  user: UserProfile | null;
  /** Numéro saisi en attente de validation OTP. */
  pendingPhone: string | null;
  /** True quand la session Supabase a été chargée au boot (succès ou non). */
  hydrated: boolean;

  setPendingPhone: (phone: string | null) => void;

  /**
   * Connexion "par téléphone" V0 — sans Twilio.
   * Mécanisme :
   * 1) On tente d'abord un signInWithPassword(email_synthétique, password_dérivé)
   *    → si ça marche, l'user existait déjà, on retrouve son compte (et donc
   *      ses trajets, ses bookings, son historique).
   * 2) Sinon (Invalid login credentials) → c'est un nouveau user → signUp
   *    avec le même couple + données initiales (phone, full_name).
   *    Puis on re-signIn pour ouvrir la session.
   * 3) On synchronise le profil (full_name à jour si l'user l'a changé).
   *
   * Pré-requis : Confirm email DOIT être désactivé côté Supabase Auth,
   * sinon le signUp crée un user "non confirmé" qui ne peut pas se logger.
   */
  signInWithPhone: (phone: string, fullName?: string) => Promise<void>;

  /** Re-lit la session depuis le storage au démarrage. */
  loadSession: () => Promise<void>;

  /** Met à jour le profil courant en DB et dans le store. */
  updateProfile: (
    patch: Partial<{ fullName: string; role: UserProfile['role']; bio: string }>,
  ) => Promise<void>;

  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  pendingPhone: null,
  hydrated: false,

  setPendingPhone: (pendingPhone) => set({ pendingPhone }),

  signInWithPhone: async (phone, fullName) => {
    const { email, password } = credentialsFromPhone(phone);
    const cleanName = fullName?.trim();

    // Étape 1 : tenter de se reconnecter avec un compte existant.
    let { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    // Étape 2 : pas trouvé → créer le compte, puis re-signIn.
    if (signInError) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { phone, full_name: cleanName ?? '' },
        },
      });
      if (signUpError) throw signUpError;

      const second = await supabase.auth.signInWithPassword({ email, password });
      if (second.error) throw second.error;
      signInData = second.data;
    }

    const userId = signInData.user?.id;
    if (!userId) throw new Error('Connexion : aucun user retourné');

    // Étape 3 : synchroniser le profil. Le trigger handle_new_user a créé la
    // ligne profiles à l'inscription, on met juste à jour les champs visibles
    // (notamment full_name si l'utilisateur l'a changé entre 2 sessions).
    const patch: { phone: string; full_name?: string } = { phone };
    if (cleanName) patch.full_name = cleanName;

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select()
      .single();

    if (profileError) throw profileError;
    set({ user: mapProfileFromDb(profileRow), pendingPhone: null });
  },

  loadSession: async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData.session?.user;
      if (!sessionUser) {
        set({ hydrated: true });
        return;
      }
      const { data: profileRow, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', sessionUser.id)
        .maybeSingle();
      if (error || !profileRow) {
        set({ hydrated: true });
        return;
      }
      set({ user: mapProfileFromDb(profileRow), hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  updateProfile: async (patch) => {
    const current = get().user;
    if (!current) throw new Error('updateProfile: pas de user connecté');

    const dbPatch: ProfileUpdate = {};
    if (patch.fullName !== undefined) dbPatch.full_name = patch.fullName;
    if (patch.role !== undefined) dbPatch.role = patch.role;
    if (patch.bio !== undefined) dbPatch.bio = patch.bio;

    const { data: profileRow, error } = await supabase
      .from('profiles')
      .update(dbPatch)
      .eq('id', current.id)
      .select()
      .single();
    if (error) throw error;
    set({ user: mapProfileFromDb(profileRow) });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, pendingPhone: null });
  },
}));
