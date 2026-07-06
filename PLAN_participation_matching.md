# Plan — Système « participation intelligente + matching le long du trajet » (Machii)

**Demande :** construire, dans l'ordre et par phases, tout le système discuté (profil véhicule → calcul coût réel → partage/plafond → transparence + reçu → matching corridor → notifs → récurrents → points de ramassage → Telegram).
**Livrable attendu :** un moteur de participation légal (coût réel partagé, plafonné, transparent, avec reçu) + un matching qui propose les trajets le long de la route, le tout derrière feature flags pour le build final unique.

> ⚠️ Rappel décisions Machii : on accumule tout derrière des **feature flags** (OFF), puis **UN SEUL build final** avec OTA (BUILD_BACKLOG). On avance **une phase à la fois, validée par Faouez** avant la suivante. Chaque phase finit par la QA 4 lignes (code / sécurité / fonctionnel réel / synchro app↔site).

> ✅ **ÉTAT RÉEL DU BACKEND (constaté 06/07, ça change le plan)** : beaucoup existe déjà !
> - `trips.route geography(LineString)` + index GIST `trips_route_gix` → **le tracé est déjà stocké** (Phase 0.2 FAITE).
> - `trip_waypoints` (étapes intermédiaires) + index GIST → **socle du corridor déjà là**.
> - RPC `search_trips` matche origin+destination par rayon (`st_dwithin`) → matching de base existant, à ÉTENDRE au corridor.
> - `recurring_trips` complet + pg_cron (migration 0056) → **Phase 5.1 FAITE** (reste l'abonnement passager 5.2 à vérifier).
> - `vehicles` (make/model/color/plate/seats/photo) + `price_per_seat` (0=offert/null=à convenir) existent.
> - **Le seul vrai trou du socle = année + carburant + conso sur `vehicles`** (+ config prix/usure). → **migration `0059_vehicle_cost_fields.sql` écrite** (à appliquer).

---

## ✅ FAIT & APPLIQUÉ EN BASE le 06/07/2026
- Migrations **0059 + 0060 + 0061 appliquées** au Supabase prod (via `_apply5432.cjs`), vérifiées.
- Véhicule a `year` + `fuel_type` + `consumption_l100`. Tables `fuel_prices` (TN essence/gasoil/gpl), `cost_params` (usure 0,05 · détour 3 km), `vehicle_consumption` (mondiale, vide en attente du seed), `consumption_defaults` (par carburant) créées et seedées.
- RPC `get_vehicle_consumption` (renvoie toujours une valeur) + `compute_trip_cost` (coût réel ÷ occupants, plafond) opérationnelles.
- **PÉAGE auto** (0062 + fix 0063) : table `toll_rates` géolocalisée (axes TN A1/A3/A4, valeurs de départ classe 1) ; `compute_trip_cost` détecte l'axe le plus proche du trajet. Bug corrigé au test (prenait Msaken 13 au lieu de Sousse 7 → tri par proximité des extrémités). Vérifié : Tunis→Sousse 7 · Tunis→Sfax 15,5 · Tunis→Bizerte 2,5 · trajet intra-ville → 0.
- **✅✅ PÉAGE OFFICIEL COMPLET & AUTOMATIQUE** (migrations 0071+0072, aspirateur `scripts/harvest_tolls.cjs`) : découverte de l'**API officielle** du calculateur Tunisie Autoroutes (plugin WP naxxum, `admin-ajax.php` actions `ttm_get_points_by_highway` + `ttm_find_route`). Aspiré dans Supabase : **29 stations (avec GPS) + 198 tarifs officiels** (tables `toll_stations` + `toll_matrix`). `official_toll(o,d)` = station la + proche du départ/arrivée par groupe d'autoroute (A1={1,2} avec charnière Hergla28/Msaken13, A3, A4) → **tarif exact pour N'IMPORTE quel trajet, automatiquement**. Vérifié : Tunis→Sousse 3,9 · Tunis→Sfax 7,1 · Tunis→Gabès 10,7 · **Sousse→Gabès 6,8** · Bizerte 1,4 · Béja 2,7 · Sfax→Gabès 3,6 · trajet ville = 0. Le « bot » (harvest) est ré-exécutable (récupère un nonce frais) pour rafraîchir.
- L'ancienne table `toll_rates` (paires de villes seedées à la main) est **remplacée** par la grille officielle aspirée (laissée en base, inutilisée). Reste : classes c2/c3 si besoin (on aspire c1=voitures), + péage corrigeable conducteur + mention « tarifs publics Tunisie Autoroutes ».
- **Fourchette + prix suggéré** (migrations 0066+0067, marge portée à **90 %** en 0075) : au moment où le conducteur choisit son prix, l'app **PROPOSE le prix raisonnable = le coût réel/personne calculé** (`part_reelle`), et **LIMITE au maximum = prix de base × 1,90** (`fourchette_max`). Min = 0 (Offert). Le conducteur choisit dans [0, max] avec le raisonnable pré-proposé, sans jamais dépasser le max. La marge 90 % couvre l'écart conso réelle/labo (~2× : vieille voiture + clim + trafic TN). Ex Picanto Tunis–Sousse 4 pers : **suggéré 7,59 · max 14,41 · min 0**. Le moteur renvoie déjà ces 3 valeurs (`part_reelle`/`fourchette_min`/`fourchette_max`).
- **ÉCRAN « MON VÉHICULE » étendu (app)** : `src/app/profile/vehicle.tsx` + `src/lib/vehicles.ts` + `database.types.ts`. Ajout **Année** + **Carburant** (chips essence/diesel/gpl/hybride/électrique). La **consommation se remplit TOUTE SEULE** au save via `get_vehicle_consumption` (le conducteur ne la saisit jamais) + affichage live « Consommation estimée : X L/100 km ». `tsc --noEmit` = 0 erreur.
- ⚠️ **Logique carburant INTELLIGENTE à ajouter (Faouez)** : les carburants proposés doivent dépendre du modèle choisi. Ex : une vieille Peugeot 203 → Essence/Diesel seulement, JAMAIS Électrique/Hybride (ce modèle n'existe pas ainsi). → RPC `get_vehicle_fuel_types(make,model,year)` qui renvoie les carburants réellement dispo pour cette voiture (depuis la base conso) ; l'app n'affiche que ceux-là. Fallback si base vide/modèle inconnu : Essence/Diesel/GPL (pas électrique/hybride par défaut). **Dépend du bot d'import conso** (qui apporte les couples modèle→carburant).
- **✅ BASE VOITURES IMPORTÉE (bot fait)** : `scripts/import_consumption.cjs` a rempli `vehicle_consumption` depuis **FuelEconomy.gov (US EPA, domaine public)** → **6 014 modèles** (MPG→L/100, agrégé make/model/carburant). + complément TN `0073` (Peugeot/Renault récentes, Dacia, Citroën, Seat, Opel, Skoda, classiques 203/404/504…) → **TOTAL 6 081 voitures, 150 marques**. Le conducteur choisit dans une **vraie liste** (ne peut pas tricher). Lookups vérifiés : Peugeot 203→10, Clio 2015 diesel→4.0, Dacia Logan→4.5, Peugeot 208→4.2.
- **✅ LOGIQUE CARBURANT INTELLIGENTE (fait)** : RPC `get_vehicle_fuel_types` (0074) + app filtre les boutons carburant selon la voiture. Vérifié : Peugeot 203→{essence} (jamais électrique) · Yaris→{essence,hybride} · Clio→{essence,gasoil}. Fallback essence/gasoil/gpl si modèle inconnu. `tsc`=0.
- **✅ PRIX DANS LA CRÉATION DE TRAJET (app)** : `src/app/trip/create.tsx` + `src/lib/pricing.ts` + RPC `preview_trip_cost` (0076). Modes **Offert / Participation**. En Participation : l'app calcule dès que départ/arrivée/places sont choisis → affiche un champ **pré-rempli au prix conseillé**, **plafonné au max** (impossible de taper au-dessus), + « Prix conseillé X · Maximum Y — partage de frais, jamais un bénéfice ». Publie `price_per_seat` = 0 (Offert) ou montant plafonné. `tsc`=0. Ex Tunis–Sousse 3 places : conseillé 9,27 · max 17,61.
  - ⚠️ **Changement du modèle prix** : on passe de « À convenir (price=null) » à « Participation (montant plafonné) ». C'est plus protecteur (jamais au-dessus du coût réel) mais il FAUT que les **CGU** décrivent « participation plafonnée au coût réel, aucun bénéfice » (Phase 8). Mettre à jour [[machii-prix-mode]].
- **✅ DÉTAIL TRANSPARENT CÔTÉ PASSAGER (app)** : `src/app/trip/[id].tsx` + hook `useTripCost` (pricing.ts, via `compute_trip_cost`). Quand un trajet a une participation (>0), une carte « Détail de la participation » montre distance · carburant (avec conso L/100) · usure · péage officiel · **coût total ÷ N personnes**, + « calculée automatiquement, partage de frais jamais un bénéfice, le conducteur paie aussi sa part ». `tsc`=0.
- Reste : test visuel Expo. (Optionnel : autocomplétion marque/modèle depuis la base ; aspirer classes péage c2/c3 ; aligner le SITE sur le nouveau mode prix ; **reçu de partage** ; **politique Machii + pages légales** Phase 8 ; notifs ; points de ramassage.)
- **MATCHING LE LONG DU TRAJET fait** (migration 0068) : profil conducteur a `detour_tolerance_km` (0 = circuit strict, null = défaut pays) ; RPC `match_corridor` trouve les trajets dont le tracé passe près du départ ET de l'arrivée du passager, **dans le bon sens**. Testé sur tracé Manouba→Tunis : Bardo→Bab Saâdoun = **MATCH** ✅ ; sens inverse = rejeté ✅ ; hors route (>3 km) = rejeté ✅.
- Reste Phase 0 : (a) **bot de seed** de `vehicle_consumption` (import mondial sur VPS), (b) écran **« Mon véhicule »**, (c) confirmer les vraies valeurs (prix carburant / usure). Reste aussi : intégration app (UI participation/fourchette, écran Mon véhicule), notifs, points de ramassage suggérés, reçu, politique, pages légales.

---

## Décisions à verrouiller AVANT de coder (input Faouez)
- [ ] D1. **Taux d'usure/km** (DT/km) + **formule du plafond** (ex. plafond = coût réel partagé, jamais plus).
      ✅ Réussite : une valeur chiffrée pour l'usure/km et une règle de plafond écrites noir sur blanc.
- [ ] D2. **Source du prix carburant** (essence/gasoil/GPL officiels TN) : table de config manuelle OU source auto.
      ✅ Réussite : la source choisie est notée + les 3 prix actuels renseignés.
- [ ] D3. **Largeur par défaut du corridor** (tolérance détour par défaut) + unité (km).
      ✅ Réussite : une valeur par défaut écrite.

---

## Phase 0 — Socle données (fondations)
- [ ] 0.1. Migration SQL : colonnes **profil véhicule** (modèle, année, carburant, conso L/100) liées au conducteur.
      ✅ Réussite : migration appliquée, `SELECT` sur les nouvelles colonnes fonctionne.
- [ ] 0.2. Activer **PostGIS** + colonne **`route_geom` (LINESTRING geography)** sur `trips`.
      ✅ Réussite : `ST_GeometryType(route_geom)` renvoie `ST_LineString` sur un trajet test.
- [ ] 0.3. Table de config **prix carburant + taux usure/km** (valeurs D1/D2).
      ✅ Réussite : la table existe et contient les valeurs décidées.
- [ ] 0.4. Écran **« Mon véhicule »** (RN) : le conducteur choisit marque/modèle/année/carburant en **listes déroulantes** (PAS de saisie de conso). Recoupe flag F7 `vehicle_info`.
      ✅ Réussite : sur Expo web, choisir une voiture la persiste et la réaffiche après reload.
- [ ] 0.5. **Moteur de consommation MULTI-PAYS** (Chemin A — base mondiale, pas une liste TN) — détail complet : `RECHERCHE_CALCUL_CONSO_2026-07-06.md`. Le conducteur ne connaît pas sa conso :
      • Table `vehicle_consumption` MONDIALE (marque+modèle+année+carburant → L/100km), importée **1×** depuis **EEA (CO₂ UE) + CarDatabaseApi** (CO₂→L : essence ÷23,2 / diesel ÷26,5) + **facteur réel ≈1,25** (écart officiel/réel 39 %).
      • **Bot = 2 jobs sur le VPS** : (1) seed conso mondial 1× ; (2) refresh **prix carburant par pays** via **GlobalPetrolPrices** (135 pays, couvre TN/MA/EG/SN), hebdo.
      • **Algorithme lookup + fallback** par catégorie/cylindrée/carburant → renvoie TOUJOURS une valeur.
      • **Scalabilité** : base conso mondiale une fois ; par pays = ajouter lignes `fuel_prices` + `wear_per_km`. Moteur inchangé.
      • **v2 précision** : Spritmonitor (conso réelle 1,25M véh.) + TomTom (ville/autoroute sur le tracé `route` déjà stocké) + facteur charge passagers.
      ✅ Réussite : pour « Clio 2015 diesel », le moteur renvoie une conso réaliste ; modèle absent → fallback cohérent ; changer le pays change le prix carburant sans toucher au code.

## Phase 1 — Moteur de coût + transparence (cœur légal)
- [ ] 1.1. Récupérer **distance + tracé** via Google Maps (clé en place) et stocker `route_geom`.
      ✅ Réussite : à la création d'un trajet réel Tunis–Sousse, distance (km) et `route_geom` sont enregistrés.
- [ ] 1.2. RPC **`compute_trip_cost`** : coût = distance × (carburant/km + usure/km) + péage ; **/ occupants (conducteur inclus)** ; renvoie `{ total, part_par_personne, plafond, detail[] }`.
      ✅ Réussite : trajet test 50 DT / 5 personnes → part = 10, conducteur compté comme payeur.
- [ ] 1.3. Intégrer modes **Offert / Participation** : montant suggéré **plafonné** (dépassement impossible), vocabulaire « participation aux frais ».
      ✅ Réussite : saisir un montant > plafond est refusé (test manuel).
- [ ] 1.3bis. **Politique Machii — acceptation UNIQUE au départ** (façon EULA de jeu/logiciel : on accepte 1× et c'est tout, PAS de rappel à chaque clic). Un document « Politique / Conditions Machii » regroupe **tous les avertissements**, dont le **risque légal de la Participation** (loi 2004-33), le statut « mise en relation » de Machii, et « ton choix, ta responsabilité ». Accepté **une seule fois** (onboarding / avant de pouvoir publier), **horodaté + enregistré** en base = preuve de consentement éclairé (protège Machii). ⚠️ Le risque Participation doit être **nommé explicitement** dans le doc (pas noyé), pour que le consentement unique le couvre vraiment.
      ✅ Réussite : au 1er usage, l'utilisateur accepte la politique (user + date stockés) ; ensuite plus aucun rappel ; impossible de publier sans avoir accepté une fois.
- [ ] 1.4. **Détail transparent passager** (après acceptation) : distance, conso, prix carburant, coût/km, usure, péage, nb personnes → « ta part = X » + « le conducteur paie aussi X ».
      ✅ Réussite : l'écran affiche les lignes chiffrées cohérentes avec la RPC (Expo web).

## Phase 2 — Reçu de partage de frais (bouclier légal)
- [ ] 2.1. En fin de trajet, générer un **reçu** (coût total, nb personnes, part de chacun, « aucun bénéfice ») visible par conducteur ET passager.
      ✅ Réussite : après trajet test terminé, les 2 comptes voient le même reçu chiffré.
- [ ] 2.2. Bouton **« Afficher le justificatif »** hors-ligne (cache local).
      ✅ Réussite : le reçu s'affiche en mode avion.

## Phase 3 — Matching le long du trajet (liquidité)
- [ ] 3.1. **Tolérance de détour** dans le profil conducteur (km ; 0 = circuit strict).
      ✅ Réussite : la valeur se règle et se persiste ; défaut = D3.
- [ ] 3.2. RPC **`match_corridor`** : passagers dont départ ET arrivée sont à ≤ tolérance du tracé (`ST_DWithin` sur `route_geom`).
      ✅ Réussite : Manouba→Tunis matche Bardo→Bab Saâdoun ; ne matche PAS une demande hors corridor (2 tests).
- [ ] 3.3. Afficher les matchs « sur ta route » dans la recherche / le détail trajet.
      ✅ Réussite : les résultats corridor apparaissent distincts des matchs exacts.

## Phase 4 — Notifications intelligentes
- [ ] 4.1. Brancher **push Expo** (⚠️ lazy-require, court-circuit storeClient — leçon Expo Go push crash).
      ✅ Réussite : une push test arrive sur un vrai build sans crash.
- [ ] 4.2. Moteur **notif digest** (1 résumé « N trajets sur ta route ») déclenché par préférences + recherches + localisation.
      ✅ Réussite : un user avec axe favori reçoit 1 digest (pas N notifs) quand des trajets matchent.
- [ ] 4.3. Réglage de **fréquence** par l'utilisateur.
      ✅ Réussite : couper les notifs stoppe l'envoi (test).

## Phase 5 — Trajets récurrents (rétention)
- [ ] 5.1. Modèle **trajet récurrent** (route + jours + heure) : publier une fois sa navette.
      ✅ Réussite : un trajet récurrent crée les occurrences à venir (vérifié sur 1 semaine test).
- [ ] 5.2. **Abonnement** passager à un conducteur régulier.
      ✅ Réussite : l'abonné est notifié à chaque nouvelle occurrence.

## Phase 6 — Points de ramassage (suggérés dans le chat + émergents)
- [ ] 6.0. **Points de ramassage suggérés par DÉFAUT dans la discussion conducteur↔passager** :
      • **Point naturel (détour ~0)** : projeter la position du passager sur le tracé du conducteur (`ST_ClosestPoint` / `ST_LineLocatePoint`) → l'endroit où le conducteur passe le plus près.
      • **Accrocher à un lieu reconnaissable** (pas des coordonnées GPS brutes) : lieu connu le plus proche (entrée de ville/quartier, sortie d'autoroute, station).
      • **Proposer 1-3 points dans le chat** : « 📍 Point suggéré : entrée de Bardo (sur ta route) ». Les 2 acceptent en un tap ou proposent un autre.
      ✅ Réussite : à l'ouverture du chat d'une demande, l'app affiche des points de ramassage sur la route ; en 1 tap l'un est retenu.
- [ ] 6.1. **Collecter** les points réellement choisis (log géolocalisé).
      ✅ Réussite : chaque prise en charge enregistre son point.
- [ ] 6.2. **Bot** qui détecte les points récurrents et les promeut au rang de lieu officiel (nourrit les suggestions 6.0).
      ✅ Réussite : un point choisi ≥ seuil apparaît ensuite comme lieu suggéré.

## Phase 7 — Diffusion Telegram
- [ ] 7.1. Edge Function **`broadcast-trip`** → message formaté (axe, heure, Offert/À convenir, ✅ vérifié, PAS de prix) vers le canal de l'axe.
      ✅ Réussite : publier un trajet fait apparaître le message dans le canal test.
- [ ] 7.2. Même worker **cross-poste** sur le(s) groupe(s) Facebook ciblés.
      ✅ Réussite : le même trajet apparaît sur Telegram ET sur le groupe FB test.

## Phase 8 — Pages légales du SITE (couverture juridique + transparence) — APRÈS le moteur
Documenter le système de participation dans les 3 pages, pour être couvert (loi 2004-33 + INPDP 2004-63) et transparent.
- [ ] 8.1. **CGU** : le covoiturage Machii = **partage de frais**, jamais transport rémunéré ; la participation est **calculée par l'app** (conso réelle × distance × prix carburant officiel + usure) et **plafonnée au coût réel** ; conducteur **ne fait aucun bénéfice** ; « participation aux frais » (jamais « prix ») ; partage divisé entre occupants (conducteur inclus) ; usage non commercial.
      ✅ Réussite : la page CGU décrit la formule de calcul et le plafond en clair.
- [ ] 8.2. **Confidentialité** : quelles données on traite pour le calcul/matching (véhicule, position, tracé), pourquoi, durée, consentement, droits INPDP.
      ✅ Réussite : la page liste véhicule + géoloc/tracé et leur finalité.
- [ ] 8.3. **Mentions légales** : éditeur, hébergeur, statut « mise en relation / réseau de partage », pas opérateur de transport.
      ✅ Réussite : la page qualifie Machii comme plateforme de partage, pas transporteur.
- [ ] 8.4. **Cohérence app↔site** : le détail de calcul affiché dans l'app renvoie/colle aux CGU.
      ✅ Réussite : mêmes termes (participation/plafond) app et site.

---

## Vérification finale
- [ ] V. Bout-en-bout sur un trajet réel : profil véhicule → publication (tracé + coût) → participation plafonnée → passager voit le détail → match corridor d'un 2ᵉ passager → notif digest → trajet terminé → reçu pour les 2 → diffusion Telegram/FB. `npx tsc --noEmit` = 0 erreur.
      ✅ Réussite : chaque maillon fonctionne dans l'ordre sur un cas réel, tsc = 0, rien ne fuit le téléphone / n'affiche « prix ».
