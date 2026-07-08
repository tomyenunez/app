-- ============================================================================
-- Dayxo · Borrar cuenta (requisito de Apple: guideline 5.1.1(v))
-- Correr en: Supabase Dashboard → SQL Editor → New query → Run (idempotente)
--
-- Función que el usuario invoca desde la app (botón "Eliminar cuenta").
-- Borra TODOS sus datos y su cuenta de auth. SECURITY DEFINER con search_path
-- fijo; solo ejecutable por usuarios autenticados y solo sobre sí mismos
-- (usa auth.uid(), no recibe parámetros — imposible borrar a otro).
-- ============================================================================

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r record;
begin
  if uid is null then
    raise exception 'No autenticado';
  end if;

  -- 1) Datos en TODAS las tablas de public que tengan columna user_id
  --    (dinámico: cubre también tablas futuras sin tocar esta función).
  for r in
    select c.table_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = 'public' and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
    where c.table_schema = 'public' and c.column_name = 'user_id'
  loop
    execute format('delete from public.%I where user_id = $1', r.table_name) using uid;
  end loop;

  -- 2) Casos especiales (no usan user_id como columna de dueño)
  delete from public.friendships where requester_id = uid or addressee_id = uid;
  delete from public.profiles where id = uid;

  -- 3) Avatar en Storage (best effort: si falla, no bloquea el borrado)
  begin
    delete from storage.objects
    where bucket_id = 'avatars' and name like uid::text || '/%';
  exception when others then
    null;
  end;

  -- 4) La cuenta de auth (esto invalida la sesión del usuario)
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;
