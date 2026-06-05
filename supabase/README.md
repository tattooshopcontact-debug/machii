# Backend Supabase — Machii

## Mise en route

1. Créer un projet sur https://supabase.com (région **EU** recommandée pour la Tunisie).
2. Appliquer le schéma :
   - soit via la CLI : `supabase link --project-ref <ref>` puis `supabase db push`
   - soit en collant `migrations/0001_init.sql` dans le **SQL Editor**.
3. Activer **PostGIS** est fait par la migration (`create extension postgis`).
4. Auth → **Phone** : brancher le provider **Twilio** (OTP par SMS, indispensable en Tunisie ; WhatsApp possible via Twilio).
5. Storage : créer un bucket **privé** `kyc` (documents d'identité jamais publics).
6. Régénérer les types front :
   ```bash
   supabase gen types typescript --project-id <ref> > ../src/types/database.types.ts
   ```
7. Renseigner `../.env` (voir `../.env.example`) avec l'URL et l'anon key.

## Contenu
- `migrations/0001_init.sql` — tables, enums, PostGIS, trigger profil, RPC `search_trips`, RLS complet, Realtime messages.
- `seed.sql` — données de démo (profils + trajets axe Tunis/Sousse/Sfax).

## Points de vigilance
- **RLS activé partout** : toute nouvelle table doit avoir ses policies.
- **KYC / SOS** : traitement sensible via Edge Functions (`service_role`), jamais côté client.
- **search_trips** : `st_point(lng, lat)` — longitude en premier.
- ⚠️ **Juridique** : modèle gratuit uniquement (loi n° 2004-33). Valider avec un avocat avant mise en ligne.
