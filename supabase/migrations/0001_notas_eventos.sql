-- ============================================================================
-- Dayxo · Migración de Notas y Eventos (Agenda) a la nube
-- Correr en: Supabase Dashboard → SQL Editor → New query → Run
-- Es idempotente (se puede correr dos veces sin romper nada).
--
-- Sigue el mismo patrón que la tabla `todos`: id de texto, user_id del dueño,
-- RLS con políticas por auth.uid() y sin acceso para anon (app login-gated).
-- Las fechas se guardan como texto ISO (igual que hace la app hoy) para que
-- el formato viaje idéntico ida y vuelta.
-- ============================================================================

-- ============================== NOTAS =======================================
create table if not exists public.notas (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null default '',
  cuerpo text not null default '',
  fecha_creacion text not null,
  fecha_edicion text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notas enable row level security;

drop policy if exists "notas_select_own" on public.notas;
create policy "notas_select_own" on public.notas
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "notas_insert_own" on public.notas;
create policy "notas_insert_own" on public.notas
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "notas_update_own" on public.notas;
create policy "notas_update_own" on public.notas
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "notas_delete_own" on public.notas;
create policy "notas_delete_own" on public.notas
  for delete to authenticated using (user_id = auth.uid());

revoke all on public.notas from anon;
create index if not exists idx_notas_user on public.notas(user_id);

-- ============================== EVENTOS (Agenda) =============================
create table if not exists public.eventos (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  fecha text not null,            -- ISO string (igual que la app)
  tipo text not null default '',  -- id de Familia
  hora text not null default '',  -- "HH:MM" o ""
  created_at timestamptz not null default now()
);

alter table public.eventos enable row level security;

drop policy if exists "eventos_select_own" on public.eventos;
create policy "eventos_select_own" on public.eventos
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "eventos_insert_own" on public.eventos;
create policy "eventos_insert_own" on public.eventos
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "eventos_update_own" on public.eventos;
create policy "eventos_update_own" on public.eventos
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "eventos_delete_own" on public.eventos;
create policy "eventos_delete_own" on public.eventos
  for delete to authenticated using (user_id = auth.uid());

revoke all on public.eventos from anon;
create index if not exists idx_eventos_user on public.eventos(user_id);
