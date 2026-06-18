import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Habito, HabitReminder } from '../types';
import { getHabitos, saveHabitos, getHabitDone, saveHabitDone } from '../services/storage';
import { todayKey, todayIdx, weekDays, dateKey } from '../utils/dateUtils';
import { awardXPOnce, incrementHabitRecord, weeklyStarsCount } from '../services/xpService';
import { scheduleHabitReminders, cancelHabitReminders } from '../services/notificationService';
import { XP_VALUES } from '../constants/xpValues';

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

  const add = useCallback(async (name: string, days: number[], recordatorio?: HabitReminder) => {
    const next: Habito = { id: Date.now().toString(), name, days, ...(recordatorio ? { recordatorio } : {}) };
    const updated = [...habitos, next];
    setHabitos(updated);
    await saveHabitos(updated);
    scheduleHabitReminders(next);
  }, [habitos]);

  const remove = useCallback(async (id: string) => {
    cancelHabitReminders(id);
    const updated = habitos.filter((h) => h.id !== id);
    setHabitos(updated);
    await saveHabitos(updated);
  }, [habitos]);

  const update = useCallback(async (id: string, name: string, days: number[], recordatorio?: HabitReminder) => {
    let changed: Habito | undefined;
    const updated = habitos.map((h) => {
      if (h.id !== id) return h;
      changed = { ...h, name, days, recordatorio };
      return changed;
    });
    setHabitos(updated);
    await saveHabitos(updated);
    if (changed) scheduleHabitReminders(changed);
  }, [habitos]);

  const togglePin = useCallback(async (id: string) => {
    const updated = habitos.map((h) => h.id === id ? { ...h, pinned: !h.pinned } : h);
    setHabitos(updated);
    await saveHabitos(updated);
  }, [habitos]);

  // Toggle only today
  const toggleToday = useCallback(async (habitId: string) => {
    const key = `${todayKey()}-${habitId}`;
    const wasDone = !!habitDone[key];
    const updated = { ...habitDone, [key]: !wasDone };
    setHabitDone(updated);
    await saveHabitDone(updated);

    // XP solo al marcar (nunca resta); una vez por hábito por día
    if (!wasDone) {
      const habito = habitos.find((h) => h.id === habitId);
      const aplicaHoy = habito?.days.includes(todayIdx()) ?? false;
      const isStar = !aplicaHoy; // día que no tocaba → estrella dorada
      const hour = new Date().getHours();
      const stars = await weeklyStarsCount(updated, habitos);
      incrementHabitRecord(isStar);
      awardXPOnce(
        `habit-${key}`,
        isStar ? XP_VALUES.COMPLETE_HABIT_EXTRA_DAY : XP_VALUES.COMPLETE_HABIT,
        isStar ? 'Hábito extra ⭐' : 'Hábito completado',
        {
          isStar,
          isBonus: isStar,
          stats: {
            weeklyStars: stars,
            completedAfter23: hour >= 23,
            completedBefore7: hour < 7,
          },
        }
      );
    }
  }, [habitDone, habitos]);

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

  // Bonus: hábitos completados hoy aunque hoy NO les tocaba (suman puntos extra)
  const bonusHoy = useMemo(() =>
    habitos.filter((h) => !h.days.includes(todayIdx()) && isDoneToday(h.id)).length,
    [habitos, isDoneToday]
  );

  // Week stats for a habit: done = días que tocaban y se hicieron, bonus = extras
  const weekStats = useCallback((habito: Habito) => {
    const days = weekDays();
    let applies = 0;
    let done = 0;
    let bonus = 0;
    days.forEach((day) => {
      const idx = (day.getDay() + 6) % 7;
      const completed = isDoneOnDate(habito.id, day);
      if (habito.days.includes(idx)) {
        applies++;
        if (completed) done++;
      } else if (completed) {
        bonus++;
      }
    });
    return { applies, done, bonus };
  }, [isDoneOnDate]);

  return {
    habitos,
    habitDone,
    loading,
    todayHabits,
    completadosHoy,
    bonusHoy,
    add,
    update,
    remove,
    togglePin,
    toggleToday,
    isDoneToday,
    isDoneOnDate,
    weekStats,
  };
}
