import { useState, useEffect, useCallback } from 'react';
import { SharedGroup, SharedMember, SharedExpense } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  listSharedGroups, createSharedGroup, joinSharedGroupByCode, deleteSharedGroup,
  addSharedExpense, removeSharedExpense, addPlaceholderMember, addFriendMember,
  removeSharedMember, CreateSharedGroupInput,
} from '../services/sharedGroups';

// Gastos compartidos con backend Supabase: los grupos se sincronizan entre
// cuentas (los amigos de Dayxo los ven en su app). Mutaciones optimistas +
// refresh desde la nube.
export function useGastosCompartidos() {
  const { user } = useAuth();
  const uid = user?.id;
  const [groups, setGroups] = useState<SharedGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!uid) return;
    setGroups(await listSharedGroups(uid));
    setLoading(false);
  }, [uid]);

  useEffect(() => { refresh(); }, [refresh]);

  const createGroup = useCallback(async (input: CreateSharedGroupInput): Promise<string | null> => {
    const res = await createSharedGroup(input);
    if (res.id) await refresh();
    return res.id;
  }, [refresh]);

  const joinByCode = useCallback(async (code: string) => {
    const res = await joinSharedGroupByCode(code);
    if (res.id) await refresh();
    return res;
  }, [refresh]);

  const deleteGroup = useCallback(async (id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id)); // optimista
    await deleteSharedGroup(id);
    await refresh();
  }, [refresh]);

  const addMember = useCallback(async (groupId: string, member: Omit<SharedMember, 'id'>) => {
    if (member.userId) await addFriendMember(groupId, member.userId);
    else await addPlaceholderMember(groupId, member.nombre, member.color);
    await refresh();
  }, [refresh]);

  const removeMember = useCallback(async (_groupId: string, memberId: string) => {
    await removeSharedMember(memberId);
    await refresh();
  }, [refresh]);

  const addExpense = useCallback(async (groupId: string, expense: Omit<SharedExpense, 'id'>) => {
    if (!uid) return;
    // Optimista: aparece al instante con id provisorio, y el refresh trae el real
    const tempId = `tmp-${Date.now()}`;
    setGroups((prev) => prev.map((g) =>
      g.id === groupId ? { ...g, expenses: [{ ...expense, id: tempId }, ...g.expenses] } : g,
    ));
    await addSharedExpense(groupId, uid, expense);
    await refresh();
  }, [uid, refresh]);

  const removeExpense = useCallback(async (groupId: string, expenseId: string) => {
    setGroups((prev) => prev.map((g) =>
      g.id === groupId ? { ...g, expenses: g.expenses.filter((e) => e.id !== expenseId) } : g,
    ));
    await removeSharedExpense(expenseId);
    await refresh();
  }, [refresh]);

  return {
    groups, loading, refresh,
    createGroup, joinByCode, deleteGroup,
    addMember, removeMember,
    addExpense, removeExpense,
  };
}
