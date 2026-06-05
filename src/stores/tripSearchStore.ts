import { create } from 'zustand';

type TripSearchState = {
  origin: string | null;
  destination: string | null;
  /** Date du trajet recherché (ISO, jour). */
  date: string | null;
  seats: number;

  setOrigin: (v: string | null) => void;
  setDestination: (v: string | null) => void;
  setDate: (v: string | null) => void;
  setSeats: (n: number) => void;
  swap: () => void;
  reset: () => void;
};

export const useTripSearchStore = create<TripSearchState>((set) => ({
  origin: null,
  destination: null,
  date: null,
  seats: 1,

  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  setDate: (date) => set({ date }),
  setSeats: (seats) => set({ seats: Math.max(1, seats) }),
  swap: () => set((s) => ({ origin: s.destination, destination: s.origin })),
  reset: () => set({ origin: null, destination: null, date: null, seats: 1 }),
}));
