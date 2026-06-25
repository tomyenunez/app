import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Transaction } from '../types';
import { todayKey, dateKey } from '../utils/dateUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { awardXPOnce, reverseXPOnce } from '../services/xpService';
import { XP_VALUES } from '../constants/xpValues';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

// Mapeo entre la fila de la tabla `transactions` y el tipo Transaction de la app
function fromRow(r: any): Transaction {
  return {
    id: r.id,
    desc: r.descripcion ?? '',
    monto: Number(r.monto),
    tipo: r.tipo,
    fecha: r.fecha,
    fechaStr: r.fecha_str,
    ...(r.categoria ? { categoria: r.categoria } : {}),
    ...(r.metodo ? { metodo: r.metodo } : {}),
    ...(r.pinned ? { pinned: true } : {}),
  };
}
function toRow(t: Transaction, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    descripcion: t.desc,
    monto: t.monto,
    tipo: t.tipo,
    fecha: t.fecha,
    fecha_str: t.fechaStr,
    categoria: t.categoria ?? null,
    metodo: t.metodo ?? null,
    pinned: !!t.pinned,
  };
}

export function usePresupuesto() {
  const { user } = useAuth();
  const userId = user?.id;
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Recarga al enfocar el tab: trae las transacciones del usuario desde la nube
  useFocusEffect(
    useCallback(() => {
      if (!userId) { setTxs([]); setLoading(false); return; }
      let active = true;
      (async () => {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });
        if (!active) return;
        if (error) console.warn('[Dayxo tx] leer:', error.message);
        setTxs((data ?? []).map(fromRow));
        setLoading(false);
      })();
      return () => { active = false; };
    }, [userId])
  );

  const add = useCallback(async (
    desc: string,
    monto: number,
    tipo: Transaction['tipo'],
    categoria?: string,
    metodo?: string,
    fecha?: Date,
  ) => {
    if (!userId) return;
    const d = fecha ?? new Date();
    const next: Transaction = {
      id: Date.now().toString(),
      desc,
      monto,
      tipo,
      fecha: dateKey(d),
      fechaStr: format(d, "d 'de' MMMM", { locale: es }),
      ...(categoria ? { categoria } : {}),
      ...(metodo ? { metodo } : {}),
    };
    setTxs((prev) => [next, ...prev]);
    const { error } = await supabase.from('transactions').insert(toRow(next, userId));
    if (error) console.warn('[Dayxo tx] crear:', error.message);
    awardXPOnce(`tx-${next.id}`, XP_VALUES.LOG_TRANSACTION, 'Movimiento registrado');
  }, [userId]);

  const update = useCallback(async (
    id: string,
    desc: string,
    monto: number,
    categoria?: string,
    metodo?: string,
    fecha?: Date,
  ) => {
    const t = txs.find((x) => x.id === id);
    if (!t) return;
    let base = fecha;
    if (!base) {
      const [y, m, dd] = t.fecha.split('-').map(Number);
      base = new Date(y, (m || 1) - 1, dd || 1);
    }
    const next: Transaction = {
      ...t,
      desc,
      monto,
      fecha: dateKey(base),
      fechaStr: format(base, "d 'de' MMMM", { locale: es }),
    };
    if (categoria) next.categoria = categoria; else delete next.categoria;
    if (metodo) next.metodo = metodo; else delete next.metodo;

    setTxs((prev) => prev.map((x) => x.id === id ? next : x));
    const { error } = await supabase.from('transactions').update({
      descripcion: next.desc,
      monto: next.monto,
      fecha: next.fecha,
      fecha_str: next.fechaStr,
      categoria: next.categoria ?? null,
      metodo: next.metodo ?? null,
    }).eq('id', id);
    if (error) console.warn('[Dayxo tx] editar:', error.message);
  }, [txs]);

  const remove = useCallback(async (id: string) => {
    setTxs((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) console.warn('[Dayxo tx] borrar:', error.message);
    await reverseXPOnce(`tx-${id}`, XP_VALUES.LOG_TRANSACTION); // revierte el XP de registrarlo
  }, []);

  const togglePin = useCallback(async (id: string) => {
    const t = txs.find((x) => x.id === id);
    if (!t) return;
    const newPinned = !t.pinned;
    setTxs((prev) => prev.map((x) => x.id === id ? { ...x, pinned: newPinned } : x));
    const { error } = await supabase.from('transactions').update({ pinned: newPinned }).eq('id', id);
    if (error) console.warn('[Dayxo tx] pin:', error.message);
  }, [txs]);

  const ingresos = txs.filter((t) => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0);
  const gastos = txs.filter((t) => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0);
  const saldo = ingresos - gastos;

  // Fijados arriba (sort estable: el resto mantiene su orden)
  const byPinned = (a: Transaction, b: Transaction) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
  const ingresosList = txs.filter((t) => t.tipo === 'ingreso').sort(byPinned);
  const gastosList = txs.filter((t) => t.tipo === 'gasto').sort(byPinned);

  // Reinicia el mes: borra los movimientos pero conserva el disponible (lo que sobró)
  // como un ingreso inicial "Saldo del mes anterior".
  const resetMes = useCallback(async () => {
    if (!userId) return;
    const leftover = ingresos - gastos;
    const carry: Transaction | null = leftover > 0 ? {
      id: Date.now().toString(),
      desc: 'Saldo del mes anterior',
      monto: leftover,
      tipo: 'ingreso',
      fecha: todayKey(),
      fechaStr: format(new Date(), "d 'de' MMMM", { locale: es }),
    } : null;

    setTxs(carry ? [carry] : []);
    const { error: delErr } = await supabase.from('transactions').delete().eq('user_id', userId);
    if (delErr) console.warn('[Dayxo tx] reset borrar:', delErr.message);
    if (carry) {
      const { error: insErr } = await supabase.from('transactions').insert(toRow(carry, userId));
      if (insErr) console.warn('[Dayxo tx] reset crear:', insErr.message);
    }
  }, [ingresos, gastos, userId]);

  return { txs, ingresos, gastos, saldo, ingresosList, gastosList, loading, add, update, remove, togglePin, resetMes };
}
