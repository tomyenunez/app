import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Habito } from '../types';
import { getHabitos, saveHabitos, getHabitDone, saveHabitDone } from '../services/storage';
import { todayKey, todayIdx, weekDays, dateKey } from '../utils/dateUtils';

export function useHabitos() {
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [habitDone, setHabitDone] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Recarga al enfocar el tab: otra pantalla pudo haber modificado el storage
  useFocusEffect(
    useCallback(() => {
      Promise.all([getHabitos(), getHabitDone()]).then(([h, d]) => {
        setHabitos(h);
        setHabitDone(d);
        setLoading(false);
      });
    }, [])
  );

  const add = useCallback(async (name: string, days: number[]) => {
    const next: Habito = { id: Date.now().toString(), name, days };
    const updated = [...habitos, next];
    setHabitos(updated);
    await saveHabitos(updated);
  }, [habitos]);

  const remove = useCallback(async (id: string) => {
    const updated = habitos.filter((h) => h.id !== id);
    setHabitos(updated);
    await saveHabitos(updated);
  }, [habitos]);

  // Toggle only today
  const toggleToday = useCallback(async (habitId: string) => {
    const key = `${todayKey()}-${habitId}`;
    const updated = { ...habitDone, [key]: !habitDone[key] };
    setHabitDone(updated);
    await saveHabitDone(updated);
  }, [habitDone]);

  const isDoneToday = useCallback((habitId: string) => {
    return !!habitDone[`${todayKey()}-${habitId}`];
  }, [habitDone]);

  const isDoneOnDate = useCallback((habitId: string, date: Date) => {
    return !!habitDone[`${dateKey(date)}-${habitId}`];
  }, [habitDone]);

  // Count completados hoy
  const todayHabits = useMemo(() =>
    habitos.filter((h) => h.days.includes(todayIdx())),
    [habitos]
  );

  const completadosHoy = useMemo(() =>
    todayHabits.filter((h) => isDoneToday(h.id)).length,
    [todayHabits, isDoneToday]
  );

  // Week stats for a habit
  const weekStats = useCallback((habito: Habito) => {
    const days = weekDays();
    let applies = 0;
    let done = 0;
    days.forEach((day) => {
      const idx = (day.getDay() + 6) % 7;
      if (habito.days.includes(idx)) {
        applies++;
        if (isDoneOnDate(habito.id, day)) done++;
      }
    });
    return { applies, done };
  }, [isDoneOnDate]);

  return {
    habitos,
    habitDone,
    loading,
    todayHabits,
    completadosHoy,
    add,
    remove,
    toggleToday,
    isDoneToday,
    isDoneOnDate,
    weekStats,
  };
}
