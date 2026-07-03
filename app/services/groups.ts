import { supabase } from './supabase';
import { startOfWeek } from 'date-fns';

// ============================================================
// Grupos — capa de datos (Supabase). Esquema en supabase/groups.sql.
// Sigue el patrón de services/friends.ts: funciones sueltas que devuelven
// datos ya enriquecidos para la UI.
// ============================================================

export interface GroupSummary {
  id: string;
  name: string;
  emoji: string;
  gradientIndex: number;
  inviteCode: string;
  createdBy: string;
  createdAt: string; // ISO
  memberCount: number;
  isAdmin: boolean;
}

export interface GroupMemberXP {
  userId: string;
  username: string;
  avatarColor: string;
  avatarUrl?: string;
  isAdmin: boolean;
  joinedAt: string;   // ISO
  xpTotal: number;
  xpThisWeek: number; // calculado desde xp_daily (lunes → hoy)
}

export interface MyGroupInvite {
  id: string;
  groupId: string;
  groupName: string;
  groupEmoji: string;
  inviterName: string;
}

export interface GroupActivityEvent {
  id: string;
  groupId: string;
  emoji: string;
  text: string;      // los nombres van entre **asteriscos** (la UI los pone en negrita)
  timestamp: string; // relativo: "Hace 20 min"
  createdAt: string; // ISO
}

function fromGroupRow(r: any, memberCount: number, isAdmin: boolean): GroupSummary {
  return {
    id: r.id, name: r.name, emoji: r.emoji,
    gradientIndex: r.gradient_index ?? 0,
    inviteCode: r.invite_code, createdBy: r.created_by, createdAt: r.created_at,
    memberCount, isAdmin,
  };
}

// XP de la semana actual a partir del JSON xp_daily ({ "YYYY-M-D": number })
export function weekXP(xpDaily: Record<string, number> | null): number {
  if (!xpDaily) return 0;
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  let sum = 0;
  Object.entries(xpDaily).forEach(([key, xp]) => {
    const [y, m, d] = key.split('-').map(Number);
    if (y && new Date(y, (m || 1) - 1, d || 1) >= weekStart) sum += Number(xp) || 0;
  });
  return Math.round(sum);
}

