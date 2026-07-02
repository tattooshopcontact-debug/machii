# Runbook — Lancement du test fermé Machii après examen Google

> Contexte : 11 modifications (test fermé Alpha + fiche store) envoyées pour examen le 2026-07-01.
> Objectif dès approbation : démarrer le compteur des 14 jours avec la release 1.0.0 (build 3) existante.
> Décision validée par Faouez : option rapide (1.0.0 d'abord, la 1.1.0 Cap Maroc suivra sur le même canal).

## IDs

- Dev : `9085766013421711222` — App : `4975102920846009187` — Package : `com.machii.app`
- Piste test fermé Alpha : track `4699100553769303547`
- Compte : WACHEM.CO (session Google déjà active dans le profil Chrome dédié)

## 1. Vérifier l'état de l'examen

```powershell
# Chrome CDP (si pas déjà lancé)
Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList '--remote-debugging-port=9777','--user-data-dir=C:\Users\Wachem\.machii-browser-profile','--no-first-run'
# Vérification
cd C:\Users\Wachem\.machii-playwright; node status-check2.js
```

Interprétation de `STATUT_PUBLICATION` :
- `EN_COURS_EXAMEN` → examen pas fini. **Ne rien faire, ne pas notifier.**
- `PAS_ENVOYE` → anormal (modifications rejetées ou retirées) → inspecter la page publication + notifications de la console, **notifier Faouez avec le détail**.
- `AUTRE` → examen probablement terminé → passer à l'étape 2.

## ⚠️ 1-bis. AVANT de promouvoir le build 3 — vérifier les crashs Vitals

Le 2026-07-01 au soir, Faouez a reproduit un crash systématique sur le build 3 (Play Store) :
ouvrir le trajet d'un autre utilisateur (compte Khouloud) → l'app se ferme. Stack déjà vue dans
Vitals (1 événement du 11 juin, Pixel 7 Pro / Android 16) :
`java.lang.IllegalStateException: The specified child already has a parent` dans
`SurfaceMountingManager.addViewAt` (bug Fabric/New Architecture RN, écran détail trajet).

**TRANCHÉ le 2026-07-02** : crash reproduit en live via adb → cause exacte = `API key not found`
(MapView Google Maps sans clé API ; le bundle du build 3 CONTIENT la carte). Fix vérifié sur
téléphone avec l'APK 1.1.0 (versionCode 4, build EAS `ae32646e`, profil preview) : le détail
trajet s'affiche (schéma TripMapSchematic à la place de la carte), zéro crash.

➡️ **NE PAS promouvoir le build 3.** À la place, dès l'examen approuvé :
1. `npx eas-cli build --platform android --profile production --non-interactive --no-wait`
   (compte wawooz connecté sur ce PC ; autoIncrement → versionCode 5). AAB avec fix inclus.
2. Uploader cet AAB dans la release brouillon du test fermé Alpha (remplace l'étape 2.2 ci-dessous
   « Ajouter depuis la bibliothèque »).
3. La migration 0018 est APPLIQUÉE en prod (RPC otp_login vérifiée OK le 2026-07-02) — login sûr.
4. Clé Google Maps : optionnelle pour le test (schéma affiché sans clé) ; à créer avant la prod
   pour la vraie carte (`android.config.googleMaps.apiKey` dans app.json + rebuild).

## 2. Dès que l'examen est approuvé — remplir et déployer la release du test fermé

La piste Alpha contient une **release brouillon « 1.1.0 – Cap Maroc + sécurité prise en charge » SANS app bundle** (c'était la cause des 2 erreurs rouges vues le 2026-07-01 ; l'édition était en plus verrouillée pendant l'examen).

1. Aller sur `https://play.google.com/console/u/0/developers/9085766013421711222/app/4975102920846009187/tracks/4699100553769303547` → « Modifier la version ».
2. Dans « App bundles » → **« Ajouter depuis la bibliothèque »** → choisir le bundle **version code 3 (1.0.0)** (celui du test interne). NE PAS uploader de nouveau fichier.
3. Renommer la release « 1.0.0 – Premier test fermé » et REMPLACER les notes de version par :
   ```
   Première version du test fermé Machii. Merci de garder l'application installée pendant toute la durée du test.
   ```
   (Les notes « Cap Maroc » d'origine sont archivées en bas de ce runbook pour la future 1.1.0.)
4. « Suivant » / « Prévisualiser et confirmer » → vérifier 0 erreur → **« Envoyer la version à Google pour examen »** (ou « Déployer » selon le libellé).
5. Onglet **Testeurs** de la piste → vérifier que les listes « test best food » + « Testeurs Centre LAER » sont cochées → **copier le lien opt-in du test fermé** (≠ lien du test interne).
6. Coller le lien à la place de `[LIEN]` dans `D:\Projets\machii\docs\play-store\message-testeurs-test-ferme.md`.
7. Notifier Faouez (PushNotification) : test fermé lancé + message WhatsApp prêt à envoyer + rappel objectif 12 testeurs inscrits × 14 jours.
8. Mettre à jour la mémoire Claude (`project_machii_v1_published.md`) : date de publication du test fermé = départ du compteur 14 j.

## Pièges connus

- Le bouton de confirmation du dialogue d'envoi s'appelle **« Envoi des modifications pour examen »** (pas « Envoyer ») — un `getByRole` sur /envoyer/i ne le matche pas.
- Play Console verrouille l'édition des releases tant que des modifications sont « en cours d'examen ».
- Les scripts Playwright sont dans `C:\Users\Wachem\.machii-playwright\` (playwright-core, connexion via `chromium.connectOverCDP('http://localhost:9777')`). Toujours ouvrir un **nouvel onglet** (`context.newPage()`) et le refermer.
- Si un script échoue sur un sélecteur : dumper `document.body.innerText` + lister les boutons visibles avant de cliquer (voir `find-submit-button.js`).

## Notes de version 1.1.0 Cap Maroc (archivées, à réutiliser plus tard)

```
• Ouverture au Maroc (+212, villes et devise DH)
• Mode « trajet entre femmes »
• Code à 4 chiffres à la prise en charge
• Partage de trajet en temps réel à un proche
• Connexion et clavier corrigés
```

⚠️ Avant de builder/shipper la 1.1.0 : consulter `docs/CAHIER_DES_CHARGES.md` + vérifier que la migration `0018_auth_hardening.sql` a été appliquée dans Supabase (sinon le nouveau client OTP casse la connexion).
