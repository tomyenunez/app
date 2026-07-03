-- ============================================================
-- Dayxo · Perfil de amigo — RPC para ver los stats de un amigo
-- Correr UNA VEZ en Supabase → SQL Editor → Run.
-- Requiere que ya exista are_friends() (viene de groups.sql).
-- ============================================================

-- Devuelve perfil + stats de juego de OTRO usuario, solo si es tu amigo
-- (o vos mismo). game_state tiene RLS por usuario: por eso esto es un
-- security definer que valida la amistad antes de abrir los datos.
create or replace function public.friend_profile(fid uuid)
returns table (
  id uuid, username text, avatar_color text, avatar_url text,
  xp_total numeric, streak int, longest_streak int,
  badges jsonb, records jsonb, xp_daily jsonb
) language sql security definer set search_path = public stable as $$
  select p.id, p.username, p.avatar_color, p.avatar_url,
         coalesce(gs.xp_total, 0)::numeric as xp_total,
         coalesce(gs.streak, 0)::int as streak,
         coalesce(gs.longest_streak, 0)::int as longest_streak,
         coalesce(gs.badges, '{}'::jsonb) as badges,
         coalesce(gs.records, '{}'::jsonb) as records,
         coalesce(gs.xp_daily, '{}'::jsonb) as xp_daily
  from profiles p
  left join game_state gs on gs.user_id = p.id
  where p.id = fid
    and (fid = auth.uid() or are_friends(auth.uid(), fid));
$$;

grant execute on function public.friend_profile(uuid) to authenticated;
