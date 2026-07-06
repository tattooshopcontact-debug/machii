-- Machii — Complément TN : voitures courantes en Tunisie/Maghreb absentes de la base US EPA
--   (Peugeot/Renault récentes, Dacia, Citroën, Seat, Opel, Skoda + classiques comme la 203).
-- Consommations = valeurs réelles réalistes (L/100 km). source='TN-curated'. Idempotent.
delete from public.vehicle_consumption where source='TN-curated';

insert into public.vehicle_consumption (make, model, year_from, year_to, fuel_type, consumption_l100, source) values
-- Peugeot (récentes)
('Peugeot','208',2012,2026,'essence',5.8,'TN-curated'),('Peugeot','208',2012,2026,'gasoil',4.2,'TN-curated'),
('Peugeot','301',2012,2026,'essence',6.2,'TN-curated'),('Peugeot','301',2012,2026,'gasoil',4.5,'TN-curated'),
('Peugeot','2008',2013,2026,'essence',6.0,'TN-curated'),('Peugeot','2008',2013,2026,'gasoil',4.5,'TN-curated'),
('Peugeot','308',2013,2026,'essence',6.0,'TN-curated'),('Peugeot','308',2013,2026,'gasoil',4.3,'TN-curated'),
('Peugeot','Partner',2010,2026,'gasoil',5.5,'TN-curated'),
-- Peugeot (classiques TN)
('Peugeot','203',1948,1960,'essence',10.0,'TN-curated'),
('Peugeot','404',1960,1975,'essence',10.0,'TN-curated'),
('Peugeot','504',1968,1983,'essence',11.0,'TN-curated'),('Peugeot','504',1968,1983,'gasoil',8.0,'TN-curated'),
-- Renault (récentes)
('Renault','Clio',2012,2026,'essence',5.8,'TN-curated'),('Renault','Clio',2012,2026,'gasoil',4.0,'TN-curated'),
('Renault','Symbol',2008,2026,'essence',6.0,'TN-curated'),('Renault','Symbol',2008,2026,'gasoil',4.2,'TN-curated'),
('Renault','Megane',2012,2026,'essence',6.2,'TN-curated'),('Renault','Megane',2012,2026,'gasoil',4.5,'TN-curated'),
('Renault','Captur',2013,2026,'essence',6.0,'TN-curated'),('Renault','Captur',2013,2026,'gasoil',4.5,'TN-curated'),
('Renault','Kadjar',2015,2026,'gasoil',4.8,'TN-curated'),
('Renault','Kangoo',2008,2026,'gasoil',5.5,'TN-curated'),
('Renault','Clio',1998,2012,'essence',6.5,'TN-curated'),('Renault','Clio',1998,2012,'gasoil',4.8,'TN-curated'),
-- Dacia
('Dacia','Logan',2004,2026,'essence',6.2,'TN-curated'),('Dacia','Logan',2004,2026,'gasoil',4.5,'TN-curated'),
('Dacia','Sandero',2008,2026,'essence',6.0,'TN-curated'),('Dacia','Sandero',2008,2026,'gasoil',4.3,'TN-curated'),
('Dacia','Duster',2010,2026,'essence',6.8,'TN-curated'),('Dacia','Duster',2010,2026,'gasoil',5.0,'TN-curated'),
('Dacia','Dokker',2012,2026,'gasoil',5.0,'TN-curated'),
-- Citroën
('Citroën','C-Elysée',2012,2026,'essence',6.0,'TN-curated'),('Citroën','C-Elysée',2012,2026,'gasoil',4.2,'TN-curated'),
('Citroën','C3',2009,2026,'essence',5.9,'TN-curated'),('Citroën','C3',2009,2026,'gasoil',4.2,'TN-curated'),
('Citroën','Berlingo',2008,2026,'gasoil',5.5,'TN-curated'),
-- Seat / Opel / Skoda
('Seat','Ibiza',2008,2026,'essence',5.8,'TN-curated'),('Seat','Ibiza',2008,2026,'gasoil',4.2,'TN-curated'),
('Seat','Leon',2012,2026,'essence',6.0,'TN-curated'),('Seat','Leon',2012,2026,'gasoil',4.3,'TN-curated'),
('Opel','Corsa',2010,2026,'essence',5.8,'TN-curated'),('Opel','Corsa',2010,2026,'gasoil',4.2,'TN-curated'),
('Opel','Astra',2010,2026,'essence',6.0,'TN-curated'),('Opel','Astra',2010,2026,'gasoil',4.3,'TN-curated'),
('Skoda','Octavia',2010,2026,'essence',6.0,'TN-curated'),('Skoda','Octavia',2010,2026,'gasoil',4.3,'TN-curated'),
('Skoda','Fabia',2010,2026,'essence',5.5,'TN-curated'),
-- VW / Fiat (modèles récents courants)
('Volkswagen','Golf',2012,2026,'essence',6.0,'TN-curated'),('Volkswagen','Golf',2012,2026,'gasoil',4.5,'TN-curated'),
('Volkswagen','Polo',2010,2026,'essence',5.5,'TN-curated'),('Volkswagen','Polo',2010,2026,'gasoil',4.2,'TN-curated'),
('Fiat','Tipo',2015,2026,'essence',6.0,'TN-curated'),('Fiat','Tipo',2015,2026,'gasoil',4.3,'TN-curated'),
-- Hyundai / Kia (modèles TN courants récents)
('Hyundai','i10',2008,2026,'essence',5.5,'TN-curated'),
('Hyundai','i20',2009,2026,'essence',5.8,'TN-curated'),
('Hyundai','Accent',2011,2026,'essence',6.2,'TN-curated'),('Hyundai','Accent',2011,2026,'gasoil',4.5,'TN-curated'),
('Kia','Picanto',2011,2026,'essence',5.5,'TN-curated'),
('Kia','Rio',2011,2026,'essence',5.8,'TN-curated'),
('Kia','Sportage',2010,2026,'gasoil',5.5,'TN-curated'),
-- Isuzu / Toyota (pick-up + populaires)
('Isuzu','D-Max',2012,2026,'gasoil',7.5,'TN-curated'),
('Toyota','Yaris',2011,2026,'essence',5.5,'TN-curated'),('Toyota','Yaris',2011,2026,'hybride',3.8,'TN-curated'),
('Toyota','Corolla',2013,2026,'essence',6.0,'TN-curated'),('Toyota','Corolla',2013,2026,'hybride',4.0,'TN-curated'),
('Toyota','Hilux',2010,2026,'gasoil',7.5,'TN-curated');
