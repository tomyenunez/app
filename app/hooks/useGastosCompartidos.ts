import { useState, useEffect, useCallback } from 'react';
import { SharedGroup, SharedMember, SharedExpense } from '../types';
import { getSharedGroups, saveSharedGroups } from '../services/storage';

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const inviteCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

// Gastos compartidos con persistencia local (sin backend todavía). Permite
// crear grupos, sumar integrantes y cargar gastos — todo andando para visualizar.
export function useGastosCompartidos() {
  const [groups, setGroups] = useState<SharedGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSharedGroups().then((g) => { setGroups(g); setLoading(false); });
  }, []);

  // Persiste y actualiza estado de una sola vez.
  const commit = useCallback((next: SharedGroup[]) => {
    setGroups(next);
    saveSharedGroups(next);
  }, []);

  const createGroup = useCallback((data: {
    nombre: string; emoji: string; gradient: [string, string]; members: SharedMember[];
  }): string => {
    const id = uid();
    const group: SharedGroup = {
      id,
      nombre: data.nombre,
      emoji: data.emoji,
      gradient: data.gradient,
      inviteCode: inviteCode(),
      members: data.members,
      expenses: [],
      createdAt: new Date().toISOString(),
    };
    setGroups((prev) => { const next = [group, ...prev]; saveSharedGroups(next); return next; });
    return id;
  }, []);

  const deleteGroup = useCallback((id: string) => {
    setGroups((prev) => { const next = prev.filter((g) => g.id !== id); saveSharedGroups(next); return next; });
  }, []);

  const patchGroup = useCallback((id: string, fn: (g: SharedGroup) => SharedGroup) => {
    setGroups((prev) => {
      const next = prev.map((g) => (g.id === id ? fn(g) : g));
      saveSharedGroups(next);
      return next;
    });
  }, []);

  const addMember = useCallback((groupId: string, member: Omit<SharedMember, 'id'>) => {
    patchGroup(groupId, (g) => ({ ...g, members: [...g.members, { ...member, id: uid() }] }));
  }, [patchGroup]);

  const removeMember = useCallback((groupId: string, memberId: string) => {
    patchGroup(groupId, (g) => ({
      ...g,
      members: g.members.filter((m) => m.id !== memberId),
      // Limpia los gastos: saca al miembro de los repartos y descarta los que pagó él.
      expenses: g.expenses
        .filter((e) => e.paidBy !== memberId)
        .map((e) => ({ ...e, splitBetween: e.splitBetween.filter((x) => x !== memberId) })),
    }));
  }, [patchGroup]);

  const addExpense = useCallback((groupId: string, expense: Omit<SharedExpense, 'id'>) => {
    patchGroup(groupId, (g) => ({ ...g, expenses: [{ ...expense, id: uid() }, ...g.expenses] }));
  }, [patchGroup]);

  const removeExpense = useCallback((groupId: string, expenseId: string) => {
    patchGroup(groupId, (g) => ({ ...g, expenses: g.expenses.filter((e) => e.id !== expenseId) }));
  }, [patchGroup]);

  return {
    groups, loading,
    createGroup, deleteGroup,
    addMember, removeMember,
    addExpense, removeExpense,
  };
}
