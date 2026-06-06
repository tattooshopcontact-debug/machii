import { create } from 'zustand';

import { mapProfileFromDb } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type { UserProfile } from '@/types/models';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

type AuthState = {
  /** null = non connecté. */
  user: UserProfile | null;
  /** Numéro saisi en attente de validation OTP. */
  pendingPhone: string | null;
  /** True quand la session Supabase a été chargée au boot (succès ou non). */
  hydrated: boolean;

  setPendingPhone: (phone: string | null) => void;

  /**
   * Connexion anonyme V0 — sans Twilio.
   * 1) Auth Supabase anonyme → JWT
   * 2) Le trigger `handle_new_user` a créé la ligne profiles automatiquement
   * 3) On update profiles.phone (et full_name si fourni)
   * 4) On charge le profil et on l'écrit dans le store.
   * Remplacer plus tard par signInWithOtp({phone}) quand Twilio sera branché.
   */
  signInAnonymous: (phone: string, fullName?: string) => Promise<void>;

  /** Re-lit la session depuis AsyncStorage au démarrage. */
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

  signInAnonymous: async (phone, fullName) => {
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    if (authError) throw authError;
    if (!authData.user) throw new Error('Auth anonyme : aucun user retourné');

    const patch: { phone: string; full_name?: string } = { phone };
    if (fullName?.trim()) patch.full_name = fullName.trim();

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', authData.user.id)
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
