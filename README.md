# OCF Startup — Open Circle of Freedom

App web de la comunidad OCF: miembros, finanzas (ingresos/retiros 40-60), muro y chat interno,
eventos, y el módulo **Sales Juice** (registro de ventas, comisiones automáticas por rol,
ranking de vendedores, meta mensual y reporte PDF).

Backend: **Supabase** (Auth + Postgres). Frontend: HTML/CSS/JS plano (sin build), fácil de
desplegar en cualquier hosting estático.

## 1. Crear el proyecto en Supabase

1. Entra a https://supabase.com → **New project**.
2. Cuando esté listo, ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public` key

## 2. Crear las tablas

1. Ve a **SQL Editor → New query**.
2. Pega todo el contenido de [`supabase/schema.sql`](./supabase/schema.sql) y ejecútalo.
   Esto crea las tablas `members`, `incomes`, `withdrawals`, `posts`, `chat_messages`,
   `events`, `sales`, `app_config`, con seguridad a nivel de fila (RLS) habilitada para
   que solo usuarios autenticados puedan leer/escribir.
3. (Opcional) Ejecuta también [`supabase/seed_posts.sql`](./supabase/seed_posts.sql) para
   publicar automáticamente en el muro las 2 publicaciones de Día de las Madres (10/05/2026)
   y Tabaski (27/05/2026), con sus imágenes reales y fechas exactas.

## 3. Crear usuarios (login)

La app usa email + contraseña. Crea los usuarios del círculo en
**Authentication → Users → Add user** (o invítalos por correo). No hay pantalla de
registro pública — el acceso lo controla quien administra el proyecto.

## 4. Conectar la app a tu proyecto

Edita `js/config.js` y reemplaza:

```js
const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
const SUPABASE_ANON_KEY = "TU-CLAVE-ANON-PUBLICA";
```

con los valores del paso 1. La `anon` key es pública por diseño (se usa en el cliente);
la seguridad real la dan las políticas RLS del paso 2.

## 5. Ejecutar en local

No requiere build. Solo necesitas servir los archivos estáticos:

```bash
npx serve .
# o
python3 -m http.server 8080
```

Abre la URL que te indique en el navegador.

## 6. Desplegar

Cualquier hosting estático funciona: **Netlify**, **Vercel**, **Cloudflare Pages**,
**GitHub Pages**, etc. Solo sube la carpeta completa (`index.html`, `css/`, `js/`).

## Estructura del proyecto

```
index.html              shell de la app (login, navegación, secciones, modales)
css/styles.css           sistema de diseño (paleta, tipografía, componentes)
js/translations.js       diccionario ES/EN/FR
js/config.js             cliente de Supabase, estado global, helpers (dinero, anillo de progreso…)
js/app.js                miembros, finanzas, comunidad (muro/chat), eventos, dashboard, PDF
js/sales.js              módulo SALES JUICE: ventas, comisiones, ranking, meta, reporte PDF
js/slider.js             carrusel "Eventos y Unión" (fotos + video del aniversario)
js/juice-varieties.js    tarjetas "Nuestros Zumos" con transición al pasar el mouse
supabase/schema.sql      esquema de base de datos + políticas RLS
supabase/seed_posts.sql  publicaciones de Día de las Madres y Tabaski (con fecha e imagen reales)
assets/logo.png          logo del círculo
assets/eventos/          fotos y video reales del carrusel "Eventos y Unión"
assets/posts/            imágenes de las publicaciones del muro
assets/juice/            (pendiente) fotos reales de cada variedad de jugo
```

## Seguridad

- **XSS**: todo el texto que viene de miembros (nombres, mensajes de chat, publicaciones,
  ventas, eventos) se escapa con `escapeHtml()` antes de mostrarse en pantalla.
- **Imagen de publicaciones**: solo se aceptan enlaces `http(s)` reales; cualquier otro
  esquema (`javascript:`, etc.) se rechaza al publicar.
- **Content-Security-Policy**: el HTML declara explícitamente qué dominios puede cargar
  el navegador (Supabase, Google Fonts, Unsplash, CDNs de las librerías usadas) y bloquea
  el resto.
- **Foto de miembro**: se valida el tipo real del archivo (JPG/PNG/WEBP/GIF) y un tamaño
  máximo de 8MB antes de procesarla; además se redibuja en un `<canvas>`, lo que descarta
  cualquier contenido que no sea una imagen válida.
- **Inyección SQL**: no aplica — toda consulta pasa por las funciones de Supabase
  (`.insert()`, `.select()`...), nunca se concatena texto del usuario en SQL.
- **Acceso sin sesión**: bloqueado por las políticas RLS — solo usuarios autenticados
  pueden leer o escribir cualquier tabla.
- ⚠️ **Permisos planos**: cualquier miembro logueado puede editar/borrar los datos de
  cualquier otro (no hay permisos distintos por rol a nivel de base de datos, solo
  etiquetas visuales). Apropiado para un círculo pequeño de confianza; si se necesita
  restringir por rol, hay que añadir políticas RLS adicionales.

## Reglas de negocio que se mantienen del proyecto original

- **Ahorro**: ahorro = ingresos totales − retiros totales.
- **Retiros**: 40% del saldo disponible para retirar, 60% se retiene como fondo.
- **Roles**: Presidente, Tesorero, Secretario, Reclutador, Miembro — cada uno con tareas
  propias visibles en el perfil del miembro.

## Sales Juice — reglas de comisión por defecto

| Rol | Comisión sugerida |
|---|---|
| Miembro | 25% |
| Reclutador | 20% |
| Secretario / Tesorero | 15% |
| Presidente | 10% |

El % se autocompleta según el rol del vendedor al elegirlo, pero es editable por venta.
`Comisión = monto × %` · `Ganancia neta = monto − comisión`.
