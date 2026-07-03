-- ============================================================
-- Dayxo · Grupos — esquema completo (tablas + RLS + RPCs)
-- Correr UNA VEZ en Supabase → SQL Editor → New query → Run.
-- Es idempotente: si algo ya existe, no rompe (create if not exists / or replace).
-- ============================================================

-- ---------- Tablas ----------

create table if not exists public.groups (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 40),
  emoji         text not null default '🔥',
  gradient_index int  not null default 0,
  invite_code   text not null unique,
  created_by    uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id  uuid not null references public.groups(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member' check (role in ('admin','member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Invitaciones pendientes (existir = pendiente; aceptar/rechazar la borra)
create table if not exists public.group_invites (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (group_id, invitee_id)
);

-- Feed de novedades (solo eventos reales)
create table if not exists public.group_activity (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  actor_id   uuid references public.profiles(id) on delete set null,
  type       text not null, -- group_created | member_joined | member_left | member_removed | group_renamed
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists group_activity_group_created_idx
  on public.group_activity (group_id, created_at desc);

-- ---------- Helpers security definer (evitan recursión de RLS) ----------

create or replace function public.is_group_member(gid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from group_members where group_id = gid and user_id = auth.uid());
$$;

create or replace function public.is_group_admin(gid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from group_members where group_id = gid and user_id = auth.uid() and role = 'admin');
$$;

create or replace function public.has_group_invite(gid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from group_invites where group_id = gid and invitee_id = auth.uid());
$$;

create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from friendships
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b) or (requester_id = b and addressee_id = a))
  );
$$;

create or replace function public.is_group_member_of(gid uuid, uid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from group_members where group_id = gid and user_id = uid);
$$;

-- ---------- RLS ----------

alter table public.groups         enable row level security;
alter table public.group_members  enable row level security;
alter table public.group_invites  enable row level security;
alter table public.group_activity enable row level security;

-- groups: los ven miembros e invitados; solo el admin edita/borra.
-- (crear grupo pasa por el RPC create_group, no por insert directo)
drop policy if exists groups_select on public.groups;
create policy groups_select on public.groups for select
  using (is_group_member(id) or has_group_invite(id));

drop policy if exists groups_update on public.groups;
create policy groups_update on public.groups for update
  using (is_group_admin(id)) with check (is_group_admin(id));

drop policy if exists groups_delete on public.groups;
create policy groups_delete on public.groups for delete
  using (is_group_admin(id));

-- group_members: los miembros ven la lista; salir uno mismo o expulsar (admin).
-- (entrar a un grupo pasa por los RPCs: create_group / join_group_by_code / accept_group_invite)
drop policy if exists group_members_select on public.group_members;
create policy group_members_select on public.group_members for select
  using (user_id = auth.uid() or is_group_member(group_id));

drop policy if exists group_members_delete on public.group_members;
create policy group_members_delete on public.group_members for delete
  using (user_id = auth.uid() or is_group_admin(group_id));

-- group_invites: invitar solo un miembro a un amigo; ver/borrar los involucrados.
drop policy if exists group_invites_select on public.group_invites;
create policy group_invites_select on public.group_invites for select
  using (invitee_id = auth.uid() or inviter_id = auth.uid() or is_group_member(group_id));

drop policy if exists group_invites_insert on public.group_invites;
create policy group_invites_insert on public.group_invites for insert
  with check (
    inviter_id = auth.uid()
    and is_group_member(group_id)
    and are_friends(auth.uid(), invitee_id)
    and not is_group_member_of(group_id, invitee_id)
  );

drop policy if exists group_invites_delete on public.group_invites;
create policy group_invites_delete on public.group_invites for delete
  using (invitee_id = auth.uid() or inviter_id = auth.uid() or is_group_admin(group_id));

-- group_activity: ven e insertan los miembros (los RPCs también insertan).
drop policy if exists group_activity_select on public.group_activity;
create policy group_activity_select on public.group_activity for select
  using (is_group_member(group_id));

drop policy if exists group_activity_insert on public.group_activity;
create policy group_activity_insert on public.group_activity for insert
  with check (is_group_member(group_id) and actor_id = auth.uid());

-- ---------- RPCs ----------

