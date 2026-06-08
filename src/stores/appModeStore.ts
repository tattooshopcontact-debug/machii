/**
 * Mode actif de l'app : "passenger" (je cherche un trajet) ou "driver" (je
 * propose). Pour les users dont le profil dit role='both', ce store decide
 * de l'experience affichee a l'instant T. Pour role='passenger' ou 'driver',
 * le rôle l'emporte et ce store est ignore.
 *
 * Persiste dans AsyncStorage pour conserver le mode entre 2 ouvertures.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Role } from '@/types/models';

export type AppMode = 'passenger' | 'driver';

type AppModeState = {
  mode: AppMode;
  setMode: (m: AppMode) => void;
};

export const useAppModeStore = create<AppModeState>()(
  persist(
    (set) => ({
      mode: 'passenger',
      setMode: (m) => set({ mode: m }),
    }),
    {
      name: 'machii.app_mode',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/**
 * Mode "effectif" qui doit s'appliquer a l'UI : le role du profil prime
 * sur le toggle s'il est mono (passenger ou driver).
 */
export function resolveEffectiveMode(role: Role | undefined, mode: AppMode): AppMode {
  if (role === 'passenger') return 'passenger';
  if (role === 'driver') return 'driver';
  return mode;
}
