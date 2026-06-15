import { UserLevel } from '../types/game';

interface LevelDef {
  level: number;
  name: string;
  minXP: number;
  icon: string;
  color: string;
}

export const LEVELS: LevelDef[] = [
  { level: 1, name: 'Novato', minXP: 0, icon: '🌱', color: '#B2BEC3' },
  { level: 2, name: 'Constante', minXP: 500, icon: '⚡', color: '#00B894' },
  { level: 3, name: 'Enfocado', minXP: 1500, icon: '🎯', color: '#0984E3' },
  { level: 4, name: 'Disciplinado', minXP: 3500, icon: '💪', color: '#6C5CE7' },
  { level: 5, name: 'Máquina', minXP: 7000, icon: '🔥', color: '#E17055' },
  { level: 6, name: 'Imparable', minXP: 13000, icon: '⚔️', color: '#E84393' },
  { level: 7, name: 'Leyenda', minXP: 25000, icon: '👑', color: '#FDCB6E' },
];

function defFor(xpTotal: number): LevelDef {
  return [...LEVELS].reverse().find((l) => xpTotal >= l.minXP) ?? LEVELS[0];
}

export function getUserLevel(xpTotal: number): UserLevel {
  const current = defFor(xpTotal);
  const next = LEVELS.find((l) => l.level === current.level + 1);
  const xpToNext = next ? next.minXP - xpTotal : 0;
  // Progreso dentro del tramo actual → siguiente nivel
  let progress = 100;
  if (next) {
    const span = next.minXP - current.minXP;
    progress = span > 0 ? Math.round(((xpTotal - current.minXP) / span) * 100) : 0;
  }
  return {
    level: current.level,
    name: current.name,
    icon: current.icon,
    color: current.color,
    minXP: current.minXP,
    progress: Math.max(0, Math.min(100, progress)),
    xpToNext,
  };
}
