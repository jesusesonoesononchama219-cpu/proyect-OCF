-- ============================================================
-- OCF STARTUP — Esquema de base de datos para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------------- members ----------------
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default 'Miembro',
  phone text,
  email text,
  photo_url text,
  fecha_salida date,
  entry_date text,
  birth_date text,
  address text,
  join_date text,
  created_at timestamptz default now()
);

-- ---------------- incomes (un registro por miembro y mes) ----------------
create table if not exists incomes (
  id bigint generated always as identity primary key,
  month text not null,             -- formato 'YYYY-MM'
  member_id uuid references members(id) on delete cascade,
  amount numeric not null default 0,
  updated_at timestamptz default now(),
  unique (month, member_id)
);

-- ---------------- withdrawals ----------------
create table if not exists withdrawals (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  beneficiary_id uuid references members(id),
  beneficiary_name text,
  amount numeric not null default 0,
  created_at timestamptz default now()
);

-- ---------------- posts (muro de la comunidad) ----------------
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  image_url text,
  date text,
  author text,
  created_at timestamptz default now()
);

-- ---------------- chat_messages ----------------
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_name text,
  user_email text,
  text text not null,
  time text,
  created_at timestamptz default now()
);

-- ---------------- events ----------------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date_time timestamptz not null,
  description text,
  created_at timestamptz default now()
);

-- ---------------- sales (SALES JUICE) ----------------
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id),
  member_name text,
  member_role text,
  product text not null,
  amount numeric not null,
  commission_pct numeric not null default 0,
  commission_amount numeric not null default 0,
  net_amount numeric not null default 0,
  date date not null,
  created_at timestamptz default now()
);

-- ---------------- app_config (clave/valor, p.ej. meta de ventas) ----------------
create table if not exists app_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb
);

-- ---------------- initial_fund (fondo inicial registrado manualmente) ----------------
create table if not exists initial_fund (
  id bigint generated always as identity primary key,
  amount numeric not null default 0,
  note text,
  registered_by text,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- Cualquier usuario autenticado de la app puede leer/escribir.
-- Ajusta estas políticas si necesitas roles más granulares.
-- ============================================================
alter table members enable row level security;
alter table incomes enable row level security;
alter table withdrawals enable row level security;
alter table posts enable row level security;
alter table chat_messages enable row level security;
alter table events enable row level security;
alter table sales enable row level security;
alter table app_config enable row level security;

alter table initial_fund enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array['members','incomes','withdrawals','posts','chat_messages','events','sales','app_config','initial_fund'])
  loop
    execute format('drop policy if exists "auth_all_%s" on %I;', t, t);
    execute format(
      'create policy "auth_all_%s" on %I for all to authenticated using (true) with check (true);',
      t, t
    );
  end loop;
end $$;

-- ============================================================
-- Datos de ejemplo (opcional, puedes borrar este bloque)
-- ============================================================
-- insert into app_config (key, value) values ('salesGoal', '{"amount": 0}'::jsonb)
--   on conflict (key) do nothing;
