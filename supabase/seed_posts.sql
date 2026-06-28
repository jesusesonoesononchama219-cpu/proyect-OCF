-- ============================================================
-- Publicaciones especiales: Día de las Madres y Tabaski (Bénin, 2026)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- Fechas verificadas para Bénin:
--   Fête des Mères  -> dimanche 10 mai 2026
--   Tabaski (Aïd al-Adha) -> mercredi 27 mai 2026
-- ============================================================

insert into posts (title, content, image_url, date, author) values
(
  'Bonne fête à toutes nos mamans du Cercle OCF 💛',
  'En ce dimanche, le Cercle OCF rend hommage à toutes les mamans de notre communauté : celles d''aujourd''hui et celles qui veillent sur nous de là-haut. Merci pour votre amour inconditionnel, votre force, votre courage et vos sacrifices qui n''ont pas de prix. Bonne fête, mamans d''OCF ! 👩‍👧‍👦💛',
  'assets/posts/fete-des-meres.jpg',
  '10/05/2026',
  'OCF Startup'
),
(
  'Aïd Moubarak ! Joyeuse Tabaski à toute la famille OCF 🐑✨',
  'À l''occasion de la fête de Tabaski, Sales Juice souhaite une très belle fête à tous les musulmans de notre cercle. Que cette fête vous apporte paix, santé, prospérité, bonheur et qu''elle renforce les liens d''amour et de fraternité. Aïd Moubarak ! 🤲🏽',
  'assets/posts/tabaski.jpg',
  '27/05/2026',
  'OCF Startup'
);
