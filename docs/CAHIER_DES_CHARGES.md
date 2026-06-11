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
| 11-B | **Partage de trajet temps réel — opt-in par le PASSAGER, 1 tap, lien web partageable 4h** | 🟡 | Fait le 2026-06-12 : partage **conducteur → passagers acceptés** (Realtime in-app). **MANQUE le cadrage exact** : passager qui partage à un PROCHE (contact d'urgence) + **lien web consultable sans compte** valable 4h. À compléter. |
| 11-C | **Confirmation d'arrivée symétrique + alerte fallback 30 min aux contacts d'urgence** | ⏸️ | Rien. Dépend de 12-B (codes) pour détecter le départ. |
| 12-A | Affichage échelonné des infos (plaque + photo véhicule APRÈS acceptation) | 🟡 | Le placeholder "Véhicule communiqué après acceptation" existe sur le détail trajet, mais **pas de saisie véhicule** (marque/couleur/plaque/photo) ni de révélation post-acceptation. Table `vehicles` existe en DB, pas branchée. |
| 12-B | **Code 4 chiffres SYMÉTRIQUE à la prise en charge** (passager montre son code, conducteur saisit, et réciproquement ; expiration 30 min) | ⏸️ | La colonne `bookings.confirm_code` existe depuis 0001, jamais utilisée. **Prochaine étape en cours.** |
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
1. **#11-B complet** : partage opt-in par le PASSAGER à ses proches → lien web public (page GitHub Pages lisant la position via token), 1 tap, valable 4h
2. **#12-B** : codes 4 chiffres symétriques à la prise en charge (UI grand code + saisie, expiration 30 min)
3. **#11-C** : confirmation d'arrivée symétrique + alerte fallback 30 min aux contacts d'urgence
4. **#13-B/C/D** : no-show automatique via les codes (+60 min), -1 étoile, ban à 3, contestation
5. **#12-A** : saisie véhicule conducteur (marque/couleur/plaque/photo) + révélation après acceptation

### Bloc B — Cap Maroc (validé, en parallèle)
6. M1 reste : sélecteur +216/+212 à l'inscription, devise DT/DH dynamique
7. M2 : cloisonnement pays partout (accueil, demandes)
8. M3 : interface publique marocaine (villes populaires, textes, cadre légal MA)
9. Mode femmes interurbain + badge Vérifié proéminent (différenciation lancement MA)
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
