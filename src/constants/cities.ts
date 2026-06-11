/**
 * Villes desservies par Machii, organisées par pays.
 * lat/lng pour PostGIS (SRID 4326).
 *
 * Cap Maroc (M1) : l'app est multi-pays. Chaque ville porte son code pays
 * ISO-3166 alpha-2 ('TN' | 'MA'). Le pays d'un utilisateur est déduit de
 * son préfixe téléphonique à l'inscription (+216 → TN, +212 → MA) et les
 * trajets sont cloisonnés par pays (M2).
 */
export type CountryCode = 'TN' | 'MA';

export type City = { name: string; lat: number; lng: number; country: CountryCode };

export type Country = {
  code: CountryCode;
  /** Nom affiché dans le sélecteur. */
  label: string;
  /** Préfixe téléphonique international. */
  dialCode: string;
  /** Drapeau emoji pour le sélecteur. */
  flag: string;
  /** Nombre de chiffres du numéro national. */
  phoneLength: number;
  /** Devise affichée à côté des prix. */
  currency: string;
  /** Placeholder du champ téléphone. */
  phonePlaceholder: string;
};

export const COUNTRIES: Country[] = [
  {
    code: 'TN',
    label: 'Tunisie',
    dialCode: '+216',
    flag: '🇹🇳',
    phoneLength: 8,
    currency: 'DT',
    phonePlaceholder: '22 543 891',
  },
  {
    code: 'MA',
    label: 'Maroc',
    dialCode: '+212',
    flag: '🇲🇦',
    phoneLength: 9,
    currency: 'DH',
    phonePlaceholder: '612 345 678',
  },
];

export function findCountry(code: CountryCode | string | null | undefined): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

/** Déduit le pays depuis un numéro E.164 complet (+216..., +212...). */
export function countryFromPhone(phone: string | null | undefined): Country {
  if (phone?.startsWith('+212')) return findCountry('MA');
  return findCountry('TN');
}

export const CITIES: City[] = [
  // ——— Tunisie ———
  { name: 'Tunis', lat: 36.8065, lng: 10.1815, country: 'TN' },
  { name: 'Ariana', lat: 36.8625, lng: 10.1956, country: 'TN' },
  { name: 'Ben Arous', lat: 36.7531, lng: 10.219, country: 'TN' },
  { name: 'Nabeul', lat: 36.4513, lng: 10.7357, country: 'TN' },
  { name: 'Hammamet', lat: 36.4, lng: 10.6167, country: 'TN' },
  { name: 'Sousse', lat: 35.8254, lng: 10.636, country: 'TN' },
  { name: 'Monastir', lat: 35.7643, lng: 10.8113, country: 'TN' },
  { name: 'Mahdia', lat: 35.5047, lng: 11.0622, country: 'TN' },
  { name: 'Kairouan', lat: 35.6781, lng: 10.0963, country: 'TN' },
  { name: 'Sfax', lat: 34.7406, lng: 10.7603, country: 'TN' },
  { name: 'Gabès', lat: 33.8881, lng: 10.0986, country: 'TN' },
  { name: 'Gafsa', lat: 34.425, lng: 8.7842, country: 'TN' },
  { name: 'Bizerte', lat: 37.2744, lng: 9.8739, country: 'TN' },
  { name: 'Djerba', lat: 33.8076, lng: 10.8451, country: 'TN' },

  // ——— Maroc (Cap Maroc M1 — axes prioritaires de l'audit 2026-06) ———
  { name: 'Casablanca', lat: 33.5731, lng: -7.5898, country: 'MA' },
  { name: 'Rabat', lat: 34.0209, lng: -6.8416, country: 'MA' },
  { name: 'Marrakech', lat: 31.6295, lng: -7.9811, country: 'MA' },
  { name: 'Tanger', lat: 35.7595, lng: -5.834, country: 'MA' },
  { name: 'Fès', lat: 34.0181, lng: -5.0078, country: 'MA' },
  { name: 'Agadir', lat: 30.4278, lng: -9.5981, country: 'MA' },
  { name: 'Meknès', lat: 33.8935, lng: -5.5473, country: 'MA' },
  { name: 'Oujda', lat: 34.6814, lng: -1.9086, country: 'MA' },
  { name: 'Kénitra', lat: 34.261, lng: -6.5802, country: 'MA' },
  { name: 'Tétouan', lat: 35.5889, lng: -5.3626, country: 'MA' },
  { name: 'El Jadida', lat: 33.2316, lng: -8.5007, country: 'MA' },
  { name: 'Essaouira', lat: 31.5085, lng: -9.7595, country: 'MA' },
];

/** Villes d'un pays donné (pour les pickers et chips). */
export function citiesOf(country: CountryCode): City[] {
  return CITIES.filter((c) => c.country === country);
}

/** Axe longue distance prioritaire par pays. */
export const PRIORITY_AXIS_BY_COUNTRY: Record<CountryCode, readonly string[]> = {
  TN: ['Tunis', 'Sousse', 'Sfax'],
  MA: ['Casablanca', 'Rabat', 'Marrakech', 'Tanger'],
};

/** Compat V0 (Tunisie) — utilisé par le code existant. */
export const PRIORITY_AXIS = PRIORITY_AXIS_BY_COUNTRY.TN;

export const cityNames = CITIES.map((c) => c.name);
