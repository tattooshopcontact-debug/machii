# E — Intégrations de paiement concrètes au Maroc (app covoiturage React Native)

> **Date** : 2026-06-11 · **Périmètre** : encaissement passagers + reversement conducteurs (marketplace)
> **Méthodologie & limite importante** : 22 recherches web ciblées. **L'outil WebFetch (et tout fetch direct curl/PowerShell) était bloqué par les permissions de l'environnement** : les contenus des pages officielles (naps.ma, developers.payzone.ma, cmi.co.ma, cashplus.ma) proviennent des extraits indexés par le moteur de recherche, pas d'une lecture brute des pages. Tous les chiffres « sur devis » ou issus de comparatifs tiers sont signalés et à confirmer commercialement.

---

## 1. NAPS (naps.ma)

NAPS est le premier opérateur monétique indépendant (non bancaire) du Maroc — c'est d'ailleurs NAPS qui a saisi le [Conseil de la concurrence contre le CMI](https://conseil-concurrence.ma/communique-concernant-letat-davancement-de-la-saisine-emanant-de-la-societe-naps-sa-concernant-les-pratiques-mises-en-oeuvre-par-le-cmi-dans-le-marche-du-paiement-electronique-par-ca/), ce qui a abouti à l'ouverture du marché de l'acquisition.

### Technique (passerelle « NAPS ePay »)
- Gateway certifiée Visa/Mastercard, **PCI DSS**, **3-D Secure** (avec 3DS « allégé »/frictionless pour les clients déjà authentifiés) — [naps.ma/paiements-en-ligne](https://naps.ma/paiements-en-ligne/).
- Fonctionnalités annoncées : **tokenisation de carte (Card On File), API de remboursement (refund), API de capture**, paiement récurrent, paiement en n fois — [plaquette NAPS ePay (Scribd)](https://www.scribd.com/document/835839496/Naps-ePay-1).
- **Intégration possible directement dans un site OU une application mobile, sans redirection vers une page externe** ; les grands comptes utilisent une « low-level API » qui exige des certifications PCI DSS côté marchand — [Médias24, coulisses du paiement en ligne](https://medias24.com/2022/06/30/e-commerce-les-coulisses-du-paiement-en-ligne/).
- ❌ **Aucun portail développeur public trouvé** (pas d'équivalent de developers.payzone.ma), aucun SDK mobile public, aucun repo GitHub officiel. La documentation API est remise après signature — c'est un point faible vs Payzone.
- Webhooks : non documentés publiquement (**introuvable** ; à demander).

### Onboarding
- Dossier type : **Registre de Commerce (RC) + CIN + RIB** suffisent (analogue ouverture compte pro) — [naps.ma/tpe](https://naps.ma/tpe/). Un RC marocain actif est donc requis.
- **Activation sous 48 h ouvrées** après acceptation du dossier ; pour un site e-commerce PME standard, mise en œuvre annoncée en **24 h** après acceptation si pas de contrainte technique — [naps.ma](https://naps.ma/terminal-de-paiement-electronique-paiement-sur-tpe-maroc/).

### Tarifs (publics partiellement, sinon devis)
- Commission **dégressive selon CA** ; exemple officiel : sur 100 DH, **98,32 DH reversés au commerçant** (1,68 DH de frais répartis entre prestataires — exemple TPE/proximité) — [naps.ma/comment-fonctionnent-les-frais-de-traitement-de-naps](https://naps.ma/comment-fonctionnent-les-frais-de-traitement-de-naps/).
- Offres e-commerce (plaquette commerciale, **à confirmer sur devis**) — [Naps ePay (Scribd)](https://www.scribd.com/document/835839496/Naps-ePay-1) :
  - **e-Go** : commission **3 %**, abonnement annuel **6 900 DH** + frais de mise en service ; API standard + page de paiement standard.
  - **e-Premium** : commission **3 %**, abonnement annuel **29 900 DH** ; Card On File, récurrent, paiement n fois, page personnalisée.
- Retours de devs marocains spécifiques à l'API NAPS : **introuvables** (les comparatifs dev se concentrent sur CMI/Payzone/CashPlus).

---

## 2. PayZone (payzone.ma)

Le PSP marocain le plus « developer-friendly » : seul acteur avec un **portail développeur public** — [developers.payzone.ma](https://developers.payzone.ma/).

### Technique
- **Payment Gateway API** : API **REST server-to-server** ; POST avec corps **JSON**, GET avec paramètres URL ; convention camelCase ; **authentification HTTP Basic** (originator ID + mot de passe fournis à l'inscription) — [developers.payzone.ma/gateway](https://developers.payzone.ma/gateway).
- **Payment Page API** : page de paiement hébergée (option la plus simple pour mobile via WebView) — [developers.payzone.ma/PaymentPageAPI](https://developers.payzone.ma/PaymentPageAPI).
- Paiement récurrent supporté nativement ; **MAD uniquement** — [clarodigi.com](https://clarodigi.com/blog/online-payment-morocco-comparison/).
- ❌ **Pas de SDK mobile natif (iOS/Android/React Native) trouvé** → intégration mobile = API server-to-server + WebView/page hébergée.
- Webhooks/callbacks : non détaillés dans les extraits publics (**à confirmer** ; support intégration : support@vpscorp.ma — Payzone est opéré par VPS Corp).
- ❌ **Pas d'API de payout/disbursement trouvée** dans la doc publique.

### Onboarding
- **Pas de frais d'intégration ni de frais d'adhésion** ; validation d'ouverture de compte sous **~2 semaines** par le service commercial — [payzone.ma/faqs](https://payzone.ma/faqs/) ; des comparatifs citent une activation possible en **48–72 h** — [clarodigi.com](https://clarodigi.com/blog/online-payment-morocco-comparison/).
- Contact : sales@payzone.ma / +212 5 22 20 61 33.

### Tarifs (comparatifs tiers, grille officielle sur devis)
- Commission **2,0 % à 3,5 %** selon volume/secteur, **sans frais fixe par transaction** ; **mensuel 300–800 MAD** ; plan de démarrage dès **300 MAD/mois tout compris** jusqu'à un seuil de volume ; tarifs dégressifs — [azulweb.ma](https://azulweb.ma/en/accept-online-payments-morocco/), [digitoyou.com](https://digitoyou.com/blog/paiement-en-ligne-maroc-cmi-stripe-2026/).

### Clients connus
- **Glovo Maroc** encaisse via une infrastructure liée à Payzone/VPS ([glovo.payexpress.ma](https://glovo.payexpress.ma/)). Autres références nominatives : **non publiées** sur le site (introuvable).

---

## 3. CMI (cmi.co.ma)

Le [Centre Monétique Interbancaire](https://www.cmi.co.ma/fr/solutions-paiement-ecommerce) reste l'acquéreur historique (~70 % des cartes marocaines actives selon [digitoyou](https://digitoyou.com/blog/paiement-en-ligne-maroc-cmi-stripe-2026/)). Son monopole de fait a pris fin : les **établissements de paiement et filiales bancaires sont autorisés à acquérir depuis le 1er mai 2025** — [maroc.ma](https://www.maroc.ma/fr/actualites/paiement-electronique-les-etablissements-de-paiement-et-les-filiales-des-banques-autorises-operer-des).

### Technique
- Modèle = **page de paiement hébergée (redirection)** : on POSTe `clientid`, `storekey` (hash), `okUrl`, `failUrl`, `CallbackURL` vers la passerelle, le client paie chez CMI, retour + callback serveur. C'est exactement ce qu'implémentent les packages communautaires : [cmi-payment-php (mehdirochdi)](https://github.com/mehdirochdi/cmi-payment-php), [cmi-node (aitmiloud)](https://github.com/aitmiloud/cmi-node), [combindma/cmi-payment (Laravel)](https://packagist.org/packages/combindma/cmi-payment), [CmiPayBundle (Symfony)](https://github.com/CmiEcom/CmiPayBundle).
- **3-D Secure obligatoire** sur toutes les transactions — [anfadigital.com](https://anfadigital.com/paiement-en-ligne-par-carte-bancaire-au-maroc-cmi/).
- **Documentation non publique** : kit d'intégration + environnement de test remis après signature du contrat (avec exemples PHP/Node/Python) — [livret e-commerce CMI (PDF officiel)](https://www.cmi.co.ma/sites/default/files/cmi_solutions_livret_e-com.pdf), [contrat d'adhésion type (PDF)](https://www.postenumerique.ma/wps/wcm/connect/bf6f0e13-3779-4264-9d21-79ce51b29ed0/Contrat_CMI_E-Commerce_actualis%C3%A9.pdf?MOD=AJPERES).
- **Mobile : pas de SDK natif** ; la pratique établie au Maroc (y compris par les agences locales) = **WebView React Native** chargeant la page CMI + postMessage pour remonter le statut — [flexiapps.net](https://flexiapps.net/ma/agence-developpement-react-native-ios-android/), [premieroctet.com](https://www.premieroctet.com/blog/webview-react-native). Solutions annexes : PayByMail / PayByForm (liens de paiement).

### Onboarding
- Passage **obligatoire par une banque acquéreuse** (Attijariwafa, BMCE, CIH, BP…) : RIB, extrait RC, statuts, attestation bancaire ; **délai 2 à 6 semaines** ; parfois **dépôt de garantie 5 000–15 000 DH** exigé par la banque — [digitoyou.com](https://digitoyou.com/blog/paiement-en-ligne-maroc-cmi-stripe-2026/), [clarodigi.com](https://clarodigi.com/blog/online-payment-morocco-comparison/).

### Tarifs (via banque, négociables)
- Commission **1,5–2,5 % HT** + **~1,50 DH fixe/transaction** ; frais d'installation **500–1 500 MAD** (jusqu'à 2 500–4 000 MAD d'intégration selon [digitoyou](https://digitoyou.com/blog/paiement-en-ligne-maroc-cmi-stripe-2026/)) ; mensuel **0–200 MAD** (selon banque) — certains comparatifs citaient 2,2–3,5 % avant la baisse, négociable ~1,8 % au-delà de 500 k MAD/mois — [azulweb.ma](https://azulweb.ma/en/accept-online-payments-morocco/).
- **Versement marchand : J+1 à J+3 ouvrés** — [azulweb.ma](https://azulweb.ma/en/accept-online-payments-morocco/).
- Contexte : Bank Al-Maghrib a **plafonné l'interchange domestique à 0,65 %** au 01/10/2024, ce qui a tiré les commissions vers le bas — [Médias24](https://medias24.com/2024/10/12/paiement-electronique-la-baisse-des-frais-dinterchange-diversement-repercutee-par-les-operateurs-monetiques/), [le360](https://fr.le360.ma/economie/paiement-par-carte-le-cmi-reduit-le-taux-des-commissions-versees-par-les-commercants_2A4MZU73QRESTLCZEETMWKXOPM/).

---

## 4. Reverser de l'argent aux conducteurs (disbursement) — LE point critique

⚠️ **Cadre légal d'abord** : encaisser l'argent des passagers « pour le compte » des conducteurs = service de paiement régulé par la **loi 103-12** (catégorie « établissements de paiement », circulaire **7/W/2016** modifiée par la **circulaire 2/W/2024** du 20/12/2024, agrément délivré par le Wali de BAM sous 120 jours) — [bkam.ma](https://www.bkam.ma/Trouvez-l-information-concernant/Reglementation/Activite-des-etablissements-de-credit-et-assimiles/Conditions-d-exercice-agrement), [recueil des textes BAM (PDF)](https://cmmb.ma/wp-content/uploads/2024/11/Recueil-des-textes-legislatifs-et-reglementaires-de-BAM_VF.pdf). Une startup ne demande pas cet agrément : elle **s'adosse à un établissement de paiement existant** ou structure le flux en « commission » (modèle Pip Pip Yalah, cf. §6).

Options concrètes :

| Option | Comment ça marche | API ? | Source |
|---|---|---|---|
| **Cash Plus Dispatch** | Paiements de masse instantanés vers des bénéficiaires (virements groupés ou unitaires via plateforme web, suivi temps réel) ; retrait cash dans **6 000+ agences** | Plateforme web confirmée ; API de masse **non documentée publiquement** (partenariat sur devis) | [cashplus.ma/cash-plus-dispatch](https://www.cashplus.ma/services-professionnels/cash-plus-dispatch) |
| **Cash Plus Payment** (encaissement) | Le passager paie **en cash en agence** avec un token unique par transaction ; notification temps réel au marchand ; **« intégration API facile »** annoncée | Oui (API d'encaissement), specs sur demande via formulaire partenariat | [cashplus.ma/cash-plus-payment](https://www.cashplus.ma/services-professionnels/cash-plus-payment), [page B2B](https://www.cashplus.ma/b2b/services/cash-plus-payment) |
| **Wafacash entreprise** | Solutions de paiement de masse « au siège » à tarifs préférentiels, réseau 4 000 agences (groupe Attijariwafa) | **Aucune API publique trouvée** | [wafacash.com/entreprise](https://www.wafacash.com/entreprise) |
| **Virement de masse bancaire** | CIH : « gestion des décaissements » par **fichiers de virements de masse** + **MT101** ; Banque Populaire : produit « virement de masse » ; AWB : virement instantané **17,60 DH HT/virement** | Échange de **fichiers** sécurisés, pas d'API REST ouverte (open banking marocain encore embryonnaire) | [cihbank.ma](http://www.cihbank.ma/entreprise/Entreprises/Paiement-Cash-Management/Gestion-des-decaissements), [BP](https://entreprise.groupebcp.com/fr/Pages/virement-masse.aspx), [ipomaroc.com](https://ipomaroc.com/virement-instantane-maroc-2026-tarifs-banques/) |
| **inwi money (wallet)** | Wallet mobile, paiement marchand par n° de téléphone/QR ; **page partenaire dédiée inDrive** (recharge/paiement lié à inDrive) — preuve qu'un VTC l'utilise déjà | API marchand non publiée ; partenariats au cas par cas | [inwimoney.ma/fr/paiement-marchand](https://inwimoney.ma/fr/paiement-marchand), [inwimoney.ma/fr/indrive](https://inwimoney.ma/fr/indrive) |
| **Orange Money Maroc** | L'API « OM Web Payment » d'Orange Developer (dépôts, retraits, **paiements de masse**) **ne couvre PAS le Maroc** (Mali, Cameroun, Sénégal, Madagascar, Botswana, Guinée, Côte d'Ivoire) | ❌ pas au Maroc | [developer.orange.com/apis/om-webpay](https://developer.orange.com/apis/om-webpay) |
| **Autres réseaux cash** | M2T/Chaabi Pay (groupe BCP), Damane Cash (Bank of Africa, lance l'acquisition), Barid Cash : réseaux d'agences, pas d'API publique trouvée | ❌ sur devis | [fnh.ma (Damane Cash)](https://fnh.ma/article/actualites-marocaines/damane-cash-paiement-maroc), [infomagazine (M2T)](https://www.infomagazine.ma/maroc/m2t-recompensee-aux-apide-awards-2026-pour-chaabi-pay-et-chaabi-payment-13976-2026/) |

⚠️ Faux ami : les résultats « Cashplus API » sur [apitracker.io](https://apitracker.io/a/cashplus) / openbankingtracker concernent la **fintech britannique Cashplus**, pas le Cash Plus marocain.

**Verdict** : aucun acteur marocain n'offre aujourd'hui une **API de payout self-service documentée publiquement**. Le chemin réaliste : (a) modèle wallet interne + retrait via **Cash Plus Dispatch** en batch (devis), ou (b) virements de masse bancaires par fichier hebdomadaire, ou (c) éviter le payout (cf. §6).

---

## 5. PSP internationaux / marketplace (escrow, split payments)

- **Stripe / Stripe Connect** : ❌ **indisponible au Maroc** — impossible d'ouvrir un compte marocain ou d'être réglé sur un compte bancaire marocain ; le contournement Stripe Atlas (entité US, ~500 USD) ne sert que les paiements internationaux et **ne résout ni les cartes locales MAD ni le payout des conducteurs marocains** — [charibaas.com](https://www.charibaas.com/fr/blog/stripe-maroc-2026-alternative), [clarodigi.com](https://clarodigi.com/blog/stripe-connect-moroccan-marketplace-integration-guide-2026/).
- **Lemonway** : Europe uniquement (FR, DE, IT, PT, ES) — ❌ pas de couverture Maroc — [lemonway.com](https://www.lemonway.com/en).
- **PayTabs** (orchestrateur saoudien) : ✅ **présent au Maroc** (arrivée annoncée fin 2025, bureau/équipe couvrant le Maroc, support du **MAD**) ; propose dans la région des fonctions marketplace/split — détails et tarifs Maroc **sur devis uniquement** — [ai.paytabs.com/en/morocco](https://ai.paytabs.com/en/morocco/), [paytabs.com](https://paytabs.com/en/), [annonce Instagram](https://www.instagram.com/p/DO-zAT5CLuy/).
- **HyperPay** (Riyad) : étendu à la région MENA dont le Maroc — couverture exacte à valider — [clarodigi.com](https://clarodigi.com/blog/online-payment-morocco-comparison/).
- **HPS** (Maroc, PowerCARD) : éditeur de technologie monétique pour banques/switches, **pas un PSP marchand** auquel une app peut souscrire directement.
- **ChariBaaS / Chari Pay** : gateway marocaine PCI-DSS avec 3DS, **Maroc Pay** et **API REST modernes**, positionnée pour « fintechs et plateformes » — le candidat local le plus proche d'un PSP de plateforme — [baas.ma](https://www.baas.ma/en/blog/passerelle-paiement-maroc-guide).
- **Conclusion split/escrow** : il n'existe **aucun équivalent « Stripe Connect » clé en main au Maroc**. Le split se fait dans votre backend (compte séquestre/commission), avec les contraintes réglementaires BAM du §4 — confirmé par [clarodigi](https://clarodigi.com/blog/stripe-connect-moroccan-marketplace-integration-guide-2026/) et [void.ma](https://void.ma/en/secteurs/marketplace-maroc/).

---

## 6. Ce que font Careem / inDrive / Yango (et Pip Pip Yalah) au Maroc

- **inDrive** : cash, carte ou wallet selon la ville — [aide inDrive Maroc](https://indrive.com/fr-ma/help/passengers/what-are-the-payment-methods-on-indrive) ; **partenariat avec inwi money au Maroc** (page dédiée) — [inwimoney.ma/fr/indrive](https://inwimoney.ma/fr/indrive) ; a lancé inDrive.Money (crédit conducteurs) en 2024 — [walaw.press](https://fr.walaw.press/articles/indrive_l_application_de_vtc_qui_seduit_le_maroc_et_le_monde_en_2024/GMLLQQGXPQRS).
- **Careem** : paiement cashless in-app, **Careem Pay disponible au Maroc** — [paisabazaar.ae](https://www.paisabazaar.ae/bank-accounts/articles/careem-pay/) ; à l'échelle groupe, top-ups wallet via **Checkout.com + Mastercard Send** (UAE) — [mastercard.com](https://www.mastercard.com/news/eemea/en/newsroom/press-releases/en/2023/august/mastercard-and-checkout-com-partner-to-enable-instant-wallet-top-ups-for-careem/) ; payout « captains » en minutes via **Paysky/Yalla** (Égypte) — [paysky.io](https://paysky.io/careem-partners-with-paysky-to-enable-instant-payments-for-captains-through-yalla/). Le processeur exact utilisé au Maroc n'est **pas public**.
- **Yango** : cash + carte (bascule cash→carte possible en course) — [support Yango](https://yango.com/fr_int/support/taxi-all-app-yango/how-to-order/payment-method.html) ; wallet **Yango Pay** lancé en Afrique (Côte d'Ivoire d'abord), présence Maroc non confirmée — [travelnet.fr](https://www.travelnet.fr/focus/2424-yango-lance-yango-pay-paiement-sans-numeraire-pour-vtc-en-afrique).
- **Pip Pip Yalah** (covoiturage marocain = comparable direct) : paiement en ligne **sécurisé par le CMI** + cash ; commission **10–15 % côté conducteur + 0–5 % côté passager** ; quand le passager paie cash, la **commission est déduite du wallet du conducteur dans l'app** (le conducteur recharge son wallet) — [CGU PipPipYalah](https://pippipyalah.com/pages/les-conditions-generales-dutilisation-mobile), [agenceecofin](https://www.agenceecofin.com/entreprendre/1407-99728-pip-pip-yalah-l-ambitieux-service-de-covoiturage-marocain). **C'est le modèle qui évite le problème du payout** : l'argent circule passager→conducteur en direct, la plateforme n'encaisse que sa commission.

---

## 7. Grille comparative finale + marge sur un trajet 100 DH (commission app 10 %)

Hypothèse : l'app encaisse 100 DH par carte, garde 10 DH, doit reverser 90 DH au conducteur. Les frais PSP s'appliquent sur les **100 DH encaissés**.

| PSP | Setup | Commission | Frais fixe/tx | Mensuel/abonnement | Versement | Exigences | Coût PSP sur 100 DH | **Marge nette sur 10 DH** (hors fixes & payout) |
|---|---|---|---|---|---|---|---|---|
| **CMI** (via banque) | 500–1 500 MAD (jusqu'à 2 500–4 000 intégration) + caution éventuelle 5 000–15 000 DH | 1,5–2,5 % | ~1,50 DH | 0–200 MAD | **J+1 à J+3** | RC, RIB, statuts, via banque ; 2–6 sem. | 3,00–4,00 DH | **6,00–7,00 DH** |
| **Payzone** | 0 DH | 2,0–3,5 % | 0 | 300–800 MAD | non publié (à confirmer) | dossier société ; ~2 sem. (parfois 48–72 h) | 2,00–3,50 DH | **6,50–8,00 DH** |
| **NAPS e-Go** | frais de mise en service (devis) | 3 % | non publié | 6 900 DH/an (≈575 DH/mois) | non publié | RC + CIN + RIB ; 24–48 h après acceptation | 3,00 DH | **7,00 DH** |
| **NAPS e-Premium** | devis | 3 % | non publié | 29 900 DH/an | non publié | idem | 3,00 DH | 7,00 DH (justifié seulement à gros volume pour Card On File) |
| **PayTabs Maroc** | devis | devis (MENA typiquement ~2,5–3 % + fixe) | devis | devis | devis | entité locale | ~2,50–3,00 DH (estim.) | ~7,00–7,50 DH (estim.) |
| **Cash Plus Payment** (cash en agence) | devis | devis | devis | devis | n/a | partenariat | inconnu | inconnu |
| **Modèle Pip Pip Yalah** (cash direct + wallet conducteur) | ~0 | frais PSP uniquement sur la **recharge wallet** du conducteur (~2–3 % de la commission) | — | — | instantané (pas de payout) | aucun flux pour compte de tiers | ~0,20–0,30 DH | **≈9,70 DH** |

**À soustraire ensuite, le coût du payout** (si vous encaissez 100 % du trajet) : virement instantané AWB 17,60 DH HT/virement (ruineux à l'unité → batcher en hebdo via virement de masse, coût par ligne sur devis bancaire) ou Cash Plus Dispatch (devis). Sur un payout hebdo de ~20 trajets, l'impact retombe à ~0,1–0,9 DH/trajet.
Sources chiffrées : [azulweb.ma](https://azulweb.ma/en/accept-online-payments-morocco/), [digitoyou.com](https://digitoyou.com/blog/paiement-en-ligne-maroc-cmi-stripe-2026/), [naps.ma](https://naps.ma/comment-fonctionnent-les-frais-de-traitement-de-naps/), [Naps ePay (Scribd)](https://www.scribd.com/document/835839496/Naps-ePay-1), [ipomaroc.com](https://ipomaroc.com/virement-instantane-maroc-2026-tarifs-banques/), [CGU PipPipYalah](https://pippipyalah.com/pages/les-conditions-generales-dutilisation-mobile).

### Recommandation d'architecture (covoiturage)
1. **Phase 1 (lancement)** : paiement **cash passager→conducteur** + **wallet conducteur** débité de la commission (modèle Pip Pip Yalah). Recharge wallet par carte via **Payzone** (Payment Page en WebView React Native — pas de SDK natif chez aucun acteur local) ou CMI. Marge ~9,7/10 DH, zéro problème réglementaire de payout.
2. **Phase 2** : encaissement in-app optionnel (CMI ou Payzone) avec reversement hebdo par **virement de masse bancaire** ou **Cash Plus Dispatch** — négocier les devis et valider le montage avec un conseil au regard de la loi 103-12 / circulaire 2/W/2024.
3. À surveiller : **PayTabs Maroc** et **Chari Pay** pour des fonctions marketplace, et l'ouverture post-monopole CMI (acquéreurs établissements de paiement depuis mai 2025) qui devrait faire baisser les commissions.

---

### Données explicitement introuvables / sur devis
- Documentation API publique NAPS (inexistante en ligne) ; webhooks NAPS et Payzone (non détaillés publiquement) ; délais de versement Payzone et NAPS ; grille officielle PayTabs Maroc ; specs et tarifs API Cash Plus (Dispatch & Payment) ; API Wafacash ; API marchand inwi money ; processeur exact de Careem/Yango au Maroc ; tout SDK mobile natif (aucun PSP marocain n'en publie).
