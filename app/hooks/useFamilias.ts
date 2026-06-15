import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Familia, FamiliaColor } from '../types';
import { getFamilias, saveFamilias } from '../services/storage';

// Los ids coinciden con los tags viejos para que las tareas existentes migren solas
const DEFAULT_FAMILIAS: Familia[] = [
  { id: 'personal', nombre: 'Personal', color: 'violeta' },
  { id: 'uni', nombre: 'Uni', color: 'verde' },
  { id: 'trabajo', nombre: 'Trabajo', color: 'naranja' },
  { id: 'otro', nombre: 'Otro', color: 'gris' },
];

const FALLBACK: Familia = { id: 'otro', nombre: 'Otro', color: 'gris' };

export function useFamilias() {
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [loading, setLoading] = useState(true);

  // Recarga al enfocar el tab; la primera vez siembra las familias default
  useFocusEffect(
    useCallback(() => {
      getFamilias().then((f) => {
        if (f.length === 0) {
          setFamilias(DEFAULT_FAMILIAS);
          saveFamilias(DEFAULT_FAMILIAS);
        } else {
          setFamilias(f);
        }
        setLoading(false);
      });
    }, [])
  );

  const add = useCallback(async (nombre: string, color: FamiliaColor) => {
    const next: Familia = { id: Date.now().toString(), nombre, color };
    const updated = [...familias, next];
    setFamilias(updated);
    await saveFamilias(updated);
  }, [familias]);

  const update = useCallback(async (id: string, changes: Partial<Pick<Familia, 'nombre' | 'color'>>) => {
    const updated = familias.map((f) => f.id === id ? { ...f, ...changes } : f);
    setFamilias(updated);
    await saveFamilias(updated);
  }, [familias]);

  const remove = useCallback(async (id: string) => {
    const updated = familias.filter((f) => f.id !== id);
    setFamilias(updated);
    await saveFamilias(updated);
  }, [familias]);

  // Si una tarea/evento apunta a una familia borrada, cae en "Otro" gris
  const getFamilia = useCallback((id: string): Familia => {
    return familias.find((f) => f.id === id) ?? FALLBACK;
  }, [familias]);

  return { familias, loading, add, update, remove, getFamilia };
}
