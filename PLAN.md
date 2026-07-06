# Plan — Connexion par mot de passe (en plus du code WhatsApp)

**Demande :** chaque profil peut avoir un mot de passe ; à la connexion, choix entre **mot de passe** ou **code WhatsApp**. Sans casser l'OTP existant.
**Livrable :** définir un mot de passe (profil + inscription), se connecter au choix, WhatsApp intact.

## Étapes
- [x] 1. Migration `0077_password_auth.sql` : colonne `profiles.password_hash` (bcrypt) + RPC `set_password`, `has_password`, `password_login` (même sortie que otp_login → session Supabase). Appliquée en prod.
      ✅ Réussite : RPC présentes ; password_login renvoie {ok,email,password} sur bon mdp, {ok:false} sinon.
- [x] 2. Site `lib/data.ts` : `setPassword(pwd)`, `hasPassword()`, `passwordLoginAndSession(phone, pwd)` (miroir de otpLoginAndSession).
      ✅ Réussite : tsc 0.
- [x] 3. Page `/connexion` : choix « Code WhatsApp » (actuel) / « Mot de passe » (tél + mot de passe → passwordLoginAndSession).
      ✅ Réussite : les 2 méthodes mènent à une session.
- [x] 4. Profil `/profil` : section « Sécurité » → définir / changer mon mot de passe (setPassword, min 8).
      ✅ Réussite : après set, has_password=true.
- [x] 5. Inscription `/inscription` : champ mot de passe optionnel à la création.
      ✅ Réussite : mdp posé à l'inscription utilisable ensuite.
- [x] 6. Build + déploiement + test réel (compte de revue : poser un mdp puis se connecter par mdp ; vérifier WhatsApp marche toujours). Nettoyer le mdp de test.
      ✅ Réussite : connexion mdp OK, WhatsApp OK, aucun régression.

## Sécurité
- Mot de passe **haché bcrypt** (pgcrypto), jamais en clair, comparaison serveur.
- `password_login` clé sur l'email auth (pas le format du tél). Lenteur bcrypt = anti-bruteforce de base.
