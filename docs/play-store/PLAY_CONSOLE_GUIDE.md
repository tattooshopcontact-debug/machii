# Guide pas-à-pas — Soumettre Machii sur Google Play Console

> Toutes les valeurs prêtes à copier-coller. Suis dans l'ordre.

---

## 0. Avant de commencer

Tu as besoin de :
- [ ] Ton compte Google Play Developer activé (le 25 USD)
- [ ] Un email de contact public (ex: `support@machii.app` ou ton Gmail perso, peu importe — il sera visible)
- [ ] Ce dossier sous la main : `D:\Projets\machii\docs\play-store\` (contient tous les assets)

---

## 1. Créer l'app dans Play Console

1. Va sur **https://play.google.com/console**
2. Clique **"Créer une application"** en haut à droite
3. Remplis :
   - **Nom de l'application** : `Machii — Covoiturage Tunisie`
   - **Langue par défaut** : `Français (France) — fr-FR`
   - **App ou jeu** : `App`
   - **Gratuite ou payante** : `Gratuite`
   - Coche les 2 déclarations en bas (règlement + lois US export)
4. Clique **"Créer une application"**

---

## 2. Fiche principale du Play Store (Main store listing)

Menu gauche → **Croissance** → **Présence sur le Play Store** → **Fiche du Play Store principale**

### App details

- **Nom de l'application** : `Machii — Covoiturage Tunisie` (déjà rempli)
- **Description courte** (80 char max) :
  ```
  Trouve ou propose un trajet Tunis-Sousse-Sfax. Covoiturage tunisien gratuit.
  ```
- **Description longue** (4000 char max) : copie-colle depuis `store-listing-fr.md` section "Description longue"

### Graphismes

| Champ | Fichier à uploader |
|---|---|
| **Icône de l'application** (512×512) | `assets/images/icon.png` |
| **Image principale / Feature graphic** (1024×500) | `docs/play-store/feature_graphic.png` |
| **Captures d'écran téléphone** (min 2, recommandé 8) | les 8 fichiers `docs/play-store/screenshots/*.png` |

### Catégorisation

- **Type d'application** : `Application`
- **Catégorie** : `Voyages et infos locales`
- **Étiquettes** (tags) : ajoute si proposés : `Carpooling`, `Travel`, `Tunisia`, `Ride sharing`

### Coordonnées

- **Site web** (optionnel) : `https://tattooshopcontact-debug.github.io/machii/`
- **Email** : ton email de contact (ex: `tattooshop.contact@gmail.com` ou `support@machii.app` si tu le crées)
- **Téléphone** : optionnel, laisse vide

### Politique de confidentialité

URL à coller : **`https://tattooshopcontact-debug.github.io/machii/privacy.html`**

Clique **Enregistrer** en bas.

---

## 3. Public visé et contenu

Menu gauche → **Politique** → **Public visé et contenu**

### Tranche d'âge cible

- **Tranches d'âge** : coche uniquement `18 ans et plus`
- Réponds aux questions de modération si Google les pose.

### Newsletters / publicités enfants

- **L'app affiche-t-elle des publicités ?** : `Non`
- **L'app cible-t-elle les enfants ?** : `Non`

---

## 4. Questionnaire Content Rating

Menu gauche → **Politique** → **Évaluation du contenu**

Lance le questionnaire. Voici les **réponses pré-remplies** :

### Catégorie : Référence / Productivité / Utilitaires
Choisis cette catégorie (Reference / Productivity / Tools).

### Questions standards
- **Violence** : Non
- **Sexualité** : Non
- **Langage grossier** : Non
- **Substances contrôlées** (drogues/alcool) : Non
- **Jeux d'argent** : Non
- **Achats intégrés** : Non
- **Localisation utilisateur** : **Oui** (l'app accède à la position)
- **Contenu généré par les utilisateurs** (UGC) : **Oui** (chat texte entre utilisateurs)
- **Modération de l'UGC** : `Oui, modération automatique` (notre anti-bypass)
- **Application financière** : Non
- **Partage de coordonnées personnelles** : `Oui, avec consentement` (numéro de téléphone partagé après acceptation)

Résultat attendu : classification **PEGI 12+** ou **Tout public 13+**.

---

## 5. Sécurité des données (Data Safety)

Menu gauche → **Politique** → **Sécurité des données**

### Données collectées

Coche les cases suivantes :

| Type de donnée | Collectée | Partagée | Optionnelle | Finalités |
|---|---|---|---|---|
| Numéro de téléphone | ✓ | ✓ (avec autres users après acceptation) | Non | Comptes, communications app |
| Nom (prénom) | ✓ | ✓ (visible autres users) | Non | Comptes |
| Photo de profil | ✓ | ✓ (visible autres users) | Oui | Comptes |
| Adresse e-mail | Non | - | - | - |
| Position GPS approximative | ✓ | Non | Non | Fonctionnalité de l'app |
| Position GPS précise | ✓ | Non (sauf bouton SOS aux contacts d'urgence) | Non | Sécurité, fonctionnalité app |
| Messages dans l'app | ✓ | Non | Non | Communications |
| Photos prises (KYC) | ✓ | Non | Oui | Vérification d'identité |
| Documents d'identité (CIN, permis) | ✓ | Non | Oui | Vérification d'identité |
| Plantages / diagnostics | ✓ | Non | Non | Analyses |

### Pratiques de sécurité

- **Données chiffrées en transit** : `Oui`
- **Vous pouvez demander la suppression de vos données** : `Oui`
- **Vous adhérez au Play Families Policy** : N/A (pas pour enfants)
- **Vous avez fait l'objet d'un audit de sécurité indépendant** : `Non`

---

## 6. Upload de l'AAB — Test interne

Menu gauche → **Tests** → **Tests internes**

1. Clique **Créer une release**
2. Section "Bundles d'applications" → **Importer** → sélectionne :
   ```
   D:\Projets\machii\docs\play-store\machii-production.aab
   ```
3. Attends la validation (1-2 min)
4. **Nom de version** : laisse `1.0.0` (auto)
5. **Notes de version** :
   ```
   Première release de Machii — covoiturage gratuit pour la Tunisie.

   - Inscription par numéro de téléphone
   - Mode passager : recherche et réservation de trajets
   - Mode conducteur : publication de trajets et gestion des demandes
   - Chat intégré avec protection anti-arnaque
   - Bouton SOS et contacts d'urgence
   ```
6. Clique **Suivant** puis **Enregistrer et publier sur le test interne**

### Ajouter des testeurs

1. Onglet **Testeurs** → **Créer une liste de diffusion**
2. Nom de la liste : `Machii Beta Testers`
3. Ajoute des emails (un par ligne) — au minimum le tien et 1-2 amis pour démarrer :
   ```
   tattooshop.contact@gmail.com
   (email d'un ami)
   ```
4. Enregistre

### Lien d'invitation

Une fois la release publiée (5-30 min), tu auras un **lien Play Store** dans la section "Comment les testeurs rejoignent vos tests" → copie-le et envoie à tes testeurs.

---

## 7. Publication finale

Une fois testé en interne + à la limite quelques semaines de patch si besoin :

Menu gauche → **Production** → **Créer une release**

Même process que test interne, mais cette fois c'est **public**. Google met 1-7 jours pour valider.

---

## 8. À retenir

- **Google met 7-14 jours** pour valider une première soumission. Sois patient.
- Si Google rejette : ils précisent pourquoi → tu corriges et resoumets, ça repart pour 7 jours
- **Track les retours testeurs** dans Console → Tests internes → Commentaires
- Si tu modifies le code Machii : refais un build AAB (`eas build --platform android --profile production`), upload une nouvelle version

---

## Tu galères sur une étape ?

Reviens me voir, je débloque le truc précis.
