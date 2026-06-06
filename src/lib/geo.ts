/**
 * Helpers géographiques pour PostGIS via Supabase.
 *
 * PostGIS attend des points au format `SRID=4326;POINT(lng lat)` —
 * attention à l'ordre LONGITUDE puis LATITUDE.
 */
import { CITIES, type City } from '@/constants/cities';

export function findCity(name: string | null | undefined): City | undefined {
  if (!name) return undefined;
  return CITIES.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

/** Construit la chaîne WKT pour un point PostGIS (SRID 4326). */
export function postgisPoint(lng: number, lat: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

/** Raccourci : ville → point PostGIS. Renvoie null si ville inconnue. */
export function cityToPoint(cityName: string): string | null {
  const c = findCity(cityName);
  return c ? postgisPoint(c.lng, c.lat) : null;
}

/**
 * Combine une date "aujourd'hui" et une heure "HH:MM" en ISO.
 * Si l'heure est déjà passée pour aujourd'hui, repousse à demain.
 */
export function parseDepartureTime(hhmm: string, now: Date = new Date()): string {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) throw new Error(`Heure invalide : "${hhmm}" (attendu HH:MM)`);
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (hours > 23 || minutes > 59) throw new Error(`Heure hors limites : "${hhmm}"`);

  const candidate = new Date(now);
  candidate.setHours(hours, minutes, 0, 0);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate.toISOString();
}
