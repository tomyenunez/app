import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Nota, NotaDraft } from '../types';
import { getNotas, saveNotas, getNotaDraft, saveNotaDraft } from '../services/storage';

const EMPTY_DRAFT: NotaDraft = { titulo: '', cuerpo: '' };

// Notas del Home, modelo "Anotador":
//  - `draft`: un scratchpad único (título + cuerpo) que persiste entre sesiones.
//  - `notas`: el historial de notas guardadas (al tocar "Guardar" el borrador
//    se archiva acá y el scratchpad queda limpio).
// Todo persiste localmente en AsyncStorage. Las más recientes primero.
export function useNotas() {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [draft, setDraftState] = useState<NotaDraft>(EMPTY_DRAFT);
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

  // Edita el scratchpad (merge parcial) y lo persiste (fire-and-forget).
  const setDraft = useCallback((patch: Partial<NotaDraft>) => {
    dirty.current = true;
    setDraftState((prev) => {
      const next = { ...prev, ...patch };
      saveNotaDraft(next);
      return next;
    });
  }, []);

  // Archiva el borrador actual como nota en el historial y limpia el scratchpad.
  const saveDraft = useCallback(async () => {
    const titulo = draft.titulo.trim();
    const cuerpo = draft.cuerpo.trim();
    if (!titulo && !cuerpo) return;
    const now = new Date().toISOString();
    const nota: Nota = { id: Date.now().toString(), titulo, cuerpo, fechaCreacion: now, fechaEdicion: now };
    const updated = [nota, ...notas];
    setNotas(updated);
    await saveNotas(updated);
    dirty.current = false;
    setDraftState(EMPTY_DRAFT);
    await saveNotaDraft(EMPTY_DRAFT);
  }, [draft, notas]);

  // Descarta el scratchpad sin guardarlo.
  const clearDraft = useCallback(async () => {
    dirty.current = false;
    setDraftState(EMPTY_DRAFT);
    await saveNotaDraft(EMPTY_DRAFT);
  }, []);

  // Edita una nota guardada (desde el historial).
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

  return { notas, draft, loading, setDraft, saveDraft, clearDraft, update, remove, togglePin };
}
