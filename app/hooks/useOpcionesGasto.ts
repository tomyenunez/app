import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { OpcionGasto, FamiliaColor } from '../types';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

type Kind = 'categoria' | 'metodo';

const DEFAULT_CATEGORIAS: OpcionGasto[] = [
  { id: 'comida', nombre: 'Comida', color: 'naranja' },
  { id: 'entretenimiento', nombre: 'Entretenimiento', color: 'violeta' },
  { id: 'transporte', nombre: 'Transporte', color: 'azul' },
  { id: 'otros', nombre: 'Otros', color: 'gris' },
];

const DEFAULT_METODOS: OpcionGasto[] = [
  { id: 'efectivo', nombre: 'Efectivo', color: 'verde' },
  { id: 'mercadopago', nombre: 'Mercado Pago', color: 'azul' },
  { id: 'tarjeta', nombre: 'Tarjeta', color: 'violeta' },
];

const FALLBACK: OpcionGasto = { id: 'sin', nombre: 'Sin especificar', color: 'gris' };

function useCatalogo(kind: Kind, defaults: OpcionGasto[]) {
  const { user } = useAuth();
  const userId = user?.id;
  const [items, setItems] = useState<OpcionGasto[]>([]);

  // Recarga al enfocar; la primera vez (catálogo vacío) siembra los defaults en la nube
  useFocusEffect(
    useCallback(() => {
      if (!userId) { setItems([]); return; }
      let active = true;
      (async () => {
        const { data, error } = await supabase
          .from('opciones_gasto')
          .select('opcion_id, nombre, color')
          .eq('kind', kind)
          .order('created_at', { ascending: true });
        if (!active) return;
        if (error) console.warn(`[Dayxo opciones:${kind}] leer:`, error.message);

        const rows: OpcionGasto[] = (data ?? []).map((r) => ({
          id: r.opcion_id, nombre: r.nombre, color: r.color as FamiliaColor,
        }));

        if (rows.length === 0) {
          const seed = defaults.map((d) => ({
            user_id: userId, kind, opcion_id: d.id, nombre: d.nombre, color: d.color,
          }));
          const { error: seedErr } = await supabase
            .from('opciones_gasto')
            .upsert(seed, { onConflict: 'user_id,kind,opcion_id', ignoreDuplicates: true });
          if (seedErr) console.warn(`[Dayxo opciones:${kind}] sembrar:`, seedErr.message);
          if (active) setItems(defaults);
        } else {
          setItems(rows);
        }
      })();
      return () => { active = false; };
    }, [userId])
  );

  const add = useCallback(async (nombre: string, color: FamiliaColor) => {
    if (!userId) return;
    const next: OpcionGasto = { id: Date.now().toString(), nombre, color };
    setItems((prev) => [...prev, next]);
    const { error } = await supabase.from('opciones_gasto')
      .insert({ user_id: userId, kind, opcion_id: next.id, nombre, color });
    if (error) console.warn(`[Dayxo opciones:${kind}] crear:`, error.message);
  }, [userId]);

  const update = useCallback(async (id: string, changes: Partial<Pick<OpcionGasto, 'nombre' | 'color'>>) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...changes } : i));
    const { error } = await supabase.from('opciones_gasto')
      .update(changes).eq('kind', kind).eq('opcion_id', id);
    if (error) console.warn(`[Dayxo opciones:${kind}] editar:`, error.message);
  }, [userId]);

  const remove = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    const { error } = await supabase.from('opciones_gasto')
      .delete().eq('kind', kind).eq('opcion_id', id);
    if (error) console.warn(`[Dayxo opciones:${kind}] borrar:`, error.message);
  }, [userId]);

  // Movimientos viejos o con opción borrada caen en "Sin especificar"
  const getItem = useCallback((id: string | undefined): OpcionGasto => {
    if (!id) return FALLBACK;
    return items.find((i) => i.id === id) ?? FALLBACK;
  }, [items]);

  return { items, add, update, remove, getItem };
}

export function useCategoriasGasto() {
  return useCatalogo('categoria', DEFAULT_CATEGORIAS);
}

export function useMetodosPago() {
  return useCatalogo('metodo', DEFAULT_METODOS);
}
