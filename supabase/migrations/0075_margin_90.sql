-- Machii — Marge portée de 40 % à 90 % (décision Faouez).
-- Raison : la conso réelle (vieille voiture + clim + trafic TN) est ~2× la conso officielle labo
--   (ex : Picanto réelle ~12 vs officielle 5,5). 90 % rapproche le MAX de la fourchette du coût réel vécu.
-- Reste le MAXIMUM (min = 0 = Offert ; le conducteur n'est pas obligé de le prendre).
update public.cost_params set margin_pct = 0.90, updated_at = now() where country = 'TN';
