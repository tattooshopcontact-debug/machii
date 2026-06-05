/** Villes tunisiennes (axe prioritaire + principales). lat/lng pour PostGIS. */
export type City = { name: string; lat: number; lng: number };

export const CITIES: City[] = [
  { name: 'Tunis', lat: 36.8065, lng: 10.1815 },
  { name: 'Ariana', lat: 36.8625, lng: 10.1956 },
  { name: 'Ben Arous', lat: 36.7531, lng: 10.219 },
  { name: 'Nabeul', lat: 36.4513, lng: 10.7357 },
  { name: 'Hammamet', lat: 36.4, lng: 10.6167 },
  { name: 'Sousse', lat: 35.8254, lng: 10.636 },
  { name: 'Monastir', lat: 35.7643, lng: 10.8113 },
  { name: 'Mahdia', lat: 35.5047, lng: 11.0622 },
  { name: 'Kairouan', lat: 35.6781, lng: 10.0963 },
  { name: 'Sfax', lat: 34.7406, lng: 10.7603 },
  { name: 'Gabès', lat: 33.8881, lng: 10.0986 },
  { name: 'Gafsa', lat: 34.425, lng: 8.7842 },
  { name: 'Bizerte', lat: 37.2744, lng: 9.8739 },
  { name: 'Djerba', lat: 33.8076, lng: 10.8451 },
];

/** Axe longue distance prioritaire (décision #2). */
export const PRIORITY_AXIS = ['Tunis', 'Sousse', 'Sfax'] as const;

export const cityNames = CITIES.map((c) => c.name);
