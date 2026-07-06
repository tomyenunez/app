import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Evento } from '../types';
import { getEventos, rawGet, rawSet } from '../services/storage';
import { isSameDay, isPast } from '../utils/dateUtils';
import { awardXPOnce, reverseXPOnce } from '../services/xpService';
import { XP_VALUES } from '../constants/xpValues';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

// Mapeo entre la fila de la tabla `eventos` y el tipo Evento de la app
function fromRow(r: any): Evento {
  return {
    id: r.id,
    titulo: r.titulo ?? '',
    fecha: r.fecha,
    tipo: r.tipo ?? '',
    hora: r.hora ?? '',
  };
}
function toRow(e: Evento, userId: string) {
  return {
    id: e.id,
    user_id: userId,
    titulo: e.titulo,
    fecha: e.fecha,
    tipo: e.tipo,
    hora: e.hora,
  };
}

// Migración única: sube los eventos locales viejos (AsyncStorage) a la cuenta
// del usuario. Corre una vez por usuario y dispositivo; si falla, reintenta en
// la próxima carga (no marca el flag).
async function uploadLocalOnce(userId: string): Promise<void> {
  const flagKey = `@dayxo/cloud_uploaded_eventos_${userId}`;
  if ((await rawGet(flagKey)) === 'true') return;
  const locales = await getEventos();
  if (locales.length > 0) {
    const rows = locales.map((e) => toRow(e, userId));
    const { error } = await supabase.from('eventos').upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
    if (error) { console.warn('[Dayxo agenda] migrar:', error.message); return; }
  }
  await rawSet(flagKey, 'true');
}

// Agenda en la nube (tabla `eventos`), mismo patrón optimista que todos/finanzas.
export function useAgenda() {
  const { user } = useAuth();
  const userId = user?.id;
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  // Recarga al enfocar el tab: trae los eventos del usuario desde la nube
  useFocusEffect(
    useCallback(() => {
      if (!userId) { setEventos([]); setLoading(false); return; }
      let active = true;
      (async () => {
        await uploadLocalOnce(userId);
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .order('fecha', { ascending: true });
        if (!active) return;
        if (error) console.warn('[Dayxo agenda] leer:', error.message);
        setEventos((data ?? []).map(fromRow));
        setLoading(false);
      })();
      return () => { active = false; };
    }, [userId])
  );

  const add = useCallback(async (titulo: string, fecha: Date, tipo: Evento['tipo'], hora: string) => {
    if (!userId) return;
    const next: Evento = {
      id: Date.now().toString(),
      titulo,
      fecha: fecha.toISOString(),
      tipo,
      hora,
    };
    setEventos((prev) => [...prev, next].sort((a, b) => a.fecha.localeCompare(b.fecha)));
    const { error } = await supabase.from('eventos').insert(toRow(next, userId));
    if (error) console.warn('[Dayxo agenda] crear:', error.message);
    awardXPOnce(`event-${next.id}`, XP_VALUES.ADD_EVENT, 'Evento agregado');
  }, [userId]);

  const remove = useCallback(async (id: string) => {
    setEventos((prev) => prev.filter((e) => e.id !== id));
    const { error } = await supabase.from('eventos').delete().eq('id', id);
    if (error) console.warn('[Dayxo agenda] borrar:', error.message);
    await reverseXPOnce(`event-${id}`, XP_VALUES.ADD_EVENT); // revierte el XP de agregarlo
  }, []);

  const upcomingEventos = useMemo(() =>
    eventos.filter((e) => !isPast(new Date(e.fecha))),
    [eventos]
  );

  const pastEventos = useMemo(() =>
    eventos.filter((e) => isPast(new Date(e.fecha))),
    [eventos]
  );

  const nextEvento = useMemo(() => {
    const now = new Date();
    return eventos.find((e) => new Date(e.fecha) >= now) ?? null;
  }, [eventos]);

  const eventosForDay = useCallback((date: Date) =>
    eventos.filter((e) => isSameDay(new Date(e.fecha), date)),
    [eventos]
  );

  const hasEvents = useCallback((date: Date) =>
    eventos.some((e) => isSameDay(new Date(e.fecha), date)),
    [eventos]
  );

  return { eventos, upcomingEventos, pastEventos, nextEvento, loading, add, remove, eventosForDay, hasEvents };
}