// "Hace 20 min" / "Hace 3 hs" / "Ayer" / "Hace 5 días"
export function relativeTime(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'Recién';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? 'hora' : 'hs'}`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  if (days < 30) return `Hace ${days} días`;
  const months = Math.floor(days / 30);
  return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
}

// --- Mis grupos ---

export async function listMyGroups(uid: string): Promise<GroupSummary[]> {
  const { data: mems, error } = await supabase
    .from('group_members')
    .select('group_id, role')
    .eq('user_id', uid);
  if (error) { console.warn('[Dayxo grupos] mis grupos:', error.message); return []; }
  const ids = (mems ?? []).map((m) => m.group_id);
  if (ids.length === 0) return [];

  const [groupsRes, countsRes] = await Promise.all([
    supabase.from('groups').select('*').in('id', ids),
    supabase.from('group_members').select('group_id').in('group_id', ids),
  ]);
  if (groupsRes.error) { console.warn('[Dayxo grupos] datos:', groupsRes.error.message); return []; }

  const counts: Record<string, number> = {};
  (countsRes.data ?? []).forEach((r: any) => { counts[r.group_id] = (counts[r.group_id] ?? 0) + 1; });
  const roleById: Record<string, string> = {};
  (mems ?? []).forEach((m: any) => { roleById[m.group_id] = m.role; });

  return (groupsRes.data ?? [])
    .map((g: any) => fromGroupRow(g, counts[g.id] ?? 1, roleById[g.id] === 'admin'))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// --- Crear / unirse / invitaciones ---

export async function createGroup(
  name: string, emoji: string, gradientIndex: number,
): Promise<{ group: GroupSummary | null; error: string | null }> {
  const { data, error } = await supabase.rpc('create_group', {
    p_name: name, p_emoji: emoji, p_gradient: gradientIndex,
  });
  if (error) { console.warn('[Dayxo grupos] crear:', error.message); return { group: null, error: 'No se pudo crear el grupo.' }; }
  const row = Array.isArray(data) ? data[0] : data;
  return { group: fromGroupRow(row, 1, true), error: null };
}

export async function joinGroupByCode(code: string): Promise<{ groupId: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('join_group_by_code', { p_code: code });
  if (error) {
    const msg = error.message.includes('CODIGO_INVALIDO')
      ? 'No existe ningún grupo con ese código.'
      : 'No se pudo unir al grupo.';
    return { groupId: null, error: msg };
  }
  return { groupId: data as string, error: null };
}

export async function inviteFriendToGroup(
  groupId: string, inviterId: string, friendId: string,
): Promise<{ ok: boolean; message: string }> {
  const { error } = await supabase.from('group_invites').insert({
    group_id: groupId, inviter_id: inviterId, invitee_id: friendId,
  });
  if (error) {
    if (error.code === '23505') return { ok: false, message: 'Ya tiene una invitación pendiente.' };
    console.warn('[Dayxo grupos] invitar:', error.message);
    return { ok: false, message: 'No se pudo enviar la invitación.' };
  }
  return { ok: true, message: 'Invitación enviada.' };
}

export async function listMyInvites(uid: string): Promise<MyGroupInvite[]> {
  const { data: invs, error } = await supabase
    .from('group_invites')
    .select('id, group_id, inviter_id')
    .eq('invitee_id', uid)
    .order('created_at', { ascending: false });
  if (error || !invs || invs.length === 0) return [];

  const groupIds = [...new Set(invs.map((i) => i.group_id))];
  const inviterIds = [...new Set(invs.map((i) => i.inviter_id))];
  const [groupsRes, profsRes] = await Promise.all([
    supabase.from('groups').select('id, name, emoji').in('id', groupIds),
    supabase.from('profiles').select('id, username').in('id', inviterIds),
  ]);
  const gById: Record<string, any> = {};
  (groupsRes.data ?? []).forEach((g: any) => { gById[g.id] = g; });
  const pById: Record<string, any> = {};
  (profsRes.data ?? []).forEach((p: any) => { pById[p.id] = p; });

  return invs
    .filter((i) => gById[i.group_id])
    .map((i) => ({
      id: i.id,
      groupId: i.group_id,
      groupName: gById[i.group_id].name,
      groupEmoji: gById[i.group_id].emoji,
      inviterName: pById[i.inviter_id]?.username ?? 'alguien',
    }));
}

export async function acceptGroupInvite(inviteId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('accept_group_invite', { p_invite: inviteId });
  if (error) { console.warn('[Dayxo grupos] aceptar:', error.message); return { error: 'No se pudo aceptar la invitación.' }; }
  return { error: null };
}

export async function declineGroupInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.from('group_invites').delete().eq('id', inviteId);
  if (error) console.warn('[Dayxo grupos] rechazar:', error.message);
}

// Invitaciones pendientes de un grupo (para Configuración)
export async function listGroupPendingInvites(groupId: string): Promise<{ id: string; invitedUsername: string; invitedByUsername: string; avatarColor: string }[]> {
  const { data: invs } = await supabase
    .from('group_invites')
    .select('id, invitee_id, inviter_id')
    .eq('group_id', groupId);
  if (!invs || invs.length === 0) return [];
  const ids = [...new Set(invs.flatMap((i) => [i.invitee_id, i.inviter_id]))];
  const { data: profs } = await supabase.from('profiles').select('id, username, avatar_color').in('id', ids);
  const pById: Record<string, any> = {};
  (profs ?? []).forEach((p: any) => { pById[p.id] = p; });
  return invs.map((i) => ({
    id: i.id,
    invitedUsername: pById[i.invitee_id]?.username ?? '¿?',
    invitedByUsername: pById[i.inviter_id]?.username ?? '¿?',
    avatarColor: pById[i.invitee_id]?.avatar_color ?? '#6C5CE7',
  }));
}

export async function cancelGroupInvite(inviteId: string): Promise<void> {
  await declineGroupInvite(inviteId);
}

// --- Miembros / ranking ---

export async function listGroupMembers(groupId: string): Promise<GroupMemberXP[]> {
  const { data, error } = await supabase.rpc('group_members_xp', { p_group: groupId });
  if (error) { console.warn('[Dayxo grupos] miembros:', error.message); return []; }
  return (data ?? []).map((r: any) => ({
    userId: r.user_id,
    username: r.username,
    avatarColor: r.avatar_color,
    avatarUrl: r.avatar_url ?? undefined,
    isAdmin: r.role === 'admin',
    joinedAt: r.joined_at,
    xpTotal: Number(r.xp_total) || 0,
    xpThisWeek: weekXP(r.xp_daily),
  }));
}

export async function removeMember(groupId: string, userId: string, username: string, actorId: string): Promise<void> {
  const { error } = await supabase.from('group_members').delete()
    .eq('group_id', groupId).eq('user_id', userId);
  if (error) { console.warn('[Dayxo grupos] expulsar:', error.message); return; }
  await supabase.from('group_activity').insert({
    group_id: groupId, actor_id: actorId, type: 'member_removed', payload: { username },
  });
}

export async function makeAdmin(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('group_members').update({ role: 'admin' })
    .eq('group_id', groupId).eq('user_id', userId);
  if (error) console.warn('[Dayxo grupos] admin:', error.message);
}

// --- Editar / salir / eliminar ---

export async function updateGroup(
  groupId: string, actorId: string,
  fields: { name?: string; emoji?: string; gradientIndex?: number }, renamed: boolean,
): Promise<{ error: string | null }> {
  const patch: any = {};
  if (fields.name !== undefined) patch.name = fields.name.trim();
  if (fields.emoji !== undefined) patch.emoji = fields.emoji;
  if (fields.gradientIndex !== undefined) patch.gradient_index = fields.gradientIndex;
  const { error } = await supabase.from('groups').update(patch).eq('id', groupId);
  if (error) { console.warn('[Dayxo grupos] editar:', error.message); return { error: 'No se pudieron guardar los cambios.' }; }
  if (renamed && patch.name) {
    await supabase.from('group_activity').insert({
      group_id: groupId, actor_id: actorId, type: 'group_renamed', payload: { name: patch.name },
    });
  }
  return { error: null };
}

export async function leaveGroup(groupId: string): Promise<void> {
  const { error } = await supabase.rpc('leave_group', { p_group: groupId });
  if (error) console.warn('[Dayxo grupos] salir:', error.message);
}

export async function deleteGroup(groupId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('groups').delete().eq('id', groupId);
  if (error) { console.warn('[Dayxo grupos] eliminar:', error.message); return { error: 'No se pudo eliminar el grupo.' }; }
  return { error: null };
}

// --- Novedades (feed real) ---

const ACTIVITY_META: Record<string, { emoji: string; text: (actor: string, group: string, payload: any) => string }> = {
  group_created:  { emoji: '🎉', text: (a, g) => `**${a}** creó el grupo **${g}**` },
  member_joined:  { emoji: '👋', text: (a, g) => `**${a}** se unió a **${g}**` },
  member_left:    { emoji: '🚪', text: (a, g) => `**${a}** salió de **${g}**` },
  member_removed: { emoji: '🚪', text: (_a, g, p) => `**${p?.username ?? 'Alguien'}** fue eliminado de **${g}**` },
  group_renamed:  { emoji: '✏️', text: (a, _g, p) => `**${a}** renombró el grupo a **${p?.name ?? '...'}**` },
};

export async function listActivity(groupIds: string[], groupNames: Record<string, string>): Promise<GroupActivityEvent[]> {
  if (groupIds.length === 0) return [];
  const { data: rows, error } = await supabase
    .from('group_activity')
    .select('id, group_id, actor_id, type, payload, created_at')
    .in('group_id', groupIds)
    .order('created_at', { ascending: false })
    .limit(8);
  if (error || !rows || rows.length === 0) return [];

  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))];
  const { data: profs } = actorIds.length
    ? await supabase.from('profiles').select('id, username').in('id', actorIds)
    : { data: [] as any[] };
  const nameById: Record<string, string> = {};
  (profs ?? []).forEach((p: any) => { nameById[p.id] = p.username; });

  return rows
    .filter((r) => ACTIVITY_META[r.type])
    .map((r) => {
      const meta = ACTIVITY_META[r.type];
      const actor = (r.actor_id && nameById[r.actor_id]) || 'Alguien';
      const group = groupNames[r.group_id] ?? 'un grupo';
      return {
        id: r.id,
        groupId: r.group_id,
        emoji: meta.emoji,
        text: meta.text(actor, group, r.payload),
        timestamp: relativeTime(r.created_at),
        createdAt: r.created_at,
      };
    });
}
