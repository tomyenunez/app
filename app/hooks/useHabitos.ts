import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Habito, HabitReminder } from '../types';
import { todayKey, todayIdx, weekDays, dateKey } from '../utils/dateUtils';
import { awardXPOnce, incrementHabitRecord, decrementHabitRecord, reverseXPOnce, weeklyStarsCount } from '../services/xpService';
import { scheduleHabitReminders, cancelHabitReminders } from '../services/notificationService';
import { XP_VALUES } from '../constants/xpValues';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

function fromRow(r: any): Habito {
  return {
    id: r.id,
    name: r.name,
    days: r.days ?? [],
    ...(r.pinned ? { pinned: true } : {}),
    ...(r.recordatorio ? { recordatorio: r.recordatorio as HabitReminder } : {}),
  };
}
function toRow(h: Habito, userId: string) {
  return {
    id: h.id,
    user_id: userId,
    name: h.name,
    days: h.days,
    pinned: !!h.pinned,
    recordatorio: h.recordatorio ?? null,
  };
}

export function useHabitos() {
  const { user } = useAuth();
  const userId = user?.id;
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [habitDone, setHabitDone] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Recarga al enfocar: trae los hábitos + el registro de completados desde la nube
  useFocusEffect(
    useCallback(() => {
      if (!userId) { setHabitos([]); setHabitDone({}); setLoading(false); return; }
      let active = true;
      (async () => {
        const [hRes, dRes] = await Promise.all([
          supabase.from('habitos').select('*').order('created_at', { ascending: true }),
          supabase.from('habit_done').select('habit_id, fecha'),
        ]);
        if (!active) return;
        if (hRes.error) console.warn('[Dayxo habitos] leer:', hRes.error.message);
        if (dRes.error) console.warn('[Dayxo habit_done] leer:', dRes.error.message);
        setHabitos((hRes.data ?? []).map(fromRow));
        const map: Record<string, boolean> = {};
        (dRes.data ?? []).forEach((r: any) => { map[`${r.fecha}-${r.habit_id}`] = true; });
        setHabitDone(map);
        setLoading(false);
      })();
      return () => { active = false; };
    }, [userId])
  );

  const add = useCallback(async (name: string, days: number[], recordatorio?: HabitReminder) => {
    if (!userId) return;
    const next: Habito = { id: Date.now().toString(), name, days, ...(recordatorio ? { recordatorio } : {}) };
    setHabitos((prev) => [...prev, next]);
    const { error } = await supabase.from('habitos').insert(toRow(next, userId));
    if (error) console.warn('[Dayxo habitos] crear:', error.message);
    scheduleHabitReminders(next);
  }, [userId]);

  const remove = useCallback(async (id: string) => {
    cancelHabitReminders(id);
    setHabitos((prev) => prev.filter((h) => h.id !== id));
    const { error } = await supabase.from('habitos').delete().eq('id', id);
    if (error) console.warn('[Dayxo habitos] borrar:', error.message);
    // borra también su registro de completados
    await supabase.from('habit_done').delete().eq('habit_id', id);
  }, []);

  const update = useCallback(async (id: string, name: string, days: number[], recordatorio?: HabitReminder) => {
    const existing = habitos.find((h) => h.id === id);
    const changed: Habito = existing
      ? { ...existing, name, days, recordatorio }
      : { id, name, days, recordatorio };
    setHabitos((prev) => prev.map((h) => h.id === id ? changed : h));
    const { error } = await supabase.from('habitos')
      .update({ name, days, recordatorio: recordatorio ?? null }).eq('id', id);
    if (error) console.warn('[Dayxo habitos] editar:', error.message);
    scheduleHabitReminders(changed);
  }, [habitos]);

  const togglePin = useCallback(async (id: string) => {
    const h = habitos.find((x) => x.id === id);
    if (!h) return;
    const newPinned = !h.pinned;
    setHabitos((prev) => prev.map((x) => x.id === id ? { ...x, pinned: newPinned } : x));
    const { error } = await supabase.from('habitos').update({ pinned: newPinned }).eq('id', id);
    if (error) console.warn('[Dayxo habitos] pin:', error.message);
  }, [habitos]);

  // Marca/desmarca el hábito para HOY
  const toggleToday = useCallback(async (habitId: string) => {
    if (!userId) return;
    const fecha = todayKey();
    const key = `${fecha}-${habitId}`;
    const wasDone = !!habitDone[key];
    const updated = { ...habitDone, [key]: !wasDone };
    setHabitDone(updated);

    if (!wasDone) {
      // marcar: fila en habit_done + XP (una vez por hábito por día)
      const { error } = await supabase.from('habit_done')
        .upsert({ user_id: userId, habit_id: habitId, fecha });
      if (error) console.warn('[Dayxo habitos] marcar:', error.message);

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
    } else {
      // desmarcar: borra la fila y revierte el XP/récord que sumó esa marca
      const { error } = await supabase.from('habit_done')
        .delete().eq('habit_id', habitId).eq('fecha', fecha);
      if (error) console.warn('[Dayxo habitos] desmarcar:', error.message);

      const habito = habitos.find((h) => h.id === habitId);
      const isStar = !(habito?.days.includes(todayIdx()) ?? false); // mismo criterio que al marcar
      const reverted = await reverseXPOnce(
        `habit-${key}`,
        isStar ? XP_VALUES.COMPLETE_HABIT_EXTRA_DAY : XP_VALUES.COMPLETE_HABIT,
      );
      if (reverted) await decrementHabitRecord(isStar);
    }
  }, [habitDone, habitos, userId]);

  const isDoneToday = useCallback((habitId: string) => {
    return !!habitDone[`${todayKey()}-${habitId}`];
  }, [habitDone]);

  const isDoneOnDate = useCallback((habitId: string, date: Date) => {
    return !!habitDone[`${dateKey(date)}-${habitId}`];
  }, [habitDone]);

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

  // Week stats: done = días que tocaban y se hicieron, bonus = extras
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
