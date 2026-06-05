# Machii 🚗💛

**App de covoiturage pour la Tunisie** — axe Tunis · Sousse · Sfax.
Marque indépendante. Modèle **gratuit** (loi tunisienne n° 2004-33).

> Stack : **Expo (React Native) + Expo Router + TypeScript + Supabase**
> État : **V1 — fondations** (design system + écrans clés en données de démo, backend prêt à brancher).

---

## Démarrer

```bash
cd machii
npm install            # déjà fait à la création
cp .env.example .env   # puis renseigne tes clés Supabase (optionnel en V1)
npx expo start         # 'i' iOS · 'a' Android · 'w' web
```

En V1, l'app tourne **sans backend** : les écrans utilisent les données de démo
(`src/constants/mock.ts`). Le flux de connexion accepte n'importe quel code OTP.

---

## Architecture

```
src/
├── app/                  # Expo Router (routing UNIQUEMENT)
│   ├── _layout.tsx       # racine : polices Inter, providers, splash, Stack
│   ├── index.tsx         # redirection selon la session
│   ├── (auth)/           # phone.tsx · otp.tsx
│   ├── (tabs)/           # index(Accueil) · search · trips · messages · profile
│   └── trip/             # [id].tsx (détail) · create.tsx (publier)
├── components/
│   ├── ui/               # design system (Button, Card, Badge, Avatar, Logo…)
│   ├── TripCard.tsx
│   └── CityPicker.tsx
├── theme/                # couleurs (9 HEX figées), typo Inter, spacing, ombres
├── lib/                  # supabase, queryClient, env, format
├── stores/               # Zustand (auth, recherche)
├── types/                # models + database.types (généré Supabase)
└── constants/            # villes TN, données de démo

supabase/                 # migration SQL (PostGIS + RLS + RPC), seed, README
```

Règle Expo Router : **rien d'autre que des écrans/layouts dans `app/`**.
Server-state via **TanStack Query**, UI-state via **Zustand**.

## Design system (figé)

| Rôle | HEX |
|---|---|
| Primaire (navy) | `#1B3D6E` |
| CTA (jaune) | `#FFD400` |
| Accent (orange) | `#F18A4D` |
| Fond (crème) | `#FAF7F2` |
| Succès | `#4ADE80` · SOS `#C92A2A` |

Typo **Inter**. Logo **"Curved Arc"** (`components/ui/Logo.tsx`) : les deux *i*
de Machii = deux cercles jaunes reliés par un arc (un trajet entre 2 villes).

## Écrans livrés (V1)
- Auth téléphone + OTP
- Accueil (recherche + "Sur ta route")
- Recherche + résultats + **suggestion "match intelligent"** (waypoint)
- Détail trajet (affichage échelonné : véhicule générique + cadenas)
- Mes trajets · Messages · Profil (XP, notes multi-critères, achievements)
- Publier un trajet (ponctuel / répétitif)

## Prochaines étapes
1. Brancher Supabase (auth OTP Twilio, requêtes `search_trips`, Realtime chat).
2. Carte (react-native-maps + Mapbox/Google Directions) + waypoint matching réel.
3. Pack sécurité (SOS, partage de trajet), code 4 chiffres, KYC OCR.
4. Produire les **assets de marque** (logo vectorisé, icône, splash) — placeholders Expo actuellement.

## ⚠️ Juridique (bloquant avant mise en ligne)
Le covoiturage **payant** est interdit en Tunisie (loi n° 2004-33). Machii est une
plateforme de mise en relation **gratuite** ; bannière légale permanente intégrée
(`components/ui/LegalBanner.tsx`). **Valider avec un avocat transport avant tout lancement.**