-- Crear grupo: grupo + membresía admin + evento, todo en una transacción.
create or replace function public.create_group(p_name text, p_emoji text, p_gradient int)
returns public.groups language plpgsql security definer set search_path = public as $$
declare
  g public.groups;
  code text;
  tries int := 0;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  loop
    code := upper(substr(md5(random()::text), 1, 6));
    begin
      insert into groups (name, emoji, gradient_index, invite_code, created_by)
      values (trim(p_name), coalesce(nullif(p_emoji,''),'🔥'), coalesce(p_gradient,0), code, auth.uid())
      returning * into g;
      exit;
    exception when unique_violation then
      tries := tries + 1;
      if tries > 5 then raise; end if;
    end;
  end loop;
  insert into group_members (group_id, user_id, role) values (g.id, auth.uid(), 'admin');
  insert into group_activity (group_id, actor_id, type) values (g.id, auth.uid(), 'group_created');
  return g;
end;
$$;

-- Unirse con código de invitación. Devuelve el id del grupo.
create or replace function public.join_group_by_code(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  gid uuid;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  select id into gid from groups where invite_code = upper(trim(p_code));
  if gid is null then raise exception 'CODIGO_INVALIDO'; end if;
  if exists (select 1 from group_members where group_id = gid and user_id = auth.uid()) then
    return gid; -- ya era miembro: no-op
  end if;
  insert into group_members (group_id, user_id) values (gid, auth.uid());
  delete from group_invites where group_id = gid and invitee_id = auth.uid();
  insert into group_activity (group_id, actor_id, type) values (gid, auth.uid(), 'member_joined');
  return gid;
end;
$$;

-- Aceptar una invitación que me llegó.
create or replace function public.accept_group_invite(p_invite uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  inv record;
begin
  select * into inv from group_invites where id = p_invite and invitee_id = auth.uid();
  if inv is null then raise exception 'INVITACION_INEXISTENTE'; end if;
  insert into group_members (group_id, user_id) values (inv.group_id, auth.uid())
    on conflict do nothing;
  delete from group_invites where id = p_invite;
  insert into group_activity (group_id, actor_id, type) values (inv.group_id, auth.uid(), 'member_joined');
  return inv.group_id;
end;
$$;

-- Salir de un grupo. Si queda vacío se borra; si no queda admin, se promueve
-- al miembro más antiguo.
create or replace function public.leave_group(p_group uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  remaining int;
  oldest uuid;
begin
  delete from group_members where group_id = p_group and user_id = auth.uid();
  if not found then return; end if;

  select count(*) into remaining from group_members where group_id = p_group;
  if remaining = 0 then
    delete from groups where id = p_group;
    return;
  end if;

  if not exists (select 1 from group_members where group_id = p_group and role = 'admin') then
    select user_id into oldest from group_members
      where group_id = p_group order by joined_at asc limit 1;
    update group_members set role = 'admin' where group_id = p_group and user_id = oldest;
  end if;

  insert into group_activity (group_id, actor_id, type) values (p_group, auth.uid(), 'member_left');
end;
$$;

-- Miembros del grupo con su XP (para el ranking). Solo para miembros.
create or replace function public.group_members_xp(p_group uuid)
returns table (
  user_id uuid, username text, avatar_color text, avatar_url text,
  role text, joined_at timestamptz, xp_total numeric, xp_daily jsonb
) language sql security definer set search_path = public stable as $$
  select m.user_id, p.username, p.avatar_color, p.avatar_url,
         m.role, m.joined_at,
         coalesce(gs.xp_total, 0)::numeric as xp_total,
         coalesce(gs.xp_daily, '{}'::jsonb) as xp_daily
  from group_members m
  join profiles p on p.id = m.user_id
  left join game_state gs on gs.user_id = m.user_id
  where m.group_id = p_group
    and is_group_member(p_group);
$$;

-- Permisos de acceso a las tablas para usuarios logueados (RLS sigue filtrando filas)
grant select, insert, update, delete
  on public.groups, public.group_members, public.group_invites, public.group_activity
  to authenticated;

-- Permisos de ejecución para usuarios logueados
grant execute on function
  public.create_group(text, text, int),
  public.join_group_by_code(text),
  public.accept_group_invite(uuid),
  public.leave_group(uuid),
  public.group_members_xp(uuid),
  public.is_group_member(uuid),
  public.is_group_admin(uuid),
  public.has_group_invite(uuid),
  public.are_friends(uuid, uuid),
  public.is_group_member_of(uuid, uuid)
to authenticated;
