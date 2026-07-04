# Plan — Système testeur automatique Machii

**Demande :** Quand une personne saisit son email dans la popup « Télécharger l'app » et choisit Android, elle doit devenir **automatiquement** testeur Play et pouvoir installer l'app, **sans action manuelle** de Faouez.

**Livrable attendu :** popup email → l'email est ajouté tout seul à un groupe Google → ce groupe est la liste de testeurs du test fermé Play → la personne ouvre le lien opt-in et installe l'app.

**Contrainte connue :** Google interdit l'ajout d'un testeur par email via un Gmail normal. La seule voie automatique = un **groupe rattaché au domaine machii.net** (Cloud Identity, gratuit) piloté par une **clé de service** (Directory API). Les étapes 2, 4 et 7 nécessitent le compte Google de Faouez (je guide + je fais tout le code/DNS).

## Étapes

- [x] 1. Activer l'API « Admin SDK API » sur le projet Google Cloud `machii-501202`.
      ✅ Réussite : la page APIs & Services du projet affiche « Admin SDK API » avec l'état **Activée**.
      ▶ FAIT 2026-07-03 (via navigateur, 4e tentative) — capture confirme « État : Activé » + bouton « Désactiver l'API ».
- [ ] 2. Créer un compte **Cloud Identity Free** sur le domaine `machii.net` et le vérifier (enregistrement TXT posé dans Cloudflare). *(Faouez + moi pour le DNS)*
      ✅ Réussite : `admin.google.com` affiche le domaine `machii.net` comme **Vérifié** et un compte administrateur actif.
- [ ] 3. Créer le groupe **`testeurs@machii.net`** autorisant les membres externes (@gmail).
      ✅ Réussite : le groupe apparaît dans `admin.google.com` et l'ajout manuel d'un membre @gmail de test réussit sans erreur.
- [ ] 4. Créer une **clé de service** (service account) + activer la délégation à l'échelle du domaine + autoriser le scope `admin.directory.group.member` dans Console admin → Sécurité → Contrôles API. *(Faouez pour la délégation)*
      ✅ Réussite : fichier JSON de la clé téléchargé **et** le Client ID du service account figure dans les « Clients API » autorisés avec ce scope exact.
- [ ] 5. Coder + déployer la fonction Edge Supabase **`add-tester`** : reçoit un email → signe un JWT service account → obtient un token OAuth → appelle Directory API `members.insert` sur `testeurs@machii.net`.
      ✅ Réussite : `POST /add-tester {email:"<gmail test>"}` renvoie **HTTP 200** et l'email apparaît membre du groupe dans `admin.google.com`.
      ▶ CODE FAIT + déployé 2026-07-03. Boot vérifié (répond `not_configured` → démarre sans crash). Critère e2e (membre ajouté) **bloqué** tant que les secrets Google (2-4) ne sont pas posés.
- [ ] 6. Brancher l'appel automatique : à chaque insertion `waitlist` avec `source=download-popup` et `platform=android`, déclencher `add-tester` (appel direct après l'insert dans la popup).
      ✅ Réussite : soumettre un email Android réel dans la popup machii.net → l'email devient membre du groupe **automatiquement** (vérifié dans la console admin), sans aucune action manuelle.
      ▶ FAIT 2026-07-03 : déclencheur `trg_waitlist_add_tester` (AFTER INSERT, platform='android', appel serveur via pg_net + secret `x-gate`) + secret `ADD_TESTER_GATE` posé. Critère e2e **bloqué** par 2-4.
- [ ] 7. Dans Play Console → piste Alpha → onglet Testeurs : remplacer les listes d'emails par le **groupe Google `testeurs@machii.net`**. *(Faouez / moi via navigateur)*
      ✅ Réussite : l'onglet Testeurs affiche `testeurs@machii.net` comme source des testeurs, enregistré sans erreur.
- [ ] 8. Test bout-en-bout avec un Gmail de test : popup Android → email ajouté au groupe → ouvrir `https://play.google.com/apps/testing/com.machii.app` connecté avec ce Gmail.
      ✅ Réussite : la page opt-in affiche l'accès testeur (« You're a tester » / bouton d'installation), **pas** « you are not a tester ».
- [ ] 9. Nettoyage des données de test (retirer l'email de test du groupe + de la table `waitlist`).
      ✅ Réussite : le groupe et la table `waitlist` ne contiennent plus aucun email de test.

## Vérification finale
- [ ] 10. Reproduire avec un **2e Gmail de test** de bout en bout, sans aucune intervention manuelle entre la saisie de l'email et l'accès à l'app.
      ✅ Réussite : email saisi dans la popup → (automatique) membre du groupe → lien opt-in donne accès à l'installation. Zéro clic/action de Faouez entre les deux.
