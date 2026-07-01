/**
 * TripMap (version WEB) — react-native-maps ne fonctionne pas dans un navigateur.
 * On affiche le schéma du trajet (départ → arrivée) partagé avec les autres
 * environnements sans carte native (voir TripMapSchematic).
 *
 * Même interface que TripMap.tsx (résolution native) → Metro choisit ce fichier
 * automatiquement sur le web (.web.tsx).
 */
import { TripMapSchematic, type TripMapProps } from '@/components/TripMapSchematic';

export function TripMap(props: TripMapProps) {
  return <TripMapSchematic {...props} />;
}
