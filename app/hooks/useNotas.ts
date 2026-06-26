import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Nota } from '../types';
import { getNotas, saveNotas, getNotaDraft, saveNotaDraft } from '../services/storage';

// Notas del Home, modelo "Anotador":
//  - `draft`: un scratchpad único (texto suelto) que persiste entre sesiones.
//  - `notas`: el historial de notas guardadas (al tocar "Guardar" el borrador
//    se archiva acá y el scratchpad queda limpio).
// Todo persiste localmente en AsyncStorage. Las más recientes primero.
export function useNotas() {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [draft, setDraftState] = useState('');
  const [loading, setLoading] = useState(true);
  // Evita pisar lo que el usuario está tipeando con un reload por focus.
  const dirty = useRef(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getNotas(), getNotaDraft()]).then(([n, d]) => {
        setNotas(n);
        if (!dirty.current) setDraftState(d);
        setLoading(false);
      });
    }, [])
  );

  // Edita el scratchpad y lo persiste (fire-and-forget; es un string chico).
  const setDraft = useCallback((text: string) => {
    dirty.current = true;
    setDraftState(text);
    saveNotaDraft(text);
  }, []);

  // Archiva el borrador actual como nota en el historial y limpia el scratchpad.
  const saveDraft = useCallback(async () => {
    const cuerpo = draft.trim();
    if (!cuerpo) return;
    const now = new Date().toISOString();
    const nota: Nota = { id: Date.now().toString(), titulo: '', cuerpo, fechaCreacion: now, fechaEdicion: now };
    const updated = [nota, ...notas];
    setNotas(updated);
    await saveNotas(updated);
    dirty.current = false;
    setDraftState('');
    await saveNotaDraft('');
  }, [draft, notas]);

  // Descarta el scratchpad sin guardarlo.
  const clearDraft = useCallback(async () => {
    dirty.current = false;
    setDraftState('');
    await saveNotaDraft('');
  }, []);

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

  return { notas, draft, loading, setDraft, saveDraft, clearDraft, remove, togglePin };
}
