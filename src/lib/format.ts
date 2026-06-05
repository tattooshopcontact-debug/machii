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

/** Affichage du prix : "Gratuit" / "À négocier" / "25 DT". */
export function formatPrice(price: Trip['pricePerSeat']): string {
  if (price === null) return 'À négocier';
  if (price === 0) return 'Gratuit';
  return `${price} DT`;
}
