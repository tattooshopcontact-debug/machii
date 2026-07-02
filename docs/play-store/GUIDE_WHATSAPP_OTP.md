# Guide — Activer les vrais codes WhatsApp (OTP) pour Machii

> Objectif : remplacer le mode démo (n'importe quel code à 4 chiffres) par un vrai
> code envoyé sur le WhatsApp de l'utilisateur. Solution = **WhatsApp Cloud API** de Meta.
> Le serveur sait DÉJÀ générer/vérifier les codes (RPC `send_whatsapp_otp` /
> `verify_whatsapp_otp` / `otp_login`). Il ne manque QUE le branchement Meta + la
> désactivation du mode démo.

## Ce qu'il faut réunir (côté Faouez)

1. **Un numéro de téléphone dédié** à Machii (l'expéditeur des codes).
   - ⚠️ Ce numéro ne doit PAS avoir de compte WhatsApp *personnel* actif (sinon il
     faut le supprimer d'abord dans WhatsApp → Réglages → Compte → Supprimer mon compte).
   - Prévu au cadrage : `+33 7 49 86 53 65`. Un numéro tunisien +216 marche aussi.
   - Il faut pouvoir y recevoir un SMS/appel de vérification une fois.
2. **Un compte Meta Business** (business.facebook.com) — gratuit. Peut être créé avec
   le compte Facebook de Faouez.
3. **Une carte bancaire** sur le compte Meta (facturation à l'usage ; les 1000 premières
   conversations de service/mois sont gratuites, puis ~1 à 3 centimes le code).

## Étapes (Claude pilote, Faouez fournit les accès)

1. **Créer l'app sur developers.facebook.com** → type « Business » → ajouter le produit
   **WhatsApp**.
2. **Enregistrer le numéro expéditeur** dans WhatsApp → API Setup → recevoir le code de
   vérification Meta → valider. Noter le **Phone Number ID** et le **WhatsApp Business Account ID**.
3. **Créer le modèle de message** (Message Templates) nommé **`machii_otp`**, catégorie
   **Authentication**, langue **Français** + **Arabe** :
   > Ton code Machii : {{1}}
   Meta valide le modèle en quelques heures (souvent < 1h pour la catégorie Authentication).
4. **Générer un token permanent** (System User token avec permissions
   `whatsapp_business_messaging` + `whatsapp_business_management`) — PAS le token
   temporaire 24h.
5. **Brancher les secrets dans Supabase Vault** (noms EXACTS lus par la RPC
   `send_whatsapp_otp`, cf migration 0011). Dashboard Supabase → Project Settings →
   Vault → New secret, ou `vault.create_secret('<valeur>', '<nom>')` en SQL :
   - `meta_whatsapp_phone_id` = le Phone Number ID
   - `meta_whatsapp_token`    = le token permanent (System User)
   - `meta_whatsapp_template` = `machii_otp` (optionnel, c'est le défaut)
   - `meta_whatsapp_language` = `fr` (ou `ar` ; optionnel, défaut `fr`)
   La RPC poste sur `graph.facebook.com/v22.0/{phone_id}/messages` avec le template
   `machii_otp` et le code en `{{1}}` du body. Le client doit appeler `send_whatsapp_otp`
   à l'écran « Ton numéro » (déjà le cas), puis `otp_login` vérifie le code réel.
6. **Désactiver le mode démo** : Vault `otp_demo_mode` = `false` (défaut `true`, posé
   par la migration 0018 ; en mode démo `otp_login` accepte tout code de 4 à 6 chiffres).
7. **Tester** : entrer un vrai numéro dans l'app → le code doit arriver sur WhatsApp →
   se connecter avec ce code (et PLUS avec 0000).

## Recommandation de calendrier

- **Pendant le test fermé** : GARDER le mode démo (`otp_demo_mode = true`). Les testeurs
  se connectent avec n'importe quel code à 4 chiffres, zéro friction, zéro coût.
- **Juste avant la mise en production** : faire les étapes ci-dessus (prévoir le délai de
  validation du modèle Meta), puis passer `otp_demo_mode = false`.

## Vérifications techniques (déjà confirmées côté serveur ✅)

- [x] Secrets Vault exacts : `meta_whatsapp_phone_id`, `meta_whatsapp_token`,
      `meta_whatsapp_template`, `meta_whatsapp_language` (migration 0011).
- [x] `send_whatsapp_otp` poste sur `graph.facebook.com/v22.0/{phone_id}/messages`,
      template `machii_otp`, code en `{{1}}` (migrations 0010 + 0011). Renvoie
      `{sent:false, reason:'whatsapp_not_configured'}` tant que les secrets sont vides.
- [x] Mode démo = Vault `otp_demo_mode` (migration 0018). `otp_login` : en démo accepte
      tout code 4-6 chiffres ; en réel exige le code exact, non expiré (10 min),
      max 5 tentatives.
- [ ] À faire le jour J : créer les secrets Vault + passer `otp_demo_mode` à `false`,
      puis tester un vrai code sur un numéro réel.
