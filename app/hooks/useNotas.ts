import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Nota } from '../types';
import { getNotas, saveNotas } from '../services/storage';

// Notas personales del Home. Persisten localmente (AsyncStorage), igual que la
// Agenda. CRUD simple: las más recientes (por edición) primero.
export function useNotas() {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      getNotas().then((n) => { setNotas(n); setLoading(false); });
    }, [])
  );

  const add = useCallback(async (titulo: string, cuerpo: string) => {
    const now = new Date().toISOString();
    const next: Nota = { id: Date.now().toString(), titulo, cuerpo, fechaCreacion: now, fechaEdicion: now };
    const updated = [next, ...notas];
    setNotas(updated);
    await saveNotas(updated);
  }, [notas]);

  const update = useCallback(async (id: string, titulo: string, cuerpo: string) => {
    const updated = notas.map((n) =>
      n.id === id ? { ...n, titulo, cuerpo, fechaEdicion: new Date().toISOString() } : n
    );
    setNotas(updated);
    await saveNotas(updated);
  }, [notas]);

  const remove = useCallback(async (id: string) => {
    const updated = notas.filter((n) => n.id !== id);
    setNotas(updated);
    await saveNotas(updated);
  }, [notas]);

  const togglePin = useCallback(async (id: string) => {
    const updated = notas.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n);
    setNotas(updated);
    await saveNotas(updated);
  }, [notas]);

  return { notas, loading, add, update, remove, togglePin };
}
