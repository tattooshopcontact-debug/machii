import { create } from 'zustand';

import type { UserProfile } from '@/types/models';

type AuthState = {
  /** null = non connecté. */
  user: UserProfile | null;
  /** Numéro en cours de vérification OTP. */
  pendingPhone: string | null;
  hydrated: boolean;

  setUser: (user: UserProfile | null) => void;
  setPendingPhone: (phone: string | null) => void;
  setHydrated: (v: boolean) => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  pendingPhone: null,
  hydrated: false,

  setUser: (user) => set({ user }),
  setPendingPhone: (pendingPhone) => set({ pendingPhone }),
  setHydrated: (hydrated) => set({ hydrated }),
  signOut: () => set({ user: null, pendingPhone: null }),
}));
