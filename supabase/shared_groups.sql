-- ============================================================
-- Dayxo · Gastos compartidos — backend multiusuario
-- Correr UNA VEZ en Supabase → SQL Editor → Run.
-- Requiere groups.sql corrido antes (usa are_friends()).
-- Modelo: los amigos de Dayxo se agregan DIRECTO como integrantes
-- (estilo Splitwise, sin aceptar); también hay integrantes "de nombre"
-- (user_id null) para gente sin cuenta.
-- ============================================================

-- ---------- Tablas ----------

create table if not exists public.shared_groups (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null check (char_length(nombre) between 1 and 40),
  emoji          text not null default '🍖',
  gradient_index int  not null default 0,
  invite_code    text not null unique,
  created_by     uuid not null references public.profiles(id) on delete cascade,
  created_at     timestamptz not null default now()
);

create table if not exists public.shared_group_members (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.shared_groups(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade, -- null = integrante "de nombre" (sin cuenta)
  nombre     text not null, -- placeholder o snapshot; para usuarios reales la app muestra el username vivo del perfil
  color      text not null default '#6C5CE7',
  created_at timestamptz not null default now()
);

-- Un usuario real no puede estar dos veces en el mismo grupo
create unique index if not exists shared_members_unique_user
  on public.shared_group_members (group_id, user_id) where user_id is not null;

create table if not exists public.shared_expenses (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.shared_groups(id) on delete cascade,
  descripcion   text not null default 'Gasto',
  monto         numeric not null check (monto > 0),
  paid_by       uuid not null references public.shared_group_members(id) on delete cascade,
  split_between uuid[] not null default '{}', -- ids de shared_group_members
  fecha         text not null,                -- "YYYY-M-D" (formato dateKey de la app)
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists shared_expenses_group_idx
  on public.shared_expenses (group_id, created_at desc);

-- ---------- Helper security definer (evita recursión de RLS) ----------

create or replace function public.is_shared_member(gid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from shared_group_members where group_id = gid and user_id = auth.uid()
  );
$$;

-- ---------- RLS ----------

alter table public.shared_groups        enable row level security;
alter table public.shared_group_members enable row level security;
alter table public.shared_expenses      enable row level security;

-- shared_groups: los ven sus miembros; solo el creador edita/borra.
-- (crear pasa por el RPC create_shared_group)
drop policy if exists shared_groups_select on public.shared_groups;
create policy shared_groups_select on public.shared_groups for select
  using (is_shared_member(id));

drop policy if exists shared_groups_update on public.shared_groups;
create policy shared_groups_update on public.shared_groups for update
  using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists shared_groups_delete on public.shared_groups;
create policy shared_groups_delete on public.shared_groups for delete
  using (created_by = auth.uid());

-- shared_group_members: cualquier miembro puede sumar integrantes
-- ("de nombre" libres; usuarios reales solo si son sus amigos o él mismo).
-- Sacar integrantes pasa por el RPC remove_shared_member (limpia gastos).
drop policy if exists shared_members_select on public.shared_group_members;
create policy shared_members_select on public.shared_group_members for select
  using (user_id = auth.uid() or is_shared_member(group_id));

drop policy if exists shared_members_insert on public.shared_group_members;
create policy shared_members_insert on public.shared_group_members for insert
  with check (
    is_shared_member(group_id)
    and (user_id is null or user_id = auth.uid() or are_friends(auth.uid(), user_id))
  );

-- shared_expenses: los miembros ven, cargan y borran gastos del grupo.
drop policy if exists shared_expenses_select on public.shared_expenses;
create policy shared_expenses_select on public.shared_expenses for select
  using (is_shared_member(group_id));

drop policy if exists shared_expenses_insert on public.shared_expenses;
create policy shared_expenses_insert on public.shared_expenses for insert
  with check (is_shared_member(group_id) and created_by = auth.uid());

drop policy if exists shared_expenses_delete on public.shared_expenses;
create policy shared_expenses_delete on public.shared_expenses for delete
  using (is_shared_member(group_id));

-- ---------- RPCs ----------

-- Crear grupo: grupo + yo + amigos elegidos (con su perfil real) +
-- integrantes "de nombre", todo en una transacción.
create or replace function public.create_shared_group(
  p_nombre text, p_emoji text, p_gradient int,
  p_friend_ids uuid[], p_names text[], p_colors text[]
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  gid uuid;
  code text;
  tries int := 0;
  fid uuid;
  i int;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;

  loop
    code := upper(substr(md5(random()::text), 1, 6));
    begin
      insert into shared_groups (nombre, emoji, gradient_index, invite_code, created_by)
      values (trim(p_nombre), coalesce(nullif(p_emoji,''),'🍖'), coalesce(p_gradient,0), code, auth.uid())
      returning id into gid;
      exit;
    exception when unique_violation then
      tries := tries + 1;
      if tries > 5 then raise; end if;
    end;
  end loop;

  -- Yo, con mi perfil real
  insert into shared_group_members (group_id, user_id, nombre, color)
  select gid, p.id, p.username, p.avatar_color from profiles p where p.id = auth.uid();

  -- Amigos de Dayxo (solo si la amistad existe), con su perfil real
  if p_friend_ids is not null then
    foreach fid in array p_friend_ids loop
      if are_friends(auth.uid(), fid) then
        insert into shared_group_members (group_id, user_id, nombre, color)
        select gid, p.id, p.username, p.avatar_color from profiles p where p.id = fid
        on conflict do nothing;
      end if;
    end loop;
  end if;

  -- Integrantes "de nombre" (sin cuenta)
  if p_names is not null then
    for i in 1 .. coalesce(array_length(p_names, 1), 0) loop
      insert into shared_group_members (group_id, user_id, nombre, color)
      values (gid, null, trim(p_names[i]), coalesce(p_colors[i], '#6C5CE7'));
    end loop;
  end if;

  return gid;
end;
$$;

-- Unirse con el código del grupo (el "Invitar" ahora sirve de verdad).
create or replace function public.join_shared_group_by_code(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  gid uuid;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  select id into gid from shared_groups where invite_code = upper(trim(p_code));
  if gid is null then raise exception 'CODIGO_INVALIDO'; end if;
  insert into shared_group_members (group_id, user_id, nombre, color)
  select gid, p.id, p.username, p.avatar_color from profiles p where p.id = auth.uid()
  on conflict do nothing;
  return gid;
end;
$$;

-- Sumar un amigo a un grupo existente (validando amistad y membresía).
create or replace function public.add_shared_friend(p_group uuid, p_friend uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_shared_member(p_group) then raise exception 'NO_SOS_MIEMBRO'; end if;
  if not are_friends(auth.uid(), p_friend) then raise exception 'NO_ES_AMIGO'; end if;
  insert into shared_group_members (group_id, user_id, nombre, color)
  select p_group, p.id, p.username, p.avatar_color from profiles p where p.id = p_friend
  on conflict do nothing;
end;
$$;

-- Sacar un integrante (o salir uno mismo). Igual que la lógica local vieja:
-- borra los gastos que pagó y lo saca de los repartos. Si no queda ningún
-- usuario real, el grupo se borra (nadie podría verlo).
create or replace function public.remove_shared_member(p_member uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  m record;
begin
  select * into m from shared_group_members where id = p_member;
  if m is null then return; end if;
  if not is_shared_member(m.group_id) then raise exception 'NO_SOS_MIEMBRO'; end if;

  delete from shared_expenses where paid_by = p_member;
  update shared_expenses set split_between = array_remove(split_between, p_member)
    where m.group_id = group_id and p_member = any(split_between);
  delete from shared_group_members where id = p_member;

  if not exists (
    select 1 from shared_group_members where group_id = m.group_id and user_id is not null
  ) then
    delete from shared_groups where id = m.group_id;
  end if;
end;
$$;

-- ---------- Grants (¡siempre! — tablas por SQL no los heredan) ----------

grant select, insert, update, delete
  on public.shared_groups, public.shared_group_members, public.shared_expenses
  to authenticated;

grant execute on function
  public.is_shared_member(uuid),
  public.create_shared_group(text, text, int, uuid[], text[], text[]),
  public.join_shared_group_by_code(text),
  public.add_shared_friend(uuid, uuid),
  public.remove_shared_member(uuid)
to authenticated;
