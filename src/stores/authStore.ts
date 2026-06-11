import { create } from 'zustand';

import { mapProfileFromDb } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type { UserProfile } from '@/types/models';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Identifiants d'auth issus de la RPC `otp_login` (cf src/lib/otp.ts).
 * Le mot de passe N'EST PLUS dérivable côté client : il est calculé côté
 * serveur (HMAC(pepper, numéro)) et renvoyé uniquement après validation OTP.
 * Le client s'en sert pour ouvrir/créer la session Supabase.
 */
export type VerifiedOtp = {
  phone: string;
  fullName?: string;
  email: string;
  password: string;
};

type AuthState = {
  /** null = non connecté. */
  user: UserProfile | null;
  /** Numéro saisi en attente de validation OTP. */
  pendingPhone: string | null;
  /** True quand la session Supabase a été chargée au boot (succès ou non). */
  hydrated: boolean;

  setPendingPhone: (phone: string | null) => void;

  /**
   * Ouvre la session à partir d'un OTP déjà validé par le serveur.
   * 1) signInWithPassword(email, password) → si l'user existait, on le retrouve.
   * 2) sinon signUp (le trigger serveur `enforce_otp_on_signup` autorise la
   *    création uniquement parce qu'un OTP vient d'être consommé) puis re-signIn.
   * 3) synchronise le profil (full_name, phone, country).
   *
   * Pré-requis Supabase : "Confirm email" désactivé.
   */
  signInWithVerifiedOtp: (creds: VerifiedOtp) => Promise<void>;

  /** Re-lit la session depuis le storage au démarrage. */
  loadSession: () => Promise<void>;

  /** Met à jour le profil courant en DB et dans le store. */
  updateProfile: (
    patch: Partial<{
      fullName: string;
      role: UserProfile['role'];
      bio: string;
      avatarKey: string | null;
      gender: 'female' | 'male' | null;
    }>,
  ) => Promise<void>;

  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  pendingPhone: null,
  hydrated: false,

  setPendingPhone: (pendingPhone) => set({ pendingPhone }),

  signInWithVerifiedOtp: async ({ phone, fullName, email, password }) => {
    const cleanName = fullName?.trim();

    // Étape 1 : tenter de se reconnecter avec un compte existant.
    let { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    // Étape 2 : pas trouvé → créer le compte (autorisé par le trigger OTP), puis re-signIn.
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
    // ligne profiles à l'inscription, on met juste à jour les champs visibles.
    // Cap Maroc : le pays est déduit du préfixe téléphonique (+216/+212).
    const patch: { phone: string; full_name?: string; country: 'TN' | 'MA' } = {
      phone,
      country: phone.startsWith('+212') ? 'MA' : 'TN',
    };
    if (cleanName) patch.full_name = cleanName;

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select()
      .single();

    if (profileError) throw profileError;
    // On connaît le numéro (saisi par l'utilisateur) : on le réinjecte, car la
    // colonne `phone` n'est plus renvoyée par les select publics.
    set({ user: { ...mapProfileFromDb(profileRow), phone }, pendingPhone: null });
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
      // Récupère SON propre numéro via la RPC dédiée (la colonne `phone` n'est
      // plus exposée dans les select publics).
      const { data: myPhone } = await supabase.rpc('get_my_phone');
      set({
        user: { ...mapProfileFromDb(profileRow), phone: (myPhone as string | null) ?? '' },
        hydrated: true,
      });
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
    if (patch.avatarKey !== undefined) dbPatch.avatar_key = patch.avatarKey;
    if (patch.gender !== undefined) dbPatch.gender = patch.gender;

    const { data: profileRow, error } = await supabase
      .from('profiles')
      .update(dbPatch)
      .eq('id', current.id)
      .select()
      .single();
    if (error) throw error;
    // Conserve le numéro déjà chargé (non renvoyé par le select).
    set({ user: { ...mapProfileFromDb(profileRow), phone: current.phone } });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, pendingPhone: null });
  },
}));
