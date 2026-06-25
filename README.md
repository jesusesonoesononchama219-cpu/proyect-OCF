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
css/styles.css          sistema de diseño (paleta, tipografía, componentes)
js/translations.js      diccionario ES/EN/FR
js/config.js            cliente de Supabase, estado global, helpers (dinero, anillo de progreso…)
js/app.js               miembros, finanzas, comunidad (muro/chat), eventos, dashboard, PDF
js/sales.js             módulo SALES JUICE: ventas, comisiones, ranking, meta, reporte PDF
supabase/schema.sql     esquema de base de datos + políticas RLS
```

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
