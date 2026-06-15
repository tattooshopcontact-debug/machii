# Machii Maroc — Dossier création de structure (auto-entrepreneur)

> But : obtenir une structure légale + un ICE pour pouvoir encaisser la commission Machii au Maroc (modèle wallet conducteur, cf. CAHIER_DES_CHARGES.md Bloc B / M4).
> Profil : Faouez est **marocain avec un compte bancaire au Maroc** → le statut **auto-entrepreneur** est la voie la plus simple et la moins chère.
> Sources en bas de page. ⚠️ Confirmer les chiffres exacts sur le portail officiel / avec un comptable avant de signer.

---

## 1. Pourquoi auto-entrepreneur (et pas SARL tout de suite)

| Critère | Auto-entrepreneur | SARL |
|---|---|---|
| Coût création | ~gratuit | quelques milliers de DH |
| Délai | 24-72 h | semaines |
| Impôt | **1 % du CA** (services) | IS classique + compta |
| TVA | **dispensé** | assujetti |
| Taxe professionnelle | **exonéré 5 ans** | due |
| Comptabilité | ultra-simplifiée | bilan, expert-comptable |
| Donne un **ICE** (pour brancher un PSP) | ✅ oui | ✅ oui |

→ On démarre en **auto-entrepreneur**. On passe en SARL seulement si on dépasse le plafond (voir §3).

---

## 2. Inscription — étapes concrètes

**En ligne** sur le portail officiel **`ae.gov.ma`** (ou en agence **Barid Al-Maghrib**) :

1. Aller sur `ae.gov.ma` → « S'inscrire ».
2. Renseigner les infos perso : **CIN**, adresse, téléphone.
3. **Choisir l'activité** dans la liste éligible → prendre une activité de **prestation de services** type *« services informatiques / intermédiation numérique / mise en relation »* (c'est ça notre métier : on vend un service techno de mise en relation, PAS du transport).
4. Téléverser les documents : **photo CIN recto/verso**, justificatif de domicile.
5. Valider → réception du **numéro ICE** + **carte d'auto-entrepreneur**.
6. Délai : **24 à 72 h**.

📌 L'ICE devra figurer sur toutes les factures/reçus de commission.

---

## 3. Fiscalité & plafonds (régime services)

- **Impôt : 1 % du chiffre d'affaires encaissé** (prestations de services).
- **Plafond : 200 000 DH / an** en services (au-delà 2 années de suite → radiation auto → passer en SARL).
- **Dispense de TVA**, **exonération de taxe professionnelle 5 ans**.
- ⚠️ **Règle des 80 000 DH par client** : si le CA annuel avec **un même client** dépasse 80 000 DH, le surplus passe en retenue à la source. 
  → **Pas un problème pour nous** : nos « clients » sont des centaines de conducteurs qui paient chacun de petites commissions. Aucun ne dépassera 80 000 DH.
- **CNSS/AMO** : une cotisation sociale est désormais demandée aux auto-entrepreneurs (réforme récente) — **à confirmer le montant** auprès de la CNSS.

**Dimensionnement** : à 1 % d'impôt, 200 000 DH de commissions encaissées = 2 000 DH d'impôt. Le plafond de 200 000 DH/an de commission = largement de quoi tourner sur tout le pilote et la première phase.

---

## 4. Encaisser l'argent (PSP) — après l'ICE

Ordre recommandé :

1. **Démarrage (pilote, 0 frais)** : recharge **manuelle** — le conducteur verse sur **ton compte bancaire** (virement / CashPlus / mobile money), tu crédites son wallet à la main dans le back-office. Aucune intégration requise.
2. **PayZone** — **le plus accessible** : inscription **directe en ligne sans banque sponsor**, activation en **48-72 h**. Idéal pour un auto-entrepreneur, sert de pont en attendant CMI. → c'est par là qu'on automatise la recharge par carte.
3. **CashPlus** — API e-commerce + réseau d'agents cash (utile car marché très cash). Bon complément pour recharge en espèces dans les agences.
4. **CMI** — la passerelle cartes historique, mais exige une **banque sponsor** (ton compte pro peut servir). À viser plus tard pour les frais les plus bas à volume élevé.

💡 Rappel légal : le PSP ne sert qu'à **recharger le wallet du conducteur**. La course reste payée **en cash, en main**, passager → conducteur. On ne touche jamais l'argent de la course → on reste plateforme techno, pas transporteur.

---

## 5. Checklist d'action

- [ ] S'inscrire sur `ae.gov.ma` (CIN + justif domicile + photos) → activité « services / intermédiation numérique »
- [ ] Récupérer **ICE** + carte auto-entrepreneur (24-72 h)
- [ ] Vérifier la cotisation **CNSS/AMO** applicable (montant)
- [ ] Ouvrir/identifier le **compte bancaire** qui reçoit les recharges (déjà OK)
- [ ] (pilote) Lancer la recharge **manuelle** sur ce compte
- [ ] Créer un compte **PayZone** (48-72 h) pour automatiser la recharge par carte
- [ ] Plus tard : **CashPlus** (cash) + **CMI** (volume)
- [ ] Déclarer le traitement de données à la **CNDP** (cf. cahier, déjà prévu)

---

## Sources
- [Guide auto-entrepreneur Maroc 2026 — LMOUKAWIL](https://www.lmoukawil.ma/fr/articles/guide-auto-entrepreneur-maroc-2026/)
- [Inscription RNAE pas-à-pas — Fatoura Plus](https://fatouraplus.com/guide-auto-entrepreneur/inscription-auto-entrepreneur-maroc/)
- [Régime fiscal auto-entrepreneur 2025 — CHY.ma](https://chy.ma/regime-fiscal-de-lauto-entrepreneur-2025/)
- [Plafond 80 000 DH & TVA — SNRT News](https://snrtnews.com/fr/article/auto-entrepreneurs-au-maroc-plafond-80000-dh-tva-et-retards-de-paiement-etat-des-lieux-et)
- [Paiement en ligne Maroc : CMI / PayZone / CashPlus — Sinesi](https://www.sinesi.net/blog/paiement-en-ligne-au-maroc-cmi-cashplus-ou-payzone-le-comparatif)
- [Accept online payments Morocco 2026 — AzulWeb](https://azulweb.ma/en/accept-online-payments-morocco/)
