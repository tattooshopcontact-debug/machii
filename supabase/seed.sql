-- Données de démo Machii (à lancer après 0001_init.sql, en dev uniquement).
-- Nécessite des utilisateurs auth existants ; ici on insère des profils "détachés"
-- pour visualiser des trajets. Adapte les UUID à tes utilisateurs réels.

-- Exemple de trajet Tunis -> Sfax (coordonnées réelles).
-- insert into public.profiles (id, full_name, role, is_verified, rating_avg, level, xp)
-- values ('00000000-0000-0000-0000-000000000001', 'Ahmed Ben Salah', 'driver', true, 4.8, 5, 1200);

-- insert into public.trips
--   (driver_id, origin_label, destination_label, origin, destination, departure_time, seats_available, seats_total, price_per_seat, status, is_recurring)
-- values (
--   '00000000-0000-0000-0000-000000000001', 'Tunis', 'Sfax',
--   st_point(10.1815, 36.8065)::geography,   -- Tunis (lng, lat)
--   st_point(10.7603, 34.7406)::geography,   -- Sfax  (lng, lat)
--   now() + interval '1 day', 2, 3, 25, 'open', true
-- );

-- En V1, l'app utilise les données de démo front (src/constants/mock.ts) :
-- ce fichier sert de gabarit une fois l'auth réelle branchée.
