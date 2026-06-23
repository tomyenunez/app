import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Familia, FamiliaColor } from '../types';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const DEFAULT_FAMILIAS: Familia[] = [
  { id: 'personal', nombre: 'Personal', color: 'violeta' },
  { id: 'uni', nombre: 'Uni', color: 'verde' },
  { id: 'trabajo', nombre: 'Trabajo', color: 'naranja' },
  { id: 'otro', nombre: 'Otro', color: 'gris' },
];

const FALLBACK: Familia = { id: 'otro', nombre: 'Otro', color: 'gris' };

export function useFamilias() {
  const { user } = useAuth();
  const userId = user?.id;
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [loading, setLoading] = useState(true);

  // Recarga al enfocar; la primera vez (vacío) siembra las familias default en la nube
  useFocusEffect(
    useCallback(() => {
      if (!userId) { setFamilias([]); setLoading(false); return; }
      let active = true;
      (async () => {
        const { data, error } = await supabase
          .from('familias')
          .select('familia_id, nombre, color')
          .order('created_at', { ascending: true });
        if (!active) return;
        if (error) console.warn('[Dayxo familias] leer:', error.message);

        const rows: Familia[] = (data ?? []).map((r) => ({
          id: r.familia_id, nombre: r.nombre, color: r.color as FamiliaColor,
        }));

        if (rows.length === 0) {
          const seed = DEFAULT_FAMILIAS.map((f) => ({
            user_id: userId, familia_id: f.id, nombre: f.nombre, color: f.color,
          }));
          const { error: seedErr } = await supabase
            .from('familias')
            .upsert(seed, { onConflict: 'user_id,familia_id', ignoreDuplicates: true });
          if (seedErr) console.warn('[Dayxo familias] sembrar:', seedErr.message);
          if (active) setFamilias(DEFAULT_FAMILIAS);
        } else {
          setFamilias(rows);
        }
        if (active) setLoading(false);
      })();
      return () => { active = false; };
    }, [userId])
  );

  const add = useCallback(async (nombre: string, color: FamiliaColor) => {
    if (!userId) return;
    const next: Familia = { id: Date.now().toString(), nombre, color };
    setFamilias((prev) => [...prev, next]);
    const { error } = await supabase.from('familias')
      .insert({ user_id: userId, familia_id: next.id, nombre, color });
    if (error) console.warn('[Dayxo familias] crear:', error.message);
  }, [userId]);

  const update = useCallback(async (id: string, changes: Partial<Pick<Familia, 'nombre' | 'color'>>) => {
    setFamilias((prev) => prev.map((f) => f.id === id ? { ...f, ...changes } : f));
    const { error } = await supabase.from('familias').update(changes).eq('familia_id', id);
    if (error) console.warn('[Dayxo familias] editar:', error.message);
  }, [userId]);

  const remove = useCallback(async (id: string) => {
    setFamilias((prev) => prev.filter((f) => f.id !== id));
    const { error } = await supabase.from('familias').delete().eq('familia_id', id);
    if (error) console.warn('[Dayxo familias] borrar:', error.message);
  }, [userId]);

  // Si una tarea/evento apunta a una familia borrada, cae en "Otro" gris
  const getFamilia = useCallback((id: string): Familia => {
    return familias.find((f) => f.id === id) ?? FALLBACK;
  }, [familias]);

  return { familias, loading, add, update, remove, getFamilia };
}
