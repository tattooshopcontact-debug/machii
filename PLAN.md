# Plan — Mode Défi / Classement (développé mais CACHÉ jusqu'au lancement)

**Demande Faouez :** un **classement/défi hebdomadaire** — équipages ET conducteurs en compétition (le plus de trajets, le plus de CO₂ évité). Le construire **maintenant** mais **ne pas le sortir** : gated par un feature flag OFF, allumé quand il y aura des utilisateurs.

## Décisions
- Flag **`challenge`** (feature_flags) = **false** au départ. OFF → pas de lien nav + page « bientôt ». ON → visible.
- 2 classements : **Conducteurs** (individuel) + **Équipages**. Hebdomadaire (semaine en cours) + filtre par ville.
- Score = **CO₂ évité** (héros) : conducteurs = Σ distance×places réservées×0,12 (trajets réels de la semaine) ; équipages = (n-1)×distance×2×jours×0,12.
- Podium top 3 + liste. Zéro argent (badges/titres).

## Étapes
- [x] 1. Migration `0058_challenge.sql` : insert flag `challenge`=false ; RPC `get_leaderboard(p_kind, p_city)` SECURITY DEFINER (conducteurs via trips réels de la semaine + ST_Distance ; équipages via impact) → JSON classé top 20.
      ✅ Appliquée (HTTP 201) ; flag présent = false ; RPC renvoie un tableau classé (Compte Démo, 10 trajets, 0 kg).
- [x] 2. Site : `lib/features.ts` (+ clé `challenge`, fallback false) ; `lib/data.ts` `getLeaderboard(kind, city)`.
      ✅ tsc 0 erreur ; next build 28 pages (dont /defi).
- [x] 3. Page `/defi` : gated par `useFeature('challenge')` → OFF = écran « Le Défi arrive bientôt » ; ON = podium + liste + onglets Conducteurs/Équipages + filtre ville + cadrage « Défi de la semaine ».
      ✅ page rendue dans les 2 états (captures defi-on-drivers/crews.png).
- [x] 4. Lien « 🏆 Défi » dans la nav connectée **seulement si flag ON** ; sinon caché.
      ✅ `auth==="in" && challenge` ; aucun `href="/defi"` dans les pages statiques.
- [x] 5. Build + déploiement + vérif : flag OFF → /defi = « bientôt », pas de lien nav ; test flag ON (mock) → classement rendu.
      ✅ déployé (machii.pages.dev) ; OFF prouvé en prod par curl ; ON prouvé par Playwright (mock challenge=true, RPC réel).

## Vérification finale
- [x] 6. Le Défi est entièrement codé mais INVISIBLE (flag OFF). Un `select public.set_feature('challenge',true)` l'allumera d'un coup, sans redéploiement.
      ✅ Confirmé : flag OFF en prod, code complet présent, bascule = 1 requête SQL.
