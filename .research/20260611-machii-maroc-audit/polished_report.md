# Audit d'expansion — Machii au Maroc

> Audit réalisé le 11 juin 2026 sur la base de 4 recherches parallèles sourcées (53 recherches web, ~80 sources citées). Rapports détaillés dans `child_outputs/` (A marché, B concurrence, C paiements, D légal). Chaque affirmation clé de cette synthèse est traçable vers un rapport source.

---

## 0. Verdict exécutif

**GO — progressif et positionné.** Le Maroc est une opportunité réelle et nettement plus grande que la Tunisie, avec un paradoxe favorable : **le pays n'a aucun texte qui interdit le covoiturage à partage de frais** (zone grise tolérée depuis 8+ ans, précédent Pip Pip Yalah), alors que la Tunisie l'interdit formellement dès qu'il y a échange d'argent (amende 700 TND). Côté paiements, le Maroc est **incomparablement plus avancé** (13,7 M de wallets actifs contre ~469 000 en Tunisie, soit 29× plus) : c'est le seul des deux pays où une commission in-app est encaissable dès aujourd'hui.

La concurrence n'est pas le verrou qu'on croit : Pip Pip Yalah, seul acteur installé, plafonne à **~80 000 utilisateurs actifs pour 37 M d'habitants**, traîne des plaintes structurelles (faux conducteurs, wallet bloqué, support fantôme) et vient de réintroduire le cash en catastrophe (sept. 2025), fragilisant son propre modèle à commission. **BlaBlaCar est absent.** Le vrai concurrent est la gratuité des groupes Facebook (400 000+ membres cumulés).

La carte maîtresse de Machii : son **arsenal sécurité existant** (KYC documentaire, bouton SOS, chat anti-arnaque, notation 4 critères) répond exactement à la plainte n°1 du marché marocain — la confiance. Aucun acteur local n'a fait de la sécurité son positionnement.

**Conditions du GO** : (1) entrer en mise en relation pure **sans commission** (zéro surface d'attaque juridique), (2) conformité CNDP dès le jour 1 (déclaration + autorisations géolocalisation et transfert international + représentant local — sanction jusqu'à 300 000 MAD sinon), (3) monétiser plus tard via une entité marocaine une fois la traction prouvée.

---

## 1. Le marché : pourquoi le Maroc est un terrain de jeu supérieur

### Les chiffres structurels

| Indicateur | Maroc | Tunisie (rappel) |
|---|---|---|
| Population | 36,8 M (RGPH 2024) | ~12 M |
| Motorisation | ~118 véh/1000 hab (faible → forte demande de transport partagé) | comparable |
| Pénétration internet | 112 % (41,5 M abonnés) | élevée aussi |
| Axe phare | Casa–Rabat : ~55 000 véh/jour, autoroute payante la plus fréquentée d'Afrique | Tunis–Sousse |
| Rail | ONCF 55,6 M voyageurs 2025 (record), Al Boraq 5,6 M | SNCFT en difficulté |

Trois fois la population tunisienne, des corridors interurbains denses (Casa–Rabat ~90 km, Casa–Marrakech ~240 km, Tanger–Casa ~340 km, Fès–Casa ~290 km), et une motorisation faible qui condamne la majorité au transport collectif.

### L'équation économique du covoiturage fonctionne

- Al Boraq Tanger–Casa : 149–224 DH l'aller simple (5-7 % d'un SMIG mensuel de ~3 047 DH net) ; le covoiturage observé est à ~100 DH — **moitié prix**.
- Casa–Marrakech : bus 90–130 DH, train 90–150 DH, covoiturage ~80–120 DH avec du porte-à-porte.
- Côté conducteur : Casa–Marrakech ≈ 235 DH de gasoil + 70-80 DH de péage ; 3 passagers à 80-100 DH couvrent le trajet. L'incitation existe des deux côtés.
- Les grands taxis (>50 000 véhicules), alternative historique, offrent une expérience dégradée : 6 passagers entassés, négociation sans compteur, départ quand c'est plein. C'est le maillon faible que le covoiturage attaque naturellement.

### Sensibilité prix extrême — à intégrer au produit

86 % du parc mobile marocain est en prépayé. Le succès d'inDrive (négociation du prix) confirme la centralité culturelle du marchandage. Conséquence produit : afficher des prix bas, éviter toute friction payante à l'inscription, et **assumer le cash**.

