import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Evento } from '../types';
import { getEventos, saveEventos } from '../services/storage';
import { isSameDay, isPast } from '../utils/dateUtils';

export function useAgenda() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  // Recarga al enfocar el tab: otra pantalla pudo haber modificado el storage
  useFocusEffect(
    useCallback(() => {
      getEventos().then((e) => { setEventos(e); setLoading(false); });
    }, [])
  );

  const add = useCallback(async (titulo: string, fecha: Date, tipo: Evento['tipo'], hora: string) => {
    const next: Evento = {
      id: Date.now().toString(),
      titulo,
      fecha: fecha.toISOString(),
      tipo,
      hora,
    };
    const updated = [...eventos, next].sort((a, b) => a.fecha.localeCompare(b.fecha));
    setEventos(updated);
    await saveEventos(updated);
  }, [eventos]);

  const remove = useCallback(async (id: string) => {
    const updated = eventos.filter((e) => e.id !== id);
    setEventos(updated);
    await saveEventos(updated);
  }, [eventos]);

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
