import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { startOfWeek } from 'date-fns';
import { Mission } from '../types/game';
import { DAILY_MISSIONS, WEEKLY_MISSIONS } from '../constants/missions';
import { getTodos, getHabitos, getTxs, getHabitDone } from '../services/storage';
import { awardXPOnce } from '../services/xpService';
import { todayKey, todayIdx, dateKey } from '../utils/dateUtils';

// Calcula el progreso de cada misión desde los datos reales y otorga XP
// la primera vez que se completa (clave única por día/semana).
export function useMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [todos, habitos, txs, habitDone] = await Promise.all([
          getTodos(), getHabitos(), getTxs(), getHabitDone(),
        ]);

        const tk = todayKey();
        const idx = todayIdx();
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

        // --- Métricas diarias ---
        const todayHabits = habitos.filter((h) => h.days.includes(idx));
        const habitsDoneToday = todayHabits.filter((h) => habitDone[`${tk}-${h.id}`]).length;
        const todosDoneToday = todos.filter((t) => t.done && t.created === tk).length;
        const txToday = txs.filter((t) => t.fecha === tk).length;

        // --- Métricas semanales ---
        let todosWeek = 0;
        todos.forEach((t) => {
          if (!t.done) return;
          const [y, m, d] = t.created.split('-').map(Number);
          if (new Date(y, m - 1, d) >= weekStart) todosWeek++;
        });
        let extraStarsWeek = 0;
        for (let i = 0; i < 7; i++) {
          const day = new Date(weekStart);
          day.setDate(weekStart.getDate() + i);
          const dIdx = (day.getDay() + 6) % 7;
          habitos.forEach((h) => {
            if (!h.days.includes(dIdx) && habitDone[`${dateKey(day)}-${h.id}`]) extraStarsWeek++;
          });
        }

        const pct = (cur: number, target: number) => Math.min(100, Math.round((cur / target) * 100));

        const progressById: Record<string, number> = {
          dm_all_habits: todayHabits.length === 0 ? 0 : pct(habitsDoneToday, todayHabits.length),
          dm_3_todos: pct(todosDoneToday, 3),
          dm_log_tx: txToday > 0 ? 100 : 0,
          wm_10_todos: pct(todosWeek, 10),
          wm_extra_5stars: pct(extraStarsWeek, 5),
        };

        const weekTag = dateKey(weekStart);
        const all: Mission[] = [...DAILY_MISSIONS, ...WEEKLY_MISSIONS].map((t) => {
          const progress = progressById[t.id] ?? 0;
          const completed = progress >= 100;
          // XP una vez por día (diarias) o por semana (semanales)
          if (completed) {
            const claimKey = t.type === 'daily'
              ? `mission-${tk}-${t.id}`
              : `mission-${weekTag}-${t.id}`;
            awardXPOnce(claimKey, t.xp, `Misión: ${t.text}`, { isBonus: true });
          }
          return { ...t, progress, completed };
        });

        if (!cancelled) setMissions(all);
      })();
      return () => { cancelled = true; };
    }, [])
  );

  return missions;
}
