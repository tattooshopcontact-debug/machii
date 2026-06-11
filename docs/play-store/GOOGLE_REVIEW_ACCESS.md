# Accès à l'application — Instructions pour la revue Google Play

> À coller dans Play Console → Politique → Accès à l'application.

---

## Machii nécessite une connexion par numéro de téléphone + code OTP.

Pour permettre l'équipe de revue Google de tester l'application sans dépendre
d'un opérateur télécom externe, un **mode démo OTP** est activé en
permanence sur l'environnement de test interne.

### Procédure de connexion

1. Ouvrir l'application Machii (depuis le lien de test interne envoyé par Play Console).
2. Sur l'écran « Ton numéro », laisser le préfixe `+216` (Tunisie) et saisir
   les 8 chiffres : **`12345678`** (ou n'importe quels 8 chiffres tunisiens).
3. Toucher le bouton **« Recevoir le code »**.
4. Une popup *« Code généré (mode démo) »* apparaît avec le message :
   « WhatsApp n'est pas encore branché en V0 — le code est dans la base.
   Pour tester maintenant, saisis n'importe quel code à 4 chiffres
   dans l'écran suivant. »
5. Toucher **OK** sur la popup.
6. Sur l'écran de saisie OTP, taper n'importe quel **code à 4 chiffres**,
   par exemple `1234`.
7. Saisir un prénom (3 caractères ou plus), par exemple `Reviewer`.
8. Toucher **« Se connecter »**.
9. Vous arrivez sur l'écran d'accueil Machii.

### Pourquoi ce mode démo ?

Le service réel d'envoi d'OTP (Meta WhatsApp Cloud API) est encore en cours
de configuration côté production. Tant qu'il n'est pas activé, le backend
Supabase retourne `sent=false` et l'app accepte automatiquement n'importe
quel code à 4 chiffres pour permettre les tests internes et la revue Google.

Une fois WhatsApp activé en production, ce mode démo sera désactivé. L'app
acceptera alors uniquement le code à 6 chiffres réellement envoyé par
WhatsApp à l'utilisateur.

### Comptes de test pré-créés

Aucun compte pré-créé n'est nécessaire : le mode démo permet de créer un
nouveau compte de revue à la volée avec n'importe quel numéro tunisien.

Recommandation pour la revue :
- Numéro : `+216 12 345 678`
- Code OTP : `1234`
- Prénom : `Reviewer`
- Rôle : choisir **« Les deux »** pour pouvoir tester les écrans passager
  ET conducteur via le switcher en haut de l'accueil.

### Test des fonctionnalités principales

Une fois connecté, vous pouvez tester :
- **Publier un trajet** : Accueil > « Nouveau trajet » (mode conducteur).
- **Rechercher un trajet** : onglet « Recherche » > saisir une ville.
- **Chat** : onglet « Chat » > ouvrir une conversation.
- **Profil et vérification d'identité** : onglet « Profil » > « Se faire
  vérifier » (upload de documents).
- **Bouton SOS et contacts d'urgence** : onglet « Profil » > « SOS ».
- **Suppression de compte** : onglet « Profil », tout en bas, lien
  souligné « Supprimer mon compte ».

### Limite : SOS et notifications push

- Le bouton SOS envoie un vrai SMS si l'appareil a une SIM (sinon il propose
  d'appeler le 197, numéro d'urgence tunisien). Aucun impact si non testé.
- Les notifications push fonctionnent via Expo Push Service (gratuit) ; il
  faut autoriser les notifications au premier lancement.

### Contact pour la revue

En cas de problème de connexion ou de questions sur le fonctionnement de
l'app : **support@machii.app**

### Déclaration à mettre à jour avant la PROD

Lorsque Meta WhatsApp Cloud API sera activé en production, mettre à jour
la déclaration « Accès à l'application » comme suit :
- Cocher : **« L'app exige des identifiants de connexion »**
- Indiquer un compte de test fixe (par exemple `+216 99 999 999` avec un
  code OTP fixe documenté ici) au lieu du mode démo générique.
