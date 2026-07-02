/**
 * Données de démonstration — V1 tourne sans backend.
 * À remplacer par les requêtes Supabase (RPC search_trips, etc.) au fur et à mesure.
 */
import type { Conversation, Trip, UserProfile } from '@/types/models';

export const DEMO_TRIPS: Trip[] = [
  {
    id: 't1',
    driver: { id: 'd1', fullName: 'Ahmed Ben Salah', avatarTint: 'orange', ratingAvg: 4.8, tripCount: 47, isVerified: true },
    origin: 'Tunis',
    destination: 'Sfax',
    departureTime: '2026-06-06T08:00:00+01:00',
    seatsAvailable: 2,
    seatsTotal: 3,
    pricePerSeat: 25,
    status: 'open',
    country: 'TN',
    isRecurring: true,
  },
  {
    id: 't2',
    driver: { id: 'd2', fullName: 'Sami Trabelsi', avatarTint: 'navy', ratingAvg: 5.0, tripCount: 12, isVerified: true },
    origin: 'Tunis',
    destination: 'Sousse',
    departureTime: '2026-06-06T17:30:00+01:00',
    seatsAvailable: 3,
    seatsTotal: 3,
    pricePerSeat: 0,
    status: 'open',
    country: 'TN',
  },
  {
    id: 't3',
    driver: { id: 'd3', fullName: 'Mehdi Khelifi', avatarTint: 'navy', ratingAvg: 0, tripCount: 2, isVerified: false, isNew: true },
    origin: 'Tunis',
    destination: 'Sfax',
    departureTime: '2026-06-06T19:00:00+01:00',
    seatsAvailable: 2,
    seatsTotal: 4,
    pricePerSeat: null,
    status: 'open',
    country: 'TN',
  },
];

/** Suggestion "match intelligent" : conducteur qui passe par la ville cible. */
export const DEMO_MATCH: Trip = {
  id: 'm1',
  driver: { id: 'd4', fullName: 'Karim Feki', avatarTint: 'orange', ratingAvg: 4.9, tripCount: 33, isVerified: true },
  origin: 'Tunis',
  destination: 'Gabès',
  via: 'passe par Sfax',
  departureTime: '2026-06-06T09:00:00+01:00',
  seatsAvailable: 2,
  seatsTotal: 3,
  pricePerSeat: 22,
  status: 'open',
    country: 'TN',
  detourMinutes: 15,
};

export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    tripId: 't1',
    withName: 'Ahmed Ben Salah',
    withTint: 'orange',
    lastMessage: 'Parfait, rendez-vous à 8h devant la station.',
    lastAt: '2026-06-04T18:12:00+01:00',
    unread: 1,
    online: true,
  },
  {
    id: 'c2',
    tripId: 't2',
    withName: 'Sami Trabelsi',
    withTint: 'navy',
    lastMessage: 'Ok pour demain 👍',
    lastAt: '2026-06-04T12:40:00+01:00',
    unread: 0,
  },
];

export const DEMO_PROFILE: UserProfile = {
  id: 'me',
  fullName: 'Faouez',
  phone: '+216 ** *** ***',
  avatarTint: 'yellow',
  country: 'TN',
  role: 'both',
  isVerified: true,
  isAdmin: false,
  level: 3,
  xp: 380,
  xpForNextLevel: 600,
  ratingAvg: 4.8,
  criteria: [
    { key: 'punctuality', label: 'Ponctualité', value: 4.9 },
    { key: 'cleanliness', label: 'Propreté', value: 4.6 },
    { key: 'driving', label: 'Conduite', value: 4.8 },
    { key: 'friendliness', label: 'Sympathie', value: 4.9 },
  ],
  achievements: [
    { key: 'founding', label: 'Founding Member', emoji: '🚀', unlocked: true },
    { key: 'triple_axis', label: 'Triple Axe', emoji: '🛣️', unlocked: true },
    { key: 'generous', label: 'Cœur Généreux', emoji: '💛', unlocked: true },
    { key: 'reliable', label: 'Fiable', emoji: '✅', unlocked: true },
    { key: 'aid', label: 'Aïd Spirit', emoji: '🌙', unlocked: false },
    { key: 'ramadan', label: 'Ramadan Explorer', emoji: '✨', unlocked: false },
    { key: 'independence', label: '20 mars', emoji: '🇹🇳', unlocked: false },
    { key: 'excellence', label: 'Excellence 5★', emoji: '🏆', unlocked: false },
  ],
  tags: ['Non-fumeur', 'Musique OK', 'Discussion'],
};
