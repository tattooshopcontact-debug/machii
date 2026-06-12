# Machii — Cahier des charges & état d'avancement

> Document de référence officiel. Source : cadrage Notion du 2026-05-05 (page `357d1de7e04b81dcac88dc2104dd7c83`, 19 décisions actées) + sessions de dev juin 2026 + audit Maroc 2026-06-11.
> Mis à jour : **2026-06-12**. Toute nouvelle session de dev DOIT consulter et mettre à jour ce fichier.

## Légende
✅ Fait et en prod (test interne) · 🟡 Partiellement fait · ⏸️ Pas commencé · ❌ Abandonné/remplacé

---

## Les 19 décisions du cadrage — état réel

| # | Décision | État | Détail |
|---|---|---|---|
| 1 | Gratuit + AdMob Phase 1 | ⏸️ | AdMob pas intégré. Sprint 6 du plan d'origine. |
| 2 | Périmètre : axe Tunis–Sousse–Sfax | ✅ | + 12 villes TN. Cap Maroc ajouté (audit 2026-06). |
| 3 | Cible : tout le monde, segmentation post-data | ✅ | |
| 4-bis | Stack Flutter + Supabase | ❌→✅ | Remplacé par **Expo/React Native + Supabase** (décision de session, app V1 livrée). Supabase conservé comme prévu. |
| 5-bis | Marque indépendante "Machii" | ✅ | Logo M jaune/navy, GitHub Pages, Play Store. |
| 6-bis | **Flux unifié + négociation libre du prix** | 🟡 | Prix fixe `price_per_seat` (peut être 0 = gratuit ou null = à négocier dans le modèle), mais **pas de mécanique de négociation in-app** (offre/contre-offre style inDrive). À faire. |
| 7-bis | Vérification modérée pour tous (CIN + permis + carte grise) | ✅ | KYC bucket privé + écran upload + RLS. Review manuelle Faouez. |
| 8 | Chat in-app obligatoire + anti-contournement regex | ✅ | Bloque numéros/emails/liens avant acceptation. Testé. |
| 9 | Notation multi-critères style BlaBlaCar | ✅ | 4 critères + recalcul rating_avg auto (migration 0008). |
| 10 | Petites annonces + **suggestions intelligentes + waypoint matching** | 🟡 | Annonces + recherche PostGIS ✅. **Carte trajet ✅ (2026-06-12)**. Waypoint matching (via, détour, suggestions) ⏸️ — la table `trip_waypoints` existe, jamais branchée. |
| 11-A | Bouton SOS → contacts d'urgence (PAS la police) + raccourci 197 | ✅ | Écran SOS + GPS + SMS + 197. Conforme au cadrage. |
| 11-B | **Partage de trajet temps réel — opt-in par le PASSAGER, 1 tap, lien web partageable 4h** | ✅ | **Complet (2026-06-12)** : (a) conducteur → passagers acceptés (Realtime in-app), (b) **bouton "Partager mon trajet à un proche"** pour tout participant → lien web `share.html?t=<token>` consultable SANS compte, position live (Leaflet/OSM, refresh 15 s), expiration 4 h, révocable. Migration 0017 + RPC `get_shared_trip`. |
| 11-C | **Confirmation d'arrivée symétrique + alerte fallback 30 min aux contacts d'urgence** | ⏸️ | Rien. Dépend de 12-B (codes) pour détecter le départ. |
| 12-A | Affichage échelonné des infos (plaque + photo véhicule APRÈS acceptation) | 🟡 | Le placeholder "Véhicule communiqué après acceptation" existe sur le détail trajet, mais **pas de saisie véhicule** (marque/couleur/plaque/photo) ni de révélation post-acceptation. Table `vehicles` existe en DB, pas branchée. |
| 12-B | **Code 4 chiffres SYMÉTRIQUE à la prise en charge** (passager montre son code, conducteur saisit, et réciproquement ; expiration 30 min) | 🟡 | **Cœur fait (2026-06-12, migration 0021)** : code généré auto à l'acceptation (trigger), affiché en GRAND côté passager, saisi côté conducteur (RPC `confirm_pickup` SECURITY DEFINER, vérif conducteur + `is distinct from` anti-NULL, testée serveur). `picked_up_at` horodaté. RESTE : expiration 30 min, masquer le code au conducteur (lecture via RPC dédiée — aujourd'hui `select *` le laisse lisible), confirmation réciproque arrivée (→ #11-C). |
| 13-A | Aucun paiement in-app Phase 1, cash direct | ✅ | Conforme. (Phase Maroc : wallet conducteur préparé plus tard, cf. audit.) |
| 13-B/C/D | **No-show : -1 étoile auto via les codes non saisis à +60 min, symétrique, ban à 3 récidives, contestation par signalement** | ⏸️ | Dépend de 12-B. Rien codé. |
| 14 | Nom Machii (secours Ploov) | ✅ | |
| 15 | Onboarding : soft launch fermé inclusif + badge Founding Member (100 premiers) | 🟡 | Test interne Play Store = le soft launch fermé ✅. Badge Founding Member ⏸️ (lié à #17). |
| 16 | Cadre légal TN : positionnement + **disclaimer permanent** | 🟡 | Bandeau "covoiturage gratuit loi 2004-33" présent sur create + profil ✅. Vérifier conformité complète du wording vs cadrage (CGU détaillées ⏸️). |
| 17 | **Gamification : XP + 5 niveaux/thèmes débloquables + 8 achievements** | 🟡 | XP/level en DB ✅ + **8 avatars débloquables ✅ (2026-06-11, équivalent moderne des "thèmes")**. MANQUE : attribution AUTO de l'XP (+10 trajet, +5 note, +20 parrainage), thèmes visuels complets (5 palettes), achievements événementiels (Ramadan, Aïd, Founding Member…), écran progression. |
| 18 | **Trajets répétitifs** (annonce mère + occurrences, désactivation ponctuelle, rappels veille) | 🟡 | Le flag `is_recurring` + toggle "Répétitif" existent à la création, mais **pas de mécanique mère/occurrences**, pas de choix des jours, pas de rappels. À faire. |
| 19 | Fork motis-project | ❌ | Caduc : app développée from scratch en Expo (plus rapide au final). |

---

## Travaux HORS cadrage livrés depuis (sessions juin 2026)

| Sujet | État |
|---|---|
| Auth téléphone + OTP mode démo (WhatsApp Meta préparé, en pause) | ✅ |
| Push notifications (pg_net → exp.host, 3 triggers) | ✅ |
| Suppression de compte Google-compliant (RPC + écran + page web) | ✅ |
| Demandes de trajet passager→conducteurs (trip_requests V1.1) | ✅ |
| Avatars IA Waze-style (8, gpt-image-2) | ✅ |
| Play Store : release 1.0.0 test interne + 44 testeurs + lien opt-in | ✅ |
| Privacy + delete pages publiques (GitHub Pages) | ✅ |
| Audit expansion Maroc (5 rapports sourcés) → GO progressif | ✅ |
| Multi-pays M1 : villes MA, country en DB, search_trips cloisonné | ✅ |
| Carte du trajet (react-native-maps) + live driver→passager | ✅ |

---

## ROADMAP consolidée (ordre validé par Faouez 2026-06-12)

### Bloc A — Compléter le cadrage sécurité (en cours)
1. ~~**#11-B complet**~~ ✅ FAIT 2026-06-12 (lien web 4h + position live sans compte)
2. ~~**#12-B** : codes 4 chiffres à la prise en charge (UI grand code + saisie)~~ 🟡 FAIT 2026-06-12 (migration 0021). Reste : expiration 30 min + masquer le code au conducteur.
3. **#11-C** : confirmation d'arrivée symétrique + alerte fallback 30 min aux contacts d'urgence
4. **#13-B/C/D** : no-show automatique via les codes (+60 min), -1 étoile, ban à 3, contestation
5. **#12-A** : saisie véhicule conducteur (marque/couleur/plaque/photo) + révélation après acceptation

### Bloc B — Cap Maroc (validé, en parallèle)
6. ~~M1 : sélecteur +216/+212 + devise DT/DH~~ ✅ FAIT (commit 50151e7)
7. ~~M2 : cloisonnement pays partout~~ ✅ FAIT (commit 50151e7)
8. ~~M3a : villes populaires + textes + cadre légal MA~~ ✅ FAIT (commit 50151e7)
9. ~~Mode femmes interurbain~~ ✅ FAIT (commit f8ed357, migration 0019) · badge Vérifié proéminent ⏸️
10. M4 : wallet conducteur + commission par pays (préparé, désactivé)
11. M5 : CGU Maroc + checklist CNDP

### Bloc C — Engagement (après beta stable)
12. **#17 complet** : XP auto (+10/+5/+20/+50), achievements (Founding Member, Ramadan, Aïd, Triple Axe…), thèmes visuels
13. **#18 complet** : trajets répétitifs mère/occurrences + rappels
14. **#6-bis complet** : négociation libre du prix (offre/contre-offre)
15. **#10 complet** : waypoint matching (suggestions "passe par chez toi")
16. Parrainage (+20 XP, avatar Ambassadeur)

### Bloc D — Monétisation & échelle
17. **#1** : AdMob (interstitiel, rewarded, banner + mediation) — décision compte séparé vs pub-8948248750767535
18. WhatsApp OTP prod (template machii_otp + numéro à enregistrer)
19. Matching auto demande↔trajet (push)
20. Production Play Store (25 juin) + App Store iOS

---

## Rappels structurants du cadrage (à ne jamais perdre)

- **Positionnement marketing** : « L'app de covoiturage la plus sûre de Tunisie » — tout le pack sécurité sert cet argument.
- **SOS n'appelle PAS la police** — CGU et écran doivent le dire explicitement (fait).
- **Background location interdit** en Phase 1 (rejet stores + batterie) — foreground only (respecté).
- **L'app n'arbitre pas les prix** (négociation libre) et **ne touche pas l'argent** en Phase 1.
- Coûts récurrents budgétés : Supabase free→25 €, cartographie 0–300 €, SMS ~0,05 €/alerte.
- Phase 2 envisagée : WaCoin ($WCH), self-hosting Supabase si souveraineté données exigée.

---

## ANNEXE — Specs détaillées de la sous-page Notion "Mockups & audit technique" (vérification approfondie 2026-06-12)

> Source : page Notion `35ad1de7e04b811087bfd04e3e6a80ce` (11 mockups validés par Faouez le 2026-05-05). Détails qui PRÉCISENT les décisions — à respecter à l'implémentation.

### Écarts détectés entre les mockups validés et l'app actuelle

| Mockup | Spec validée | État app | Écart à combler |
|---|---|---|---|
| 3.3 Annonce APRÈS confirmation | Code 4 chiffres en GRAND format jaune + plaque révélée + photo véhicule + boutons "Partager trajet"/"SOS" + "Annuler la réservation" outline rouge | Téléphone révélé seulement | Écran post-acceptation complet à faire (avec #12-B) |
| 3.4 Chat anti-bypass | Message bloqué = flouté + cadre rouge + **compteur "Avertissement 1/3 — 3e tentative = suspension 24h"** | Blocage simple sans avertissements ni suspension | Système warnings + suspension 24h |
| 3.6 Création répétitive | Toggle Ponctuel/Répétitif + **7 chips L M M J V S D** + heure + durée 6 mois + bandeau récap explicite + **Bagages (3 options) + toggle Animaux + "Mot pour les passagers"** | Toggle seul, pas de jours ni options | Formulaire complet décision #18 |
| 3.9 SOS activé | Header ROUGE #C92A2A + statuts de livraison par contact (✓ Lu / Envoyé) + carte GPS live + **désactivation par appui long 5 s** + bouton "Appeler le 197" | SOS basique | Écran d'état SOS riche |
| 3.10 KYC | États OCR par document + bandeau sécurité + **"pas de publication de trajet sans vérification complète"** + concept "Vérifié+ payant plus tard" | Upload simple, AUCUN blocage de publication | Gating publication si non vérifié (décision produit à confirmer) |
| 3.12 Résultats recherche | Chips filtres (heure, prix max, places, **Vérifié**) + card "⚡ MATCH INTELLIGENT" waypoint "+15 min" en vert + badge "À négocier" + état "Complet" grisé | Liste simple | Filtres + waypoint matching (#10) + états |
| 3.7 Mes thèmes | Barre XP + 5 cards thèmes avec mini-palettes + grille achievements 4×2 + tips contextuels | Avatars seulement | Écran progression (#17) |

### Spécifications transverses validées (baseline visuelle "Home v5")

- **Palette officielle** : navy #1B3D6E · jaune **#FFD400** · orange #F18A4D · crème #FAF7F2 · gris #888 · rouge SOS #C92A2A · vert succès #4ADE80. ✅ L'app respecte (#FFD400 dans theme/colors.ts). ⚠️ Les assets branding (icône, feature graphic) ont été générés en #F4C842 — à harmoniser un jour (mineur).
- **Logo officiel acté** : wordmark "Machii" navy, 2 cercles jaunes au-dessus des 2 "i" reliés par un **arc courbe** (variation "Curved Arc" #2). Monogramme M = OK pour l'app icon (validé comme tel dans le cadrage).
- **Style** : header bleu animé (particules + lignes GPS), boutons jaunes "plaque 3D" avec halo, avatars sphères glossy, cards en relief — l'app actuelle suit cette baseline.
- **Master prompt Machii** : sauvegardé dans la conversation Claude du 2026-05-05 + à dupliquer dans `D:\machii\master_prompt_machii.md`.

### Écrans listés au cadrage encore inexistants dans l'app

- Onboarding 1ère ouverture (3-4 écrans tutoriel)
- Écran "Trajet en cours" (live tracking pendant la route — au-delà du marqueur sur la carte)
- Liste de notifications in-app
- Écran paramètres / préférences
- Notification festive de déblocage de thème/avatar
- Écran "activation du partage temps réel" opt-in PASSAGER (cœur du #11-B)
- Écran confirmation d'arrivée symétrique (#11-C)

### Tâches business du cadrage toujours ouvertes

- [ ] Réserver domaines machii.com / machii.tn / machii.app
- [ ] Marques INNORPI Tunisie + EUIPO classes 9, 39, 42
- [ ] Vectorisation pro du logo (Figma/Illustrator) — le rendu actuel est une référence, pas un vectoriel finalisé

---

## ANNEXE 2 — Nuances retrouvées dans le vault Obsidian (vérification approfondie 2026-06-12)

> Sources : `D:\mon-vault\memory\decisions.md` (journal des décisions) + `FAWEZ.md` (tableau de bord). Confirment le cadrage Notion avec 3 précisions :

1. **KYC différencié par rôle (décision #7-bis, version précise)** : conducteurs = CIN + permis + carte grise + photo véhicule. **Passagers = CIN SEUL.** L'app actuelle ne différencie pas — à corriger quand on fera le gating de publication.
2. **Négociation libre (#6-bis, sens du flux)** : c'est le **PASSAGER qui propose** un prix → le conducteur accepte / contre-propose / offre gratuit. (Ou prix fixe classique BlaBlaCar.) À respecter quand on codera la négociation.
3. **Suggestions intelligentes (#10)** : les suggestions waypoint doivent arriver en **notifications non bloquantes** (ramener l'utilisateur dans l'app, pas l'interrompre).

Pré-requis business du cadrage (rappel vault) toujours ouverts : INNORPI classes 9/39/42 + domaines machii.com/.tn/.app. La condition "pas avant le lancement d'un des 4 projets actifs" est caduque (Machii est parti en premier, assumé).

---

## ANNEXE 3 — Idées & astuces récupérées de la version Flutter (mai 2026)

> Sources : ancien projet Flutter `D:\machii\decisions.md` (24 décisions) + `D:\machii\mockups.md` (12 écrans détaillés). Flutter est **abandonné** (remplacé par Expo/RN), mais ces specs de conception restent valables. On ne garde QUE ce qui n'est pas déjà dans les annexes 1 et 2. À porter dans l'app Expo au fil des blocs.

### A. Spec gamification COMPLÈTE (décision #17) — pour le Bloc C

**Barème XP** : +10 / trajet · +5 / notation validée · +20 / parrainage · +50 / achievement.

**5 thèmes visuels débloquables par paliers** (chacun = une palette qui repeint l'app) :
| Thème | Déblocage | Couleurs |
|---|---|---|
| V1 Original | gratuit (défaut) | navy #1B3D6E + jaune #FFD400 |
| V2 Nature | 100 XP | vert sapin + ocre |
| V3 Moderne | 300 XP | bleu marine + corail |
| V4 Premium | 600 XP | bordeaux + or doux |
| Sahara | 1000 XP | sable + bleu nuit |

**8 achievements** (badge + parfois thème spécial) : 🏆 Founding Member (100 premiers) · ⭐ Triple Axe (Tunis+Sousse+Sfax) · 💛 Cœur Généreux (trajets gratuits) · 🛡️ Fiable (0 no-show) · 🌙 Aïd · 📿 Ramadan · 🇹🇳 Indépendance · ⚡ Excellence. Les 4 événementiels (Aïd/Ramadan/Indépendance + saisonniers) se débloquent en faisant un trajet pendant la période.

**Écran "Ma progression"** (mockup #12) : barre XP "X restants avant niveau N+1" + 5 cards thèmes avec mini-bandes de couleurs + grille achievements 4×2 + tip contextuel ("Fais 1 trajet pendant l'Aïd pour débloquer le thème Aïd").

> État Expo : XP/level en DB + 8 avatars débloquables ✅. MANQUE : attribution AUTO de l'XP, les 5 thèmes-palettes, les 8 achievements nommés, l'écran progression.

### B. Anti-contournement chat (décision #8) — exact, pour le Bloc A

- **Mots-clés à bloquer** : `whatsapp`, `telegram`, `signal`, `viber`, `messenger`, `appelle`, `téléphone` + motifs `+216` / `+212` / suites de 8-9 chiffres.
- **Escalade** : message bloqué (flouté + cadre rouge "Bloqué par Machii") → **Avertissement 1/3** → **2/3** → **3/3 = suspension 24 h** → ban si récidive.
- Bandeau jaune permanent dans le chat : « Échange ton numéro et tu perds la protection Machii. »

> État Expo : blocage regex ✅, mais PAS de compteur d'avertissements ni de suspension. À ajouter.

### C. Micro-astuces UX à reprendre, écran par écran

- **Accueil** : bouton **swap départ↔arrivée** ; badges prix différenciés (jaune "25 DT" / vert "Gratuit" / gris "À négocier") ; pull-to-refresh.
- **Détail trajet (avant accept.)** : véhicule **générique** "Renault Clio · bleue" + encart cadenas « plaque & photo après confirmation » ; chips préférences conducteur (Non-fumeur / Musique OK / Discussion) ; lien **« Signaler ce trajet »** → catégories (Faux profil / Comportement / Autre).
- **Détail trajet (après accept.)** : encart vert « réservation confirmée » + **compte à rebours** « Départ dans 17 h 32 ».
- **Résultats recherche** : barre de **chips filtres** (Heure / ≤ prix / places / Vérifié / Aujourd'hui) ; card waypoint à **bordure jaune** « ⚡ MATCH INTELLIGENT · +15 min » (vert) ; badge « NOUVEAU », état « Complet » grisé.
- **Création trajet** : indicateur **« ÉTAPE 1/1 »** (pas de wizard) ; bandeau qui **résume la récurrence en clair** ; **bagages** (3 options) + toggle **animaux** ; participation marquée **« Facultatif »**.
- **Notation** : si « Plus tard » → **rappel push après 24 h** ; bandeau « +5 XP ».
- **SOS** : statut de livraison par contact (✓ Lu / Envoyé) ; numéros masqués « +216 22 ••• ••• » ; désactivation = **appui long 5 s** puis SMS « fausse alerte ».
- **KYC** : badge **« Vérifié+ »** payant en upsell V2 (préparer sans pousser) ; note « tu ne pourras pas publier sans vérification complète » (= gating publication).
- **Mes trajets** : onglets **À venir / Passés / Tous** ; **FAB** « + Nouveau trajet » ; menu **⋯** (Modifier / Dupliquer / Annuler) ; occurrence répétitive **désactivable/réactivable**.
- **Note** : n'afficher le score qu'à partir de **3-5 trajets notés** (évite le biais petit échantillon).

### D. Astuces design & composants

- **Tokens** : `secondary` et `warning` partagent volontairement l'orange **#F18A4D**.
- Préférer des **icônes vectorielles** (lucide / phosphor) aux emojis Unicode pour les éléments d'UI sérieux.
- Composants partagés du design system Flutter à avoir en équivalent Expo : **TimelinePoints** (départ→arrivée pointillé), **StarsRating**, **LevelBadge** (pilule niveau+XP), **AchievementTile**, **Disclaimer** (bandeau légal — on a `LegalBanner` ✅).
