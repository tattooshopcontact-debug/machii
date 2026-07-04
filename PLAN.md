# Plan — Envoyer l'AAB 15 au test fermé Play Console

**Demande :** Uploader l'AAB build 15 (correctif crash + 123 villes) dans la release du test fermé Alpha de `com.machii.app`, l'envoyer à Google pour examen, récupérer le lien opt-in testeurs.

**Livrable attendu :** release Alpha contenant le **versionCode 15** envoyée pour examen + lien opt-in en main.

## Contexte / pièges connus (mémoire)
- Piloter Play Console via **Playwright connectOverCDP** sur Chrome `--remote-debugging-port=9777 --user-data-dir=C:\Users\Wachem\.machii-browser-profile` (session Google déjà active). Scripts dans `C:\Users\Wachem\.machii-playwright\`.
- Upload AAB : **limite 50 Mo de Playwright** → passer par CDP `DOM.setFileInputFiles`.
- **versionCode doit être NEUF** (15 OK, jamais utilisé) sinon « code de version déjà utilisé ».
- Bouton de confirmation d'envoi = « **Envoi des modifications pour examen** » (pas « Envoyer »).
- ⚠️ NE JAMAIS toucher au dialogue « Préférences de signature d'application » (risque perte de clé).
- Ne PAS créer de faux testeurs.

## Étapes

- [x] 1. Vérifier/lancer Chrome CDP :9777 (profil machii-browser-profile) et se connecter via Playwright.
      ✅ ▶ FAIT : connectOverCDP calait (cibles `browser_ui` omnibox + Chrome 149) → Chrome relancé proprement (kill PID 25812 + relance même profil = session Google conservée). Connexion OK, Play Console sans login.
- [x] 2. Aller sur l'app `com.machii.app` → Test fermé → piste Alpha → créer une release.
      ✅ ▶ FAIT : bouton « Créer une version » → nouvelle release brouillon **3** (`/tracks/4699100553769303547/releases/3/prepare`), release précédente 13 « non incluse ».
- [x] 3. Uploader l'AAB 15 via CDP `DOM.setFileInputFiles`.
      ✅ ▶ FAIT : `DOM.setFileInputFiles` (contourne limite 50 Mo) → table App bundles = `app-release.aab` **15 (1.1.0)**, aucune erreur.
- [x] 4. Remplir le nom de version + notes fr-FR, Enregistrer.
      ✅ ▶ FAIT : nom auto « 15 (1.1.0) », notes fr-FR (crash + villes + stabilité), « Enregistrer comme brouillon », 0 erreur.
- [x] 5. Envoyer pour examen (« Envoi des modifications pour examen »).
      ✅ ▶ FAIT : Vue d'ensemble publication → « Envoyer 1 modification pour examen » → dialogue « Envoi des modifications pour examen » confirmé. État = envoyé, plus aucune modif en attente.
- [x] 6. Récupérer le lien opt-in testeurs de la piste Alpha.
      ✅ ▶ FAIT (via clic « Copier le lien » + presse-papiers) : Web `https://play.google.com/apps/testing/com.machii.app` ; Android `https://play.google.com/store/apps/details?id=com.machii.app`.

## Vérification finale
- [x] 7. Confirmer que la release Alpha contient le versionCode 15 et est bien partie pour examen.
      ✅ ▶ FAIT : liste des applis → **Machii : Covoiturage / com.machii.app / Tests fermés / « En cours d'examen » / 4 juil. 2026**. Release 13 reste active tant que 15 n'est pas validée (normal).
