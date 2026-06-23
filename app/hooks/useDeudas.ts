import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Deuda } from '../types';
import { dateKey } from '../utils/dateUtils';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

// Mapeo entre la fila de la tabla `deudas` y el tipo Deuda de la app
function fromRow(r: any): Deuda {
  return {
    id: r.id,
    nombre: r.nombre,
    monto: Number(r.monto),
    desc: r.descripcion ?? '',
    tipo: r.tipo,
    fecha: r.fecha,
    ...(r.pinned ? { pinned: true } : {}),
  };
}
function toRow(d: Deuda, userId: string) {
  return {
    id: d.id,
    user_id: userId,
    nombre: d.nombre,
    monto: d.monto,
    descripcion: d.desc ?? '',
    tipo: d.tipo,
    fecha: d.fecha,
    pinned: !!d.pinned,
  };
}

export function useDeudas() {
  const { user } = useAuth();
  const userId = user?.id;
  const [deudas, setDeudas] = useState<Deuda[]>([]);

  // Recarga al enfocar: trae las deudas del usuario desde la nube
  useFocusEffect(
    useCallback(() => {
      if (!userId) { setDeudas([]); return; }
      let active = true;
      (async () => {
        const { data, error } = await supabase
          .from('deudas')
          .select('*')
          .order('created_at', { ascending: false });
        if (!active) return;
        if (error) console.warn('[Dayxo deudas] leer:', error.message);
        setDeudas((data ?? []).map(fromRow));
      })();
      return () => { active = false; };
    }, [userId])
  );

  const add = useCallback(async (nombre: string, monto: number, tipo: Deuda['tipo'], fecha?: Date) => {
    if (!userId) return;
    const d = fecha ?? new Date();
    const next: Deuda = { id: Date.now().toString(), nombre, monto, desc: '', tipo, fecha: dateKey(d) };
    setDeudas((prev) => [next, ...prev]);
    const { error } = await supabase.from('deudas').insert(toRow(next, userId));
    if (error) console.warn('[Dayxo deudas] crear:', error.message);
  }, [userId]);

  const update = useCallback(async (id: string, nombre: string, monto: number, tipo: Deuda['tipo'], fecha?: Date) => {
    const d = deudas.find((x) => x.id === id);
    if (!d) return;
    const next: Deuda = { ...d, nombre, monto, tipo, ...(fecha ? { fecha: dateKey(fecha) } : {}) };
    setDeudas((prev) => prev.map((x) => x.id === id ? next : x));
    const { error } = await supabase.from('deudas').update({
      nombre: next.nombre,
      monto: next.monto,
      tipo: next.tipo,
      fecha: next.fecha,
    }).eq('id', id);
    if (error) console.warn('[Dayxo deudas] editar:', error.message);
  }, [deudas]);

  const remove = useCallback(async (id: string) => {
    setDeudas((prev) => prev.filter((d) => d.id !== id));
    const { error } = await supabase.from('deudas').delete().eq('id', id);
    if (error) console.warn('[Dayxo deudas] borrar:', error.message);
  }, []);

  const togglePin = useCallback(async (id: string) => {
    const d = deudas.find((x) => x.id === id);
    if (!d) return;
    const newPinned = !d.pinned;
    setDeudas((prev) => prev.map((x) => x.id === id ? { ...x, pinned: newPinned } : x));
    const { error } = await supabase.from('deudas').update({ pinned: newPinned }).eq('id', id);
    if (error) console.warn('[Dayxo deudas] pin:', error.message);
  }, [deudas]);

  const clearAll = useCallback(async () => {
    if (!userId) return;
    setDeudas([]);
    const { error } = await supabase.from('deudas').delete().eq('user_id', userId);
    if (error) console.warn('[Dayxo deudas] limpiar:', error.message);
  }, [userId]);

  const totalMeDeben = deudas.filter((d) => d.tipo === 'me-debe').reduce((s, d) => s + d.monto, 0);
  const totalLeDebo = deudas.filter((d) => d.tipo === 'le-debo').reduce((s, d) => s + d.monto, 0);
  const balance = totalMeDeben - totalLeDebo;

  // Fijadas arriba (sort estable)
  const sorted = [...deudas].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return { deudas: sorted, totalMeDeben, totalLeDebo, balance, add, update, remove, togglePin, clearAll };
}
