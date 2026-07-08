import { supabase } from './supabase';
import { SharedGroup, SharedMember, SharedExpense } from '../types';
import { GROUP_COVER_GRADIENTS } from '../components/groups/types';

// ============================================================
// Gastos compartidos — capa de datos (Supabase).
// Esquema en supabase/shared_groups.sql. Modelo Splitwise: los amigos
// de Dayxo entran directo como integrantes; también hay integrantes
// "de nombre" (user_id null) para gente sin cuenta.
// ============================================================

export interface CreateSharedGroupInput {
  nombre: string;
  emoji: string;
  gradientIndex: number;
  friendIds: string[];                          // amigos de Dayxo → integrantes directos
  placeholders: { nombre: string; color: string }[]; // integrantes "de nombre"
}

function toMember(r: any, uid: string, liveProfile?: any): SharedMember {
  return {
    id: r.id,
    nombre: liveProfile?.username ?? r.nombre,
    color: liveProfile?.avatar_color ?? r.color,
    ...(r.user_id === uid ? { isYou: true } : {}),
    ...(r.user_id ? { userId: r.user_id } : {}),
  };
}

function toExpense(r: any): SharedExpense {
  return {
    id: r.id,
    desc: r.descripcion,
    monto: Number(r.monto),
    paidBy: r.paid_by,
    splitBetween: r.split_between ?? [],
    fecha: r.fecha,
    createdBy: r.created_by ?? undefined,
  };
}

export async function listSharedGroups(uid: string): Promise<SharedGroup[]> {
  const { data: mine, error } = await supabase
    .from('shared_group_members')
    .select('group_id')
    .eq('user_id', uid);
  if (error) { console.warn('[Dayxo compartidos] mis grupos:', error.message); return []; }
  const ids = [...new Set((mine ?? []).map((m) => m.group_id))];
  if (ids.length === 0) return [];

  const [groupsRes, membersRes, expensesRes] = await Promise.all([
    supabase.from('shared_groups').select('*').in('id', ids),
    supabase.from('shared_group_members').select('*').in('group_id', ids).order('created_at'),
    supabase.from('shared_expenses').select('*').in('group_id', ids).order('created_at', { ascending: false }),
  ]);
  if (groupsRes.error) { console.warn('[Dayxo compartidos] datos:', groupsRes.error.message); return []; }

  // Perfil vivo de los integrantes reales (username/avatar actuales)
  const userIds = [...new Set((membersRes.data ?? []).map((m: any) => m.user_id).filter(Boolean))];
  const { data: profs } = userIds.length
    ? await supabase.from('profiles').select('id, username, avatar_color').in('id', userIds)
    : { data: [] as any[] };
  const profById: Record<string, any> = {};
  (profs ?? []).forEach((p: any) => { profById[p.id] = p; });

  const membersByGroup: Record<string, SharedMember[]> = {};
  (membersRes.data ?? []).forEach((m: any) => {
    (membersByGroup[m.group_id] ??= []).push(toMember(m, uid, m.user_id ? profById[m.user_id] : undefined));
  });
  const expensesByGroup: Record<string, SharedExpense[]> = {};
  (expensesRes.data ?? []).forEach((e: any) => {
    (expensesByGroup[e.group_id] ??= []).push(toExpense(e));
  });

  return (groupsRes.data ?? [])
    .map((g: any): SharedGroup => ({
      id: g.id,
      nombre: g.nombre,
      emoji: g.emoji,
      gradient: GROUP_COVER_GRADIENTS[g.gradient_index] ?? GROUP_COVER_GRADIENTS[0],
      inviteCode: g.invite_code,
      members: membersByGroup[g.id] ?? [],
      expenses: expensesByGroup[g.id] ?? [],
      createdAt: g.created_at,
      createdBy: g.created_by,
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function createSharedGroup(input: CreateSharedGroupInput): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('create_shared_group', {
    p_nombre: input.nombre,
    p_emoji: input.emoji,
    p_gradient: input.gradientIndex,
    p_friend_ids: input.friendIds,
    p_names: input.placeholders.map((p) => p.nombre),
    p_colors: input.placeholders.map((p) => p.color),
  });
  if (error) { console.warn('[Dayxo compartidos] crear:', error.message); return { id: null, error: 'No se pudo crear el grupo.' }; }
  return { id: data as string, error: null };
}

export async function joinSharedGroupByCode(code: string): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('join_shared_group_by_code', { p_code: code });
  if (error) {
    const msg = error.message.includes('CODIGO_INVALIDO')
      ? 'No existe ningún grupo con ese código.'
      : 'No se pudo unir al grupo.';
    return { id: null, error: msg };
  }
  return { id: data as string, error: null };
}

export async function deleteSharedGroup(groupId: string): Promise<void> {
  const { error } = await supabase.from('shared_groups').delete().eq('id', groupId);
  if (error) console.warn('[Dayxo compartidos] eliminar:', error.message);
}

export async function addSharedExpense(groupId: string, uid: string, e: Omit<SharedExpense, 'id'>): Promise<void> {
  const { error } = await supabase.from('shared_expenses').insert({
    group_id: groupId,
    descripcion: e.desc,
    monto: e.monto,
    paid_by: e.paidBy,
    split_between: e.splitBetween,
    fecha: e.fecha,
    created_by: uid,
  });
  if (error) console.warn('[Dayxo compartidos] gasto:', error.message);
}

export async function removeSharedExpense(expenseId: string): Promise<void> {
  const { error } = await supabase.from('shared_expenses').delete().eq('id', expenseId);
  if (error) console.warn('[Dayxo compartidos] borrar gasto:', error.message);
}

export async function addPlaceholderMember(groupId: string, nombre: string, color: string): Promise<void> {
  const { error } = await supabase.from('shared_group_members').insert({
    group_id: groupId, user_id: null, nombre, color,
  });
  if (error) console.warn('[Dayxo compartidos] integrante:', error.message);
}

export async function addFriendMember(groupId: string, friendId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('add_shared_friend', { p_group: groupId, p_friend: friendId });
  if (error) {
    console.warn('[Dayxo compartidos] sumar amigo:', error.message);
    return { error: 'No se pudo sumar al amigo.' };
  }
  return { error: null };
}

// Saca un integrante (o te saca a vos): borra sus gastos pagados y lo quita
// de los repartos, como hacía la lógica local.
export async function removeSharedMember(memberId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_shared_member', { p_member: memberId });
  if (error) console.warn('[Dayxo compartidos] sacar integrante:', error.message);
}
