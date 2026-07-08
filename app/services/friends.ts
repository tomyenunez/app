import { supabase } from './supabase';
import { weekXP } from './groups';

// Los ids de usuario son UUIDs (de la sesión o de una RPC). Validamos el formato
// antes de interpolarlos en filtros .or() de PostgREST: aunque hoy vienen de
// fuentes confiables, esto evita que un id malformado rompa o tuerza el filtro.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (id: unknown): id is string => typeof id === 'string' && UUID_RE.test(id);

// Datos públicos de otro usuario (lo que se muestra en Social)
export interface PublicUser {
  id: string;
  username: string;
  avatarColor: string;
  avatarUrl?: string;
}

// Una entrada de amigo o solicitud, ya enriquecida con el perfil del otro
export interface FriendEntry {
  friendshipId: string;
  user: PublicUser;
}

export interface FriendsData {
  friends: FriendEntry[];   // amistades aceptadas
  incoming: FriendEntry[];  // solicitudes que me mandaron (yo decido)
  outgoing: FriendEntry[];  // solicitudes que mandé (esperando respuesta)
}

function toUser(p: any): PublicUser {
  return { id: p.id, username: p.username, avatarColor: p.avatar_color, avatarUrl: p.avatar_url ?? undefined };
}

// Mi propio código para compartir
export async function getMyFriendCode(uid: string): Promise<string | null> {
  const { data, error } = await supabase.from('profiles').select('friend_code').eq('id', uid).maybeSingle();
  if (error) console.warn('[Dayxo amigos] código:', error.message);
  return data?.friend_code ?? null;
}

// Buscar un usuario por su código de amigo (vía RPC, sin exponer la tabla)
export async function findByCode(code: string): Promise<PublicUser | null> {
  const { data, error } = await supabase.rpc('find_user_by_friend_code', { code: code.trim() });
  if (error) { console.warn('[Dayxo amigos] buscar:', error.message); return null; }
  const row = Array.isArray(data) ? data[0] : data;
  return row ? toUser(row) : null;
}

// Buscar el vínculo existente entre dos usuarios (en cualquier dirección)
async function existingFriendship(uid: string, otherId: string) {
  if (!isUuid(uid) || !isUuid(otherId)) return null;
  const { data } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status')
    .or(`and(requester_id.eq.${uid},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${uid})`)
    .limit(1);
  return data?.[0] ?? null;
}

// Enviar solicitud. Maneja los casos: ya son amigos, ya la mandé, o la otra
// persona ya me mandó (en ese caso, acepto directamente).
export async function sendRequest(uid: string, other: PublicUser): Promise<{ ok: boolean; message: string }> {
  const existing = await existingFriendship(uid, other.id);
  if (existing) {
    if (existing.status === 'accepted') return { ok: false, message: `Ya sos amigo de ${other.username}.` };
    if (existing.addressee_id === uid) {
      const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', existing.id);
      if (error) return { ok: false, message: 'No se pudo aceptar la solicitud.' };
      return { ok: true, message: `¡Ahora sos amigo de ${other.username}!` };
    }
    return { ok: false, message: `Ya le enviaste una solicitud a ${other.username}.` };
  }
  const { error } = await supabase.from('friendships').insert({ requester_id: uid, addressee_id: other.id, status: 'pending' });
  if (error) return { ok: false, message: 'No se pudo enviar la solicitud.' };
  return { ok: true, message: `Solicitud enviada a ${other.username}.` };
}

export async function acceptRequest(friendshipId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
  return { error: error?.message ?? null };
}

// Sirve para rechazar una solicitud, cancelar una que mandé, o eliminar un amigo
export async function removeFriendship(friendshipId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  return { error: error?.message ?? null };
}

// Perfil completo de un amigo (stats de juego incluidos, vía RPC con
// security definer — game_state tiene RLS por usuario)
export interface FriendProfile {
  user: PublicUser;
  xpTotal: number;
  xpThisWeek: number;
  streak: number;
  longestStreak: number;
  badgesCount: number;
  totalHabitsCompleted: number;
  totalTodosCompleted: number;
}

export async function getFriendProfile(friendId: string): Promise<FriendProfile | null> {
  const { data, error } = await supabase.rpc('friend_profile', { fid: friendId });
  if (error) { console.warn('[Dayxo amigos] perfil:', error.message); return null; }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  const records = row.records ?? {};
  return {
    user: toUser(row),
    xpTotal: Number(row.xp_total) || 0,
    xpThisWeek: weekXP(row.xp_daily),
    streak: row.streak ?? 0,
    longestStreak: row.longest_streak ?? 0,
    badgesCount: Object.keys(row.badges ?? {}).length,
    totalHabitsCompleted: records.totalHabitsCompleted ?? 0,
    totalTodosCompleted: records.totalTodosCompleted ?? 0,
  };
}

// Trae todos mis vínculos y los clasifica, con el perfil del otro
export async function listFriends(uid: string): Promise<FriendsData> {
  const empty: FriendsData = { friends: [], incoming: [], outgoing: [] };
  if (!isUuid(uid)) return empty;
  const { data: rows, error } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status')
    .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`)
    .order('created_at', { ascending: false });
  if (error) { console.warn('[Dayxo amigos] listar:', error.message); return empty; }
  const list = rows ?? [];
  if (list.length === 0) return empty;

  const otherIds = list.map((r) => (r.requester_id === uid ? r.addressee_id : r.requester_id));
  const { data: profs } = await supabase
    .from('profiles')
    .select('id, username, avatar_color, avatar_url')
    .in('id', otherIds);
  const byId: Record<string, PublicUser> = {};
  (profs ?? []).forEach((p: any) => { byId[p.id] = toUser(p); });

  const out: FriendsData = { friends: [], incoming: [], outgoing: [] };
  for (const r of list) {
    const otherId = r.requester_id === uid ? r.addressee_id : r.requester_id;
    const user = byId[otherId];
    if (!user) continue;
    const entry: FriendEntry = { friendshipId: r.id, user };
    if (r.status === 'accepted') out.friends.push(entry);
    else if (r.addressee_id === uid) out.incoming.push(entry);
    else out.outgoing.push(entry);
  }
  return out;
}
