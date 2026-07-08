-- ============================================================================
-- Dayxo · 0005_security_audit.sql  (SOLO LEE — no cambia nada)
-- Radiografía de seguridad de la base. Corré esto en el SQL Editor y pegame
-- las 5 tablas de resultados. Con eso sé exactamente dónde hay que blindar.
-- ============================================================================

-- 1) RLS por tabla. rowsecurity=false en una tabla con datos = AGUJERO GRAVE
--    (cualquier usuario logueado podría leer/editar filas de otros).
select tablename,
       rowsecurity as rls_activo,
       (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=t.tablename) as politicas
from pg_tables t
where schemaname='public'
order by rowsecurity asc, tablename;

-- 2) Grants a anon/authenticated. anon NO debería tener nada en tablas de datos.
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as permisos
from information_schema.role_table_grants
where table_schema='public' and grantee in ('anon','authenticated')
group by table_name, grantee
order by table_name, grantee;

-- 3) Funciones SECURITY DEFINER (corren con permisos del dueño → si están mal
--    hechas saltean RLS). CADA una debe tener search_path fijo en proconfig.
--    Si proconfig es NULL → search_path mutable = riesgo de hijacking.
select p.proname as funcion,
       p.prosecdef as security_definer,
       p.proconfig as settings
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.prosecdef
order by p.proname;

-- 4) Policies existentes en detalle (para ver si filtran por auth.uid()).
select tablename, policyname, cmd, roles::text,
       coalesce(qual, '(sin USING)') as using_expr,
       coalesce(with_check, '(sin CHECK)') as check_expr
from pg_policies
where schemaname='public'
order by tablename, cmd;

-- 5) Advisors de seguridad de Supabase (tablas sin RLS, funciones inseguras).
--    Si no existe la vista, ignorá el error de esta última query.
select name, title, level, categories
from pg_catalog.pg_available_extensions
where false;  -- placeholder; los advisors reales están en Dashboard → Advisors → Security
