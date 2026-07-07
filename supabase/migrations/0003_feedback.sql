-- ============================================================================
-- Dayxo · Tabla de feedback/sugerencias de usuarios
-- Correr en: Supabase Dashboard → SQL Editor → New query → Run (idempotente)
--
-- Los usuarios mandan sugerencias desde el menú lateral. Ustedes las leen en
-- Supabase → Table Editor → feedback (ordenadas por created_at).
-- ============================================================================

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null default '',
  mensaje text not null check (char_length(mensaje) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Cada usuario puede crear sugerencias a su nombre y ver solo las suyas.
drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own" on public.feedback
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "feedback_select_own" on public.feedback;
create policy "feedback_select_own" on public.feedback
  for select to authenticated using (user_id = auth.uid());

-- Este proyecto no otorga permisos por defecto: darlos explícitamente.
revoke all on public.feedback from anon;
grant select, insert on public.feedback to authenticated;

create index if not exists idx_feedback_created on public.feedback(created_at desc);
