# Fiche Play Store — Machii

## Nom de l'application
**Machii — Covoiturage Tunisie**

## Description courte (80 caractères max)
*Réservation : 79/80 — chaque caractère compte*

```
Trouve ou propose un trajet Tunis-Sousse-Sfax. Covoiturage tunisien gratuit.
```

## Description longue (4 000 caractères max)

```
Machii, c'est l'app de covoiturage faite pour la Tunisie.

Trouve un trajet en quelques secondes ou propose le tien pour partager les frais d'essence. Tunis, Sousse, Sfax, Hammamet, Nabeul, Djerba : où que tu ailles, il y a probablement quelqu'un qui fait la même route que toi.

🚗 POUR LES PASSAGERS
• Cherche un trajet par ville et date
• Vois les places disponibles, la participation suggérée et la note du conducteur
• Réserve en un clic, le numéro du conducteur s'affiche dès qu'il accepte
• Reçois les bonnes infos au bon moment via les notifications

🚙 POUR LES CONDUCTEURS
• Publie ton trajet en moins d'une minute
• Reçois les demandes de réservation et accepte celles qui te conviennent
• Profite de Machii pour rentabiliser tes trajets habituels (loi tunisienne n° 2004-33 sur le covoiturage gratuit)
• Statut « Vérifié » disponible pour rassurer les passagers (CIN, permis, carte grise)

💬 CHAT SÉCURISÉ INTÉGRÉ
• Discute avec le conducteur ou le passager sans donner ton numéro de tél en clair
• Anti-arnaque : le partage de coordonnées avant acceptation est automatiquement bloqué
• Les conversations sont liées au trajet, pas perdues dans un fil sans contexte

🚨 SOS — POUR TES TRAJETS SEREINS
• Bouton SOS pendant un trajet : envoie ta position GPS par SMS à 3 contacts d'urgence de confiance
• Numéro de la police tunisienne (197) en accès direct
• Pensé pour rouler tranquille, surtout les longues distances

⭐ NOTATION POST-TRAJET
• Note ton conducteur ou ton passager sur 4 critères (ponctualité, conduite, ambiance, propreté)
• Le système favorise les bons profils

🇹🇳 100 % TUNISIEN
• Interface en français, optimisée pour les villes tunisiennes
• Conforme à la loi n° 2004-33 sur le transport routier : Machii est une plateforme de covoiturage GRATUIT, les arrangements financiers relèvent de la seule responsabilité des utilisateurs
• Aucune commission, aucun frais caché

📲 GRATUIT, SANS PUB
• Téléchargement gratuit
• Pas de publicité
• Pas de revente de tes données

Machii est encore en beta : ton retour nous aide à améliorer l'app chaque semaine. Écris-nous sur support@machii.app pour signaler un bug ou proposer une amélioration.

Bons trajets ! 🛣️
```

*Compteur : ~2 200 caractères. Marge confortable.*

## Mots-clés / tags

```
covoiturage, tunisie, transport, voiture, trajet, partage, sousse, tunis, sfax,
hammamet, économie, écologie, blablacar tunisien, machii, taxi alternatif
```

## Catégorie

**Voyages et infos locales** (Travel & Local)

## Public cible

- **Tranche d'âge** : 18+ uniquement (modélisé dans le formulaire Content Rating)
- **Public** : Tunisie principalement, accessible aux résidents tunisiens et expatriés

## Pays de distribution

**Phase 1 (beta)** : Tunisie uniquement
**Phase 2 (v1.1+)** : Maghreb (Algérie, Maroc, Libye) si pertinent

## Email de contact (obligatoire)

```
support@machii.app
```

⚠️ À créer si pas encore existant. Solution rapide : alias chez ton hébergeur ou Gmail dédié `machii.support@gmail.com`.

## URL Politique de confidentialité (obligatoire)

```
https://machii.app/privacy
```

⚠️ Doit être accessible publiquement. Options d'hébergement rapides :
1. **GitHub Pages** : push `privacy-policy-fr.md` sur un repo public, activer Pages → URL gratuite
2. **Notion** : créer une page publique, copier le contenu, partager URL publique
3. **Page web Vercel/Netlify** : déployer un site statique 1-page (10 min)

## Site web (optionnel mais recommandé)

```
https://machii.app
```

## Contenu de l'app pour Content Rating

- **Violence** : aucune
- **Sexualité** : aucune
- **Contenu utilisateur (UGC)** : oui, via chat texte → mentionner que modération automatique présente (anti-bypass)
- **Localisation** : oui, lors de l'utilisation uniquement
- **Données personnelles** : oui (cf politique confidentialité)
- **Achats intégrés** : non
- **Publicités** : non

## Captures d'écran requises

Format : 1080×1920 (portrait) ou 1080×2400 (portrait moderne) — au moins 2, recommandé 5-8.

À produire (générées via adb) :
1. Accueil mode passager (recherche + destinations populaires)
2. Liste des trajets disponibles avec carte
3. Détail d'un trajet (conducteur, prix, places, bouton réserver)
4. Mode conducteur : "Publier un trajet" + stats
5. Conversation chat avec anti-bypass actif
6. Profil utilisateur + note + niveau XP
7. Bouton SOS et contacts d'urgence
8. Modification du profil (avatar + rôle)

## Feature graphic (1024×500 — obligatoire)

À créer : bandeau horizontal avec logo Machii + accroche "L'app de covoiturage tunisien" + petite illustration voiture/route.

## Build à uploader

Format : **Android App Bundle (.aab)** — produit par EAS Build profile `production` :
```bash
eas build --platform android --profile production
```

Version : `1.0.0`, versionCode auto-incrémenté par EAS.

## Workflow de publication

1. **Closed Testing** (10-100 testeurs invités) → 14 jours minimum requis par Google avant Production depuis 2024
2. **Open Testing** (lien public d'invitation) → optionnel
3. **Production** (téléchargement public)

Pour aller vite, on peut sauter Open Testing et passer direct Closed → Production une fois les 14 jours réglementaires écoulés.
