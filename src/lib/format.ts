import type { Trip } from '@/types/models';

const DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** "ven. 6 juin" */
export function formatDay(iso: string): string {
  const d = new Date(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "08:00" */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Affichage du prix : "Gratuit" / "À négocier" / "25 DT" / "100 DH".
 * Cap Maroc : la devise suit le pays du trajet ('TN' → DT, 'MA' → DH).
 */
export function formatPrice(price: Trip['pricePerSeat'], country: 'TN' | 'MA' = 'TN'): string {
  if (price === null) return 'À convenir';
  if (price === 0) return 'Gratuit';
  return `${price} ${country === 'MA' ? 'DH' : 'DT'}`;
}

/**
 * Prix par personne pour un passager qui rejoint MAINTENANT (participation dynamique).
 * = prix total ÷ (conducteur + passagers déjà confirmés + lui-même).
 * Plus il y a de monde, moins cher. Retombe sur pricePerSeat (legacy) si pas de prix total.
 */
export function seatPriceNow(
  trip: Pick<Trip, 'priceTotal' | 'pricePerSeat' | 'seatsTotal' | 'seatsAvailable'>,
): number | null {
  if (trip.priceTotal != null) {
    if (trip.priceTotal <= 0) return 0;
    const confirmed = Math.max(0, trip.seatsTotal - trip.seatsAvailable);
    return Math.round((trip.priceTotal / (confirmed + 2)) * 10) / 10;
  }
  return trip.pricePerSeat;
}
