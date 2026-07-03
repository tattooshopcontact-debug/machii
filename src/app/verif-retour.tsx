import { Redirect } from 'expo-router';

// Cible du lien vérifié Android (App Link) après la vérification Didit :
// https://machii.net/verif-retour ouvre l'app ICI, puis on redirige vers
// l'écran de vérification qui affiche le statut (« Identité vérifiée » / etc.).
export default function VerifRetour() {
  return <Redirect href="/profile/verify" />;
}
