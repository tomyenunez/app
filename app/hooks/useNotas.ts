import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Nota, NotaDraft } from '../types';
import { getNotas, saveNotas, getNotaDraft, saveNotaDraft } from '../services/storage';
import { unlockBadge, APP_START } from '../services/xpService';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

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

    // --- Logros de notas ---
    unlockBadge('idea_guardada');
    if (updated.length >= 10) unlockBadge('no_lo_pierdo_mas');
    if (updated.length >= 25) unlockBadge('cerebro_externo');
    const len = (titulo + cuerpo).length;
    if (len > 0 && len <= 10) unlockBadge('pensamiento_fugaz');
    if (cuerpo.length >= 500) unlockBadge('manifiesto');
    if (new Date().getHours() < 4) unlockBadge('idea_nocturna'); // 00-04
    // 🥚 "Sin que se escape": guardar una nota antes de los 30s de abrir la app
    if (Date.now() - APP_START < 30000) unlockBadge('nota_flash');
  }, [draft, notas]);

  // Descarta el scratchpad sin guardarlo.
  const clearDraft = useCallback(async () => {
    dirty.current = false;
    setDraftState(EMPTY_DRAFT);
    await saveNotaDraft(EMPTY_DRAFT);
  }, []);

  // Edita una nota guardada (desde el historial).
  const update = useCallback(async (id: string, titulo: string, cuerpo: string) => {
    const original = notas.find((n) => n.id === id);
    const updated = notas.map((n) =>
      n.id === id ? { ...n, titulo, cuerpo, fechaEdicion: new Date().toISOString() } : n
    );
    setNotas(updated);
    await saveNotas(updated);
    // "Nota rescatada": editar una nota de hace más de una semana
    if (original && Date.now() - new Date(original.fechaCreacion).getTime() > WEEK_MS) {
      unlockBadge('nota_rescatada');
    }
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
