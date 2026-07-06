-- Machii — Marge portée de 25 % à 40 % (demande Faouez).
-- Colle à l'écart réel/officiel mesuré par l'ICCT (~39 %) : la conso réelle dépasse la conso officielle
--   d'environ 40 % (usure moteur, clim, trafic, surconsommation). → la marge = correction réaliste, pas du profit.
--   Reste le MAXIMUM de la fourchette (le conducteur n'est pas obligé de le prendre ; min = 0 / Offert).
update public.cost_params set margin_pct = 0.40, updated_at = now() where country = 'TN';
