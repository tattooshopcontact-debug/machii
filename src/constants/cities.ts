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
  // ——— Tunisie — les 24 gouvernorats + leurs principales villes/délégations ———
  // (les 30 villes historiques sont conservées à l'identique ; ajout des grandes
  //  délégations pour couvrir toute la Tunisie, ~120 villes principales)

  // Gouvernorat de Tunis
  { name: 'Tunis', lat: 36.8065, lng: 10.1815, country: 'TN' },
  { name: 'Le Bardo', lat: 36.8092, lng: 10.1406, country: 'TN' },
  { name: 'La Marsa', lat: 36.8783, lng: 10.3247, country: 'TN' },
  { name: 'Carthage', lat: 36.8528, lng: 10.323, country: 'TN' },
  { name: 'Sidi Bou Saïd', lat: 36.8704, lng: 10.347, country: 'TN' },
  { name: 'La Goulette', lat: 36.8181, lng: 10.305, country: 'TN' },
  { name: 'El Menzah', lat: 36.8378, lng: 10.1706, country: 'TN' },
  // Ariana
  { name: 'Ariana', lat: 36.8625, lng: 10.1956, country: 'TN' },
  { name: 'La Soukra', lat: 36.8833, lng: 10.25, country: 'TN' },
  { name: 'Raoued', lat: 36.9333, lng: 10.2, country: 'TN' },
  { name: 'Ettadhamen', lat: 36.85, lng: 10.1333, country: 'TN' },
  { name: 'Kalâat el-Andalous', lat: 37.05, lng: 10.1167, country: 'TN' },
  // Ben Arous
  { name: 'Ben Arous', lat: 36.7531, lng: 10.219, country: 'TN' },
  { name: 'Radès', lat: 36.7667, lng: 10.2833, country: 'TN' },
  { name: 'Hammam Lif', lat: 36.7333, lng: 10.3333, country: 'TN' },
  { name: 'Ezzahra', lat: 36.7431, lng: 10.3078, country: 'TN' },
  { name: 'Mégrine', lat: 36.7667, lng: 10.2333, country: 'TN' },
  { name: 'Mornag', lat: 36.6667, lng: 10.2833, country: 'TN' },
  { name: 'Fouchana', lat: 36.7, lng: 10.1667, country: 'TN' },
  // Manouba
  { name: 'Manouba', lat: 36.8081, lng: 10.0956, country: 'TN' },
  { name: 'Oued Ellil', lat: 36.8167, lng: 10.0333, country: 'TN' },
  { name: 'Tebourba', lat: 36.8333, lng: 9.8333, country: 'TN' },
  { name: 'Douar Hicher', lat: 36.8167, lng: 10.0833, country: 'TN' },
  // Bizerte
  { name: 'Bizerte', lat: 37.2744, lng: 9.8739, country: 'TN' },
  { name: 'Menzel Bourguiba', lat: 37.15, lng: 9.7833, country: 'TN' },
  { name: 'Mateur', lat: 37.0403, lng: 9.6653, country: 'TN' },
  { name: 'Ras Jebel', lat: 37.2167, lng: 10.1167, country: 'TN' },
  { name: 'Menzel Jemil', lat: 37.2333, lng: 9.9167, country: 'TN' },
  { name: 'Sejnane', lat: 37.0556, lng: 9.2389, country: 'TN' },
  // Béja
  { name: 'Béja', lat: 36.7256, lng: 9.1817, country: 'TN' },
  { name: 'Medjez el-Bab', lat: 36.6489, lng: 9.6103, country: 'TN' },
  { name: 'Testour', lat: 36.55, lng: 9.4333, country: 'TN' },
  { name: 'Nefza', lat: 36.9833, lng: 9.0667, country: 'TN' },
  // Jendouba
  { name: 'Jendouba', lat: 36.5011, lng: 8.7803, country: 'TN' },
  { name: 'Tabarka', lat: 36.9544, lng: 8.758, country: 'TN' },
  { name: 'Aïn Draham', lat: 36.7667, lng: 8.6833, country: 'TN' },
  { name: 'Bou Salem', lat: 36.6167, lng: 8.9667, country: 'TN' },
  { name: 'Ghardimaou', lat: 36.45, lng: 8.4333, country: 'TN' },
  // Le Kef
  { name: 'Le Kef', lat: 36.1742, lng: 8.7047, country: 'TN' },
  { name: 'Dahmani', lat: 35.95, lng: 8.8333, country: 'TN' },
  { name: 'Tajerouine', lat: 35.8833, lng: 8.55, country: 'TN' },
  { name: 'Sers', lat: 36.0833, lng: 9.0167, country: 'TN' },
  // Siliana
  { name: 'Siliana', lat: 36.085, lng: 9.3708, country: 'TN' },
  { name: 'Gaâfour', lat: 36.3167, lng: 9.3167, country: 'TN' },
  { name: 'Bou Arada', lat: 36.35, lng: 9.6333, country: 'TN' },
  { name: 'Makthar', lat: 35.8583, lng: 9.205, country: 'TN' },
  // Zaghouan
  { name: 'Zaghouan', lat: 36.4028, lng: 10.1425, country: 'TN' },
  { name: 'El Fahs', lat: 36.3667, lng: 9.9, country: 'TN' },
  { name: 'Zriba', lat: 36.3, lng: 10.2, country: 'TN' },
  // Nabeul (Cap Bon)
  { name: 'Nabeul', lat: 36.4513, lng: 10.7357, country: 'TN' },
  { name: 'Hammamet', lat: 36.4, lng: 10.6167, country: 'TN' },
  { name: 'Kelibia', lat: 36.8478, lng: 11.0939, country: 'TN' },
  { name: 'Korba', lat: 36.5783, lng: 10.86, country: 'TN' },
  { name: 'Menzel Temime', lat: 36.7833, lng: 10.9833, country: 'TN' },
  { name: 'Soliman', lat: 36.7, lng: 10.4833, country: 'TN' },
  { name: 'Grombalia', lat: 36.5972, lng: 10.5039, country: 'TN' },
  { name: 'Dar Chaâbane', lat: 36.4667, lng: 10.75, country: 'TN' },
  // Sousse
  { name: 'Sousse', lat: 35.8254, lng: 10.636, country: 'TN' },
  { name: 'Msaken', lat: 35.73, lng: 10.5811, country: 'TN' },
  { name: 'Kalâa Kebira', lat: 35.8667, lng: 10.5333, country: 'TN' },
  { name: 'Hammam Sousse', lat: 35.86, lng: 10.6, country: 'TN' },
  { name: 'Akouda', lat: 35.8722, lng: 10.5678, country: 'TN' },
  { name: 'Enfidha', lat: 36.1333, lng: 10.3833, country: 'TN' },
  { name: 'Bouficha', lat: 36.3, lng: 10.45, country: 'TN' },
  // Monastir
  { name: 'Monastir', lat: 35.7643, lng: 10.8113, country: 'TN' },
  { name: 'Moknine', lat: 35.6333, lng: 10.9, country: 'TN' },
  { name: 'Ksar Hellal', lat: 35.6472, lng: 10.8917, country: 'TN' },
  { name: 'Jemmal', lat: 35.6167, lng: 10.7583, country: 'TN' },
  { name: 'Sayada', lat: 35.6667, lng: 10.9, country: 'TN' },
  { name: 'Téboulba', lat: 35.65, lng: 10.95, country: 'TN' },
  // Mahdia
  { name: 'Mahdia', lat: 35.5047, lng: 11.0622, country: 'TN' },
  { name: 'Ksour Essef', lat: 35.4181, lng: 11.0, country: 'TN' },
  { name: 'Chebba', lat: 35.2372, lng: 11.115, country: 'TN' },
  { name: 'El Jem', lat: 35.2967, lng: 10.7128, country: 'TN' },
  { name: 'Souassi', lat: 35.3333, lng: 10.5833, country: 'TN' },
  // Kairouan
  { name: 'Kairouan', lat: 35.6781, lng: 10.0963, country: 'TN' },
  { name: 'Sbikha', lat: 35.9333, lng: 10.0333, country: 'TN' },
  { name: 'Haffouz', lat: 35.6333, lng: 9.6833, country: 'TN' },
  { name: 'Oueslatia', lat: 35.85, lng: 9.5833, country: 'TN' },
  // Kasserine
  { name: 'Kasserine', lat: 35.1676, lng: 8.8365, country: 'TN' },
  { name: 'Sbeïtla', lat: 35.2372, lng: 9.1189, country: 'TN' },
  { name: 'Fériana', lat: 34.95, lng: 8.5667, country: 'TN' },
  { name: 'Thala', lat: 35.5667, lng: 8.6833, country: 'TN' },
  // Sidi Bouzid
  { name: 'Sidi Bouzid', lat: 35.0382, lng: 9.4849, country: 'TN' },
  { name: 'Regueb', lat: 34.8583, lng: 9.7833, country: 'TN' },
  { name: 'Meknassy', lat: 34.6167, lng: 9.6167, country: 'TN' },
  { name: 'Jelma', lat: 35.2667, lng: 9.4, country: 'TN' },
  // Sfax
  { name: 'Sfax', lat: 34.7406, lng: 10.7603, country: 'TN' },
  { name: 'Sakiet Ezzit', lat: 34.8167, lng: 10.7667, country: 'TN' },
  { name: 'Sakiet Eddaïer', lat: 34.8, lng: 10.7833, country: 'TN' },
  { name: 'Jebeniana', lat: 35.0333, lng: 10.9, country: 'TN' },
  { name: 'Mahares', lat: 34.5306, lng: 10.5, country: 'TN' },
  { name: 'Kerkennah', lat: 34.7167, lng: 11.1667, country: 'TN' },
  { name: 'Bir Ali Ben Khalifa', lat: 34.7333, lng: 10.1, country: 'TN' },
  { name: 'Agareb', lat: 34.75, lng: 10.5333, country: 'TN' },
  // Gafsa
  { name: 'Gafsa', lat: 34.425, lng: 8.7842, country: 'TN' },
  { name: 'Métlaoui', lat: 34.32, lng: 8.4, country: 'TN' },
  { name: 'Redeyef', lat: 34.3833, lng: 8.1667, country: 'TN' },
  { name: 'Moularès', lat: 34.45, lng: 8.2333, country: 'TN' },
  { name: 'El Guettar', lat: 34.3417, lng: 8.95, country: 'TN' },
  // Gabès
  { name: 'Gabès', lat: 33.8881, lng: 10.0986, country: 'TN' },
  { name: 'Mareth', lat: 33.6167, lng: 10.2833, country: 'TN' },
  { name: 'El Hamma', lat: 33.8833, lng: 9.7833, country: 'TN' },
  { name: 'Métouia', lat: 33.9667, lng: 10.0, country: 'TN' },
  { name: 'Matmata', lat: 33.5444, lng: 9.9667, country: 'TN' },
  // Tozeur
  { name: 'Tozeur', lat: 33.9197, lng: 8.1335, country: 'TN' },
  { name: 'Nefta', lat: 33.8722, lng: 7.8778, country: 'TN' },
  { name: 'Degache', lat: 33.9833, lng: 8.2167, country: 'TN' },
  // Kébili
  { name: 'Kébili', lat: 33.7044, lng: 8.969, country: 'TN' },
  { name: 'Douz', lat: 33.4569, lng: 9.0203, country: 'TN' },
  { name: 'Souk Lahad', lat: 33.7333, lng: 8.8667, country: 'TN' },
  { name: 'Faouar', lat: 33.3667, lng: 8.8, country: 'TN' },
  // Médenine
  { name: 'Médenine', lat: 33.3549, lng: 10.5055, country: 'TN' },
  { name: 'Djerba', lat: 33.8076, lng: 10.8451, country: 'TN' },
  { name: 'Zarzis', lat: 33.5045, lng: 11.1122, country: 'TN' },
  { name: 'Ben Gardane', lat: 33.1389, lng: 11.2167, country: 'TN' },
  { name: 'Midoun', lat: 33.8081, lng: 10.9917, country: 'TN' },
  { name: 'Ajim', lat: 33.7222, lng: 10.75, country: 'TN' },
  { name: 'Beni Khedache', lat: 33.25, lng: 10.2, country: 'TN' },
  // Tataouine
  { name: 'Tataouine', lat: 32.9297, lng: 10.4518, country: 'TN' },
  { name: 'Ghomrassen', lat: 33.0583, lng: 10.3417, country: 'TN' },
  { name: 'Remada', lat: 32.3167, lng: 10.3833, country: 'TN' },
  { name: 'Bir Lahmar', lat: 33.0833, lng: 10.6167, country: 'TN' },

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
