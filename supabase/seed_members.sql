-- ============================================================
-- OCF STARTUP — Miembros fundadores del círculo
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Primero añadimos las columnas nuevas si no existen todavía
-- (puedes saltar esto si ya las tienes)
alter table members add column if not exists birth_date text;
alter table members add column if not exists address text;
alter table members add column if not exists join_date text;

-- Insertar los 5 miembros fundadores
insert into members (name, role, phone, email, birth_date, address, entry_date, join_date) values
(
  'Lamabong Benga Nti Christian Paul',
  'Miembro',
  '+229 01 69 77 76 76',
  'christianlamabong@gmail.com',
  '16 Janvier 2002',
  'Sekandji, Agblangandan, Sème-Podji, Bénin',
  '03/04/2026',
  '03 Avril 2026'
),
(
  'Gomez Rendon Sabrina Dewii',
  'Miembro',
  '+229 01 42 70 72 68',
  'brina.19.gomez@gmail.com',
  '19 Avril 2009',
  'St Michel, Cotonou, Bénin',
  '03/04/2026',
  '03 Avril 2026'
),
(
  'Agbetou Ange Aurel Sourou',
  'Miembro',
  '+229 01 96 48 24 01',
  'angemonoman09@icloud.com',
  '09 Novembre 2005',
  'Abomey-Calavi / Womey, Bénin',
  '03/04/2026',
  '03 Avril 2026'
),
(
  'Hountondji Akpédjé Marcelline',
  'Miembro',
  '+229 01 92 27 88 19',
  'hountondjimarcelline9@gmail.com',
  '6 Avril 2003',
  'Akpakpa Énagnon, Cotonou, Bénin',
  '03/04/2026',
  '03 Avril 2026'
),
(
  'Kintin Camelle Bossè',
  'Miembro',
  '+229 01 98 65 49 08',
  'carmelkintin@icloud.com',
  '16 Juillet 2000',
  'Seckandji, Sème-Kpodji, Bénin',
  '06/05/2026',
  '06 Mai 2026'
);
