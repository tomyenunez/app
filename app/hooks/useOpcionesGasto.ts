import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { OpcionGasto, FamiliaColor } from '../types';
import {
  getCategoriasGasto, saveCategoriasGasto,
  getMetodosPago, saveMetodosPago,
} from '../services/storage';

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

function useCatalogo(
  getFn: () => Promise<OpcionGasto[]>,
  saveFn: (items: OpcionGasto[]) => Promise<void>,
  defaults: OpcionGasto[],
) {
  const [items, setItems] = useState<OpcionGasto[]>([]);

  // Recarga al enfocar; la primera vez siembra los defaults
  useFocusEffect(
    useCallback(() => {
      getFn().then((stored) => {
        if (stored.length === 0) {
          setItems(defaults);
          saveFn(defaults);
        } else {
          setItems(stored);
        }
      });
    }, [])
  );

  const add = useCallback(async (nombre: string, color: FamiliaColor) => {
    const next: OpcionGasto = { id: Date.now().toString(), nombre, color };
    const updated = [...items, next];
    setItems(updated);
    await saveFn(updated);
  }, [items]);

  const update = useCallback(async (id: string, changes: Partial<Pick<OpcionGasto, 'nombre' | 'color'>>) => {
    const updated = items.map((i) => i.id === id ? { ...i, ...changes } : i);
    setItems(updated);
    await saveFn(updated);
  }, [items]);

  const remove = useCallback(async (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    await saveFn(updated);
  }, [items]);

  // Movimientos viejos o con opción borrada caen en "Sin especificar"
  const getItem = useCallback((id: string | undefined): OpcionGasto => {
    if (!id) return FALLBACK;
    return items.find((i) => i.id === id) ?? FALLBACK;
  }, [items]);

  return { items, add, update, remove, getItem };
}

export function useCategoriasGasto() {
  return useCatalogo(getCategoriasGasto, saveCategoriasGasto, DEFAULT_CATEGORIAS);
}

export function useMetodosPago() {
  return useCatalogo(getMetodosPago, saveMetodosPago, DEFAULT_METODOS);
}
