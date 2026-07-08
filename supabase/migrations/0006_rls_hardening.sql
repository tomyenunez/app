-- ============================================================================
-- Dayxo · 0006_rls_hardening.sql
-- Activa RLS + políticas por auth.uid() en TODAS las tablas de dueño único.
-- IDEMPOTENTE (DROP POLICY IF EXISTS antes de cada CREATE). Correr en SQL Editor.
--
-- Cubre las tablas cuyo modelo de propiedad conozco con certeza. Las tablas de
-- GRUPOS (groups, group_members, group_invites, group_activity, shared_*) NO se
-- tocan acá: dependen de membresía y su schema lo definió otro — se blindan
-- aparte una vez visto el resultado de 0005_security_audit.sql.
-- ============================================================================

-- Helper: para tablas privadas (user_id = dueño), una sola policy ALL.
-- Se repite el patrón explícito por claridad y para poder auditarlo fácil.

-- ---- todos ----
alter table public.todos enable row level security;
drop policy if exists dx_todos_own on public.todos;
create policy dx_todos_own on public.todos for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- transactions (FINANZAS - sensible) ----
alter table public.transactions enable row level security;
drop policy if exists dx_tx_own on public.transactions;
create policy dx_tx_own on public.transactions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- deudas (FINANZAS) ----
alter table public.deudas enable row level security;
drop policy if exists dx_deudas_own on public.deudas;
create policy dx_deudas_own on public.deudas for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- habitos ----
alter table public.habitos enable row level security;
drop policy if exists dx_habitos_own on public.habitos;
create policy dx_habitos_own on public.habitos for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- habit_done ----
alter table public.habit_done enable row level security;
drop policy if exists dx_habitdone_own on public.habit_done;
create policy dx_habitdone_own on public.habit_done for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- opciones_gasto ----
alter table public.opciones_gasto enable row level security;
drop policy if exists dx_opciones_own on public.opciones_gasto;
create policy dx_opciones_own on public.opciones_gasto for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- familias ----
alter table public.familias enable row level security;
drop policy if exists dx_familias_own on public.familias;
create policy dx_familias_own on public.familias for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- game_state ----
alter table public.game_state enable row level security;
drop policy if exists dx_gamestate_own on public.game_state;
create policy dx_gamestate_own on public.game_state for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- notas ----
alter table public.notas enable row level security;
drop policy if exists dx_notas_own on public.notas;
create policy dx_notas_own on public.notas for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- eventos ----
alter table public.eventos enable row level security;
drop policy if exists dx_eventos_own on public.eventos;
create policy dx_eventos_own on public.eventos for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- feedback (insertar propio; leer propio; nadie edita/borra) ----
alter table public.feedback enable row level security;
drop policy if exists dx_feedback_insert on public.feedback;
create policy dx_feedback_insert on public.feedback for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists dx_feedback_select on public.feedback;
create policy dx_feedback_select on public.feedback for select to authenticated
  using (user_id = auth.uid());

-- ---- profiles (id = dueño). Escritura solo propia. Lectura: autenticados
--      pueden ver perfiles ajenos (username/avatar) porque la pantalla Social
--      los muestra. friend_code queda visible para autenticados — riesgo bajo
--      (es un código para compartir + la amistad requiere aceptación). Si se
--      quiere ocultar, mover la lectura de amigos 100% a la RPC friend_profile. ----
alter table public.profiles enable row level security;
drop policy if exists dx_profiles_select on public.profiles;
create policy dx_profiles_select on public.profiles for select to authenticated using (true);
drop policy if exists dx_profiles_insert on public.profiles;
create policy dx_profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists dx_profiles_update on public.profiles;
create policy dx_profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists dx_profiles_delete on public.profiles;
create policy dx_profiles_delete on public.profiles for delete to authenticated using (id = auth.uid());

-- ---- friendships (participás si sos requester o addressee) ----
alter table public.friendships enable row level security;
drop policy if exists dx_friend_select on public.friendships;
create policy dx_friend_select on public.friendships for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());
drop policy if exists dx_friend_insert on public.friendships;
create policy dx_friend_insert on public.friendships for insert to authenticated
  with check (requester_id = auth.uid() and requester_id <> addressee_id);
drop policy if exists dx_friend_update on public.friendships;
create policy dx_friend_update on public.friendships for update to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid())
  with check (requester_id = auth.uid() or addressee_id = auth.uid());
drop policy if exists dx_friend_delete on public.friendships;
create policy dx_friend_delete on public.friendships for delete to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- ---- Índices (las policies filtran por estas columnas) ----
create index if not exists idx_todos_user on public.todos(user_id);
create index if not exists idx_tx_user on public.transactions(user_id);
create index if not exists idx_deudas_user on public.deudas(user_id);
create index if not exists idx_habitos_user on public.habitos(user_id);
create index if not exists idx_habitdone_user on public.habit_done(user_id);
create index if not exists idx_opciones_user on public.opciones_gasto(user_id);
create index if not exists idx_familias_user on public.familias(user_id);
create index if not exists idx_gamestate_user on public.game_state(user_id);
create index if not exists idx_notas_user on public.notas(user_id);
create index if not exists idx_eventos_user on public.eventos(user_id);
create index if not exists idx_friend_req on public.friendships(requester_id);
create index if not exists idx_friend_addr on public.friendships(addressee_id);

-- ---- RPC pública de búsqueda por código: endurecer search_path + solo devolver
--      columnas públicas. (delete_own_account ya se creó endurecida en 0004.) ----
create or replace function public.find_user_by_friend_code(code text)
returns table (id uuid, username text, avatar_color text, avatar_url text)
language sql security definer set search_path = public stable
as $$
  select p.id, p.username, p.avatar_color, p.avatar_url
  from public.profiles p
  where p.friend_code = upper(trim(code))
  limit 1;
$$;
revoke all on function public.find_user_by_friend_code(text) from public, anon;
grant execute on function public.find_user_by_friend_code(text) to authenticated;
