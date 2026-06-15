import { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Temperature } from '../types/game';
import { todayKey } from '../utils/dateUtils';

function getDayTemperature(todayXP: number, avgDailyXP: number): Temperature {
  const ratio = todayXP / (avgDailyXP || 1);
  if (todayXP === 0) return { label: 'Sin actividad', emoji: '😴', color: '#B2BEC3', level: 0 };
  if (ratio < 0.5) return { label: 'Frío', emoji: '🥶', color: '#74B9FF', level: 1 };
  if (ratio < 0.9) return { label: 'Normal', emoji: '😐', color: '#00B894', level: 2 };
  if (ratio < 1.5) return { label: 'En llamas', emoji: '🔥', color: '#E17055', level: 3 };
  return { label: 'Modo Bestia', emoji: '💥', color: '#E84393', level: 4 };
}

export function useTemperature() {
  const { xpDaily } = useGame();

  return useMemo(() => {
    const tk = todayKey();
    const todayXP = xpDaily[tk] ?? 0;
    const entries = Object.values(xpDaily);
    // Promedio de los días con actividad (evita dividir por días sin uso)
    const activeDays = entries.filter((x) => x > 0);
    const avg = activeDays.length > 0
      ? Math.round(activeDays.reduce((a, b) => a + b, 0) / activeDays.length)
      : 0;
    return { temp: getDayTemperature(todayXP, avg), todayXP, avg };
  }, [xpDaily]);
}
