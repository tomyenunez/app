import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Nota, NotaDraft } from '../types';
import { getNotas, getNotaDraft, saveNotaDraft, rawGet, rawSet } from '../services/storage';
import { unlockBadge, APP_START } from '../services/xpService';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const EMPTY_DRAFT: NotaDraft = { titulo: '', cuerpo: '' };

// Mapeo entre la fila de la tabla `notas` y el tipo Nota de la app
function fromRow(r: any): Nota {
  return {
    id: r.id,
    titulo: r.titulo ?? '',
    cuerpo: r.cuerpo ?? '',
    fechaCreacion: r.fecha_creacion,
    fechaEdicion: r.fecha_edicion,
    ...(r.pinned ? { pinned: true } : {}),
  };
}
function toRow(n: Nota, userId: string) {
  return {
    id: n.id,
    user_id: userId,
    titulo: n.titulo,
    cuerpo: n.cuerpo,
    fecha_creacion: n.fechaCreacion,
    fecha_edicion: n.fechaEdicion,
    pinned: !!n.pinned,
  };
}

// Migración única: sube las notas locales viejas (AsyncStorage) a la cuenta del
// usuario. Corre una sola vez por usuario y dispositivo (flag local). Si falla,
// no marca el flag, así reintenta en la próxima carga.
async function uploadLocalOnce(userId: string): Promise<void> {
  const flagKey = `@dayxo/cloud_uploaded_notas_${userId}`;
  if ((await rawGet(flagKey)) === 'true') return;
  const locales = await getNotas();
  if (locales.length > 0) {
    const rows = locales.map((n) => toRow(n, userId));
    const { error } = await supabase.from('notas').upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
    if (error) { console.warn('[Dayxo notas] migrar:', error.message); return; }
  }
  await rawSet(flagKey, 'true');
}

// Notas del Home, modelo "Anotador":
//  - `draft`: un scratchpad único (título + cuerpo) que persiste entre sesiones.
//    Se queda LOCAL (es un buffer de tipeo por dispositivo, no se sincroniza).
//  - `notas`: el historial de notas guardadas — en la NUBE (tabla `notas`),
//    con el mismo patrón optimista que todos/finanzas. Las más recientes primero.
export function useNotas() {
  const { user } = useAuth();
  const userId = user?.id;
  const [notas, setNotas] = useState<Nota[]>([]);
  const [draft, setDraftState] = useState<NotaDraft>(EMPTY_DRAFT);
  const [loading, setLoading] = useState(true);
  // Evita pisar lo que el usuario está tipeando con un reload por focus.
  const dirty = useRef(false);
  // Candado anti doble-guardado: si un save está en vuelo, ignora taps extra.
  const saving = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!userId) { setNotas([]); setLoading(false); return; }
      let active = true;
      (async () => {
        await uploadLocalOnce(userId);
        const [{ data, error }, d] = await Promise.all([
          supabase.from('notas').select('*').order('fecha_creacion', { ascending: false }),
          getNotaDraft(),
        ]);
        if (!active) return;
        if (error) console.warn('[Dayxo notas] leer:', error.message);
        setNotas((data ?? []).map(fromRow));
        if (!dirty.current) setDraftState(d);
        setLoading(false);
      })();
      return () => { active = false; };
    }, [userId])
  );

  // Edita el scratchpad (merge parcial) y lo persiste localmente (fire-and-forget).
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
    if (!userId || saving.current) return;
    const titulo = draft.titulo.trim();
    const cuerpo = draft.cuerpo.trim();
    if (!titulo && !cuerpo) return;
    saving.current = true;
    const now = new Date().toISOString();
    const nota: Nota = { id: Date.now().toString(), titulo, cuerpo, fechaCreacion: now, fechaEdicion: now };
    const updated = [nota, ...notas];
    setNotas(updated);
    // Limpiar el borrador ANTES del round-trip a la nube: el botón "Guardar"
    // desaparece al instante y no se puede spamear guardados duplicados.
    dirty.current = false;
    setDraftState(EMPTY_DRAFT);
    saveNotaDraft(EMPTY_DRAFT);
    const { error } = await supabase.from('notas').insert(toRow(nota, userId));
    if (error) console.warn('[Dayxo notas] crear:', error.message);
    saving.current = false;

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
  }, [draft, notas, userId]);

  // Descarta el scratchpad sin guardarlo.
  const clearDraft = useCallback(async () => {
    dirty.current = false;
    setDraftState(EMPTY_DRAFT);
    await saveNotaDraft(EMPTY_DRAFT);
  }, []);

  // Edita una nota guardada (desde el historial).
  const update = useCallback(async (id: string, titulo: string, cuerpo: string) => {
    const original = notas.find((n) => n.id === id);
    const fechaEdicion = new Date().toISOString();
    setNotas((prev) => prev.map((n) => n.id === id ? { ...n, titulo, cuerpo, fechaEdicion } : n));
    const { error } = await supabase.from('notas')
      .update({ titulo, cuerpo, fecha_edicion: fechaEdicion })
      .eq('id', id);
    if (error) console.warn('[Dayxo notas] editar:', error.message);
    // "Nota rescatada": editar una nota de hace más de una semana
    if (original && Date.now() - new Date(original.fechaCreacion).getTime() > WEEK_MS) {
      unlockBadge('nota_rescatada');
    }
  }, [notas]);

  const remove = useCallback(async (id: string) => {
    setNotas((prev) => prev.filter((n) => n.id !== id));
    const { error } = await supabase.from('notas').delete().eq('id', id);
    if (error) console.warn('[Dayxo notas] borrar:', error.message);
  }, []);

  const togglePin = useCallback(async (id: string) => {
    const target = notas.find((n) => n.id === id);
    if (!target) return;
    const newPinned = !target.pinned;
    setNotas((prev) => prev.map((n) => n.id === id ? { ...n, pinned: newPinned } : n));
    const { error } = await supabase.from('notas').update({ pinned: newPinned }).eq('id', id);
    if (error) console.warn('[Dayxo notas] pin:', error.message);
  }, [notas]);

  return { notas, draft, loading, setDraft, saveDraft, clearDraft, update, remove, togglePin };
}