---

## 2. Concurrence : un leader fragile, un vide béant

### Pip Pip Yalah — respectable mais prenable

| | |
|---|---|
| Lancement | Groupe Facebook 2013 → app 2019 (Hicham Zouaoui & Otman Harrak, Technopark Casa) |
| Financement | 2 levées, la 2e à 1,5 MDH (~150 k$) — pas de levée récente trouvée |
| Traction réelle | 400 k « membres » revendiqués mais **~80 k actifs** (bio Instagram), 100 k+ téléchargements Play, 4,0/5 |
| Modèle | Commission 10-15 % conducteur + 0-5 % passager via wallet |
| Signal de fragilité | **Sept. 2025 : réintroduction du paiement cash direct** — aveu que le wallet ne passait pas ; le cash direct cannibalise sa propre commission |

Plaintes récurrentes des utilisateurs (Play Store / App Store) : **faux conducteurs**, retraits wallet bloqués (certains parlent de « scam »), support en réponses automatiques, frais jugés élevés, alertes de trajets qui ne notifient jamais.

### Le reste du paysage

- **BlaBlaCar n'opère pas au Maroc** — uniquement des pages SEO et des clones non affiliés. Le standard mondial est absent : l'anomalie qui a permis à Pip Pip Yalah d'exister reste ouverte.
- Acteurs secondaires marginaux : Wsselni Maak (urbain, ~4 300 utilisateurs, option trajets femmes), Peoplin (urbain), YalahM3aya (marginal), Comobila (dormant). Carlo et WeGoTo : introuvables.
- VTC très matures (Careem, inDrive, Yango, Bolt, Heetch + retour d'Uber le 27/11/2025) : la demande d'apps de mobilité est prouvée, marché ride-hailing >75 M$ en 2025.
- **Le vrai concurrent : Facebook.** Des dizaines de groupes gratuits dont l'historique BlablaMaroc, plus la niche diaspora France↔Maroc que personne ne sert en app.

### Le trou dans le marché (croisé avec les forces de Machii)

| Faille du marché | Atout Machii correspondant |
|---|---|
| Faux conducteurs, zéro vérification visible | **KYC documentaire déjà codé** (CIN, permis, carte grise) |
| Sécurité absente du positionnement de tous les acteurs | **Bouton SOS + contacts d'urgence + partage GPS déjà codés** |
| Arnaques au contournement | **Chat anti-bypass déjà codé** |
| Wallet bloqué = confiance détruite | Machii = **mise en relation sans paiement in-app** (cash entre passager et conducteur), zéro argent piégé |
| Alertes cassées | Push notifications fiables déjà en place |
| Niche femmes interurbain | À construire (option « trajets entre femmes ») — demande culturelle forte, zéro acteur interurbain |
| Diaspora France↔Maroc | Segment entier sur groupes FB sans aucun outil |
| Coupe du Monde 2030 (Maroc co-organisateur) | Pic de demande interurbaine massif à horizon visible |

---

## 3. Paiements : le Maroc écrase la Tunisie

### Comparaison frontale

| Critère | Maroc | Tunisie | Verdict |
|---|---|---|---|
| Bancarisation | **58 %** (2024, BAM) | ~36 % (2021, stagnant) | Maroc +22 pts |
| Wallets actifs | **13,7 M** (+32 %/an) | ~0,47 M | **Maroc ×29** |
| Marché acquisition | Ouvert à la concurrence depuis mai 2025 — 11 acquéreurs agréés (fin du monopole CMI) | ClicToPay lent et cher (3-4 %), Konnect correct (1,3 %) | Maroc |
| Encaissement startup | PayZone actif en 48-72 h, NAPS avec API moderne | Possible mais pas de paiement récurrent, contrat bancaire lent | Maroc |
| Restriction de change | Dirham encadré mais flux domestiques libres | **Dinar non convertible** (code 1976), réforme 2026 votée mais suspendue aux circulaires BCT | Maroc |
| Stripe / PayPal | Indisponibles | Indisponibles | Égalité (négatif) |

### Ce que ça change pour Machii

- **Au Maroc, prendre une commission in-app est faisable dès aujourd'hui** (précédent Careem cashless), à condition d'avoir une entité marocaine au registre de commerce + compte bancaire local. C'est une option de monétisation que la Tunisie ne permet pas réellement.
- Mais la culture cash reste dominante (~80 % des paiements e-commerce contournés par le cash). La leçon de l'échec wallet de Pip Pip Yalah : **ne pas imposer le paiement in-app au lancement**. Cash assumé d'abord, monétisation douce ensuite (frais de réservation fixes, premium, partenariats).
- PSP recommandés le jour où on monétise : PayZone (rapide), NAPS (API), CMI (couverture), + réseaux Cash Plus/Wafacash pour les non-bancarisés (42 % des adultes).

---

## 4. Cadre légal : le paradoxe qui favorise Machii

### L'état du droit marocain

- **Aucun texte ne définit, n'autorise ni n'interdit le covoiturage.** (Analyse d'avocate, le360 2022 ; confirmé par l'absence de toute évolution législative à juin 2026.) Le transport **rémunéré** sans agrément reste illégal (dahir 1-63-260 de 1963 + loi 16-99), mais le partage de frais sans profit entre particuliers échappe à cette qualification — c'est la zone grise.
- Précision importante : la « loi 16-13 » mentionnée dans certaines sources n'existe pas — il s'agit de la **loi 16-99**. Les réformes en cours (proposition Mouvement Populaire, nov. 2025, non votée) visent les **VTC**, pas le covoiturage.
- **Le précédent Pip Pip Yalah est en or** : 8+ ans d'exploitation ouverte, incubée au Technopark public, commission prélevée, **autorisation CNDP n° A-406/2020 obtenue** — et zéro poursuite documentée. La CNDP autorise donc explicitement des plateformes de covoiturage.
- Le lobby des grands taxis (~4 000 agréments « grimat », 24 % inexploités) s'est toujours mobilisé contre les **VTC urbains**, jamais contre les plateformes de covoiturage interurbain.

### Le paradoxe Maroc/Tunisie

| | Tunisie | Maroc |
|---|---|---|
| Texte | Loi 2004-33 : **seul le covoiturage gratuit est autorisé** ; partage de frais payant = transport illégal, amende 700 TND (interprétation DG transports, janv. 2025) | **Aucun texte** |
| Pratique | Massive malgré l'interdit | Tolérée, précédent 8 ans |
| Pour une app de mise en relation sans commission | Position « gratuit » obligatoire (ce que Machii fait déjà) | Surface d'attaque quasi nulle |

Le Maroc, sans texte, est paradoxalement **plus permissif en pratique** que la Tunisie qui a un texte restrictif.

### La vraie obligation : la CNDP (loi 09-08)

C'est LE sujet de conformité, applicable dès que l'app collecte des données de résidents marocains, peu importe où est la société :
1. **Déclaration préalable** à la CNDP (données ordinaires)
2. **Autorisation préalable** pour la **géolocalisation** (cœur de Machii) et les données de paiement
3. **Autorisation de transfert international** si les serveurs sont hors Maroc (Supabase UE = transfert international)
4. **Représentant local** à désigner (avocat ou consultant marocain suffit)

Sanctions : jusqu'à 300 000 MAD + 6 mois d'emprisonnement, responsabilité personnelle des fondateurs possible, campagnes de contrôle CNDP actives en 2025.

### Risque terrain résiduel

Un conducteur contrôlé avec 3 passagers payants pourrait être assimilé à un « khattaf » (transport clandestin : amende 500-1 000 DH + fourrière). **Aucun cas visant un covoitureur de plateforme n'a été trouvé dans la presse** — la répression documentée vise les khattafas au racolage et les VTC. Mitigation produit : plafonds de contribution par km dans les CGU, interdiction des profils professionnels, messaging « partage de frais » martelé.

---

## 5. Plan d'action recommandé

### Phase 0 — Préparation technique (1-2 semaines de dev)

L'app est déjà multi-rôle et le backend est prêt. Adaptations :
- **Villes marocaines** dans `cities.ts` (Casablanca, Rabat, Marrakech, Tanger, Fès, Agadir, Meknès, Oujda, Kénitra, Tétouan) avec coordonnées PostGIS
- **Préfixe téléphone +212** à côté du +216 (sélecteur de pays à l'inscription)
- **Devise MAD** (affichage "DH" au lieu de "DT") selon le pays du trajet
- **Filtrage pays** : un trajet marocain ne doit pas apparaître dans une recherche tunisienne
- Textes : le français convient aux deux marchés (darija = V2)
- CGU Maroc : plafond de contribution par km, interdiction véhicules pros, positionnement « partage de frais »

### Phase 1 — Conformité + soft launch (mois 1-2)

- **Dossier CNDP** : déclaration + autorisation géolocalisation + autorisation transfert international (serveurs Supabase UE) + désignation d'un représentant local (avocat marocain, budget ~5-15 k MAD). C'est le seul vrai coût d'entrée.
- Lancement **sans commission** (modèle actuel Machii) = zéro surface d'attaque + arme contre les 10-15 % de Pip Pip Yalah
- Corridors de lancement : **Casa–Rabat** (volume), **Casa–Marrakech** (distance idéale covoiturage), **Tanger–Casa** (l'axe où le covoiturage bat le TGV 2×)
- Acquisition : cibler les membres des groupes Facebook de covoiturage (là où vivent les usagers), angle « l'app qui vérifie les conducteurs » + « 0 % de commission »

### Phase 2 — Différenciation (mois 3-6)

- **Option « trajets entre femmes »** interurbain (première au Maroc)
- Niche **diaspora France↔Maroc** (trajets ferry + colis) si traction
- Mesurer : trajets publiés/jour, taux de matching, NPS vs Pip Pip Yalah

### Phase 3 — Monétisation (après traction prouvée)

- Création d'une **SARL marocaine** (ou succursale) + compte bancaire local
- Frais de réservation fixes côté passager (pas de wallet conducteur — la leçon Pip Pip Yalah) via PayZone/NAPS
- Valider avec un avocat d'affaires marocain : régime Office des Changes pour le rapatriement vers la Tunisie (point non vérifiable en ligne)

### Jalons de décision

| Jalon | Critère de poursuite |
|---|---|
| Fin phase 1 (M+2) | ≥ 50 trajets publiés/semaine sur les 3 corridors |
| Fin phase 2 (M+6) | ≥ 500 utilisateurs actifs/mois, bouche-à-oreille mesurable |
| Phase 3 | Seulement si M+6 atteint — sinon pivot niche (femmes/diaspora) ou stand-by |

---

## 6. Risques et données à valider terrain

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Réglementation soudaine du covoiturage | Faible (en discussion depuis 2023, rien de voté, les projets visent les VTC) | Élevé | Positionnement strict partage de frais ; veille législative |
| Gratuité Facebook aspire les users | Élevée | Moyen | 0 % commission + sécurité comme différenciateurs réels |
| Effet réseau Pip Pip Yalah | Moyenne | Moyen | Ne pas attaquer frontalement : niches + corridors + « app qui vérifie » |
| Requalification khattaf d'un conducteur | Faible (aucun cas documenté) | Moyen | Plafonds CGU, éducation conducteurs in-app |
| Sanction CNDP | Élevée si ignorée | Élevé | Dossier CNDP AVANT le lancement — non négociable |
| Assurance conteste une garantie après accident | Faible (aucun litige publié) | Élevé | Information in-app, partenariat assureur en V2 |

**À valider sur le terrain (introuvable en ligne)** : prix par place exacts des grands taxis par axe, tailles actuelles des groupes Facebook, chiffres récents de Pip Pip Yalah, exigences exactes Office des Changes pour l'encaissement transfrontalier.

---

## 7. Conclusion

Le Maroc offre à Machii un marché **3× plus grand**, **mieux équipé en paiements**, **paradoxalement plus sûr juridiquement** pour le modèle exact de Machii (mise en relation gratuite), face à un unique concurrent dont les faiblesses (confiance, wallet, support) correspondent trait pour trait aux forces déjà codées dans l'app (KYC, SOS, anti-bypass, notation).

Le coût d'entrée est faible : ~2 semaines de dev + un dossier CNDP. Le pire scénario est un échec d'acquisition à coût marginal ; le meilleur est une position de challenger sécurisé sur un marché que BlaBlaCar a ignoré, avec la Coupe du Monde 2030 en ligne de mire.

**Recommandation : GO en phase 0+1 immédiatement, jalons de décision aux mois 2 et 6.**
