import { UserLevel, RankEffect } from '../types/game';

export interface RankDef {
  level: number;
  name: string;
  minXP: number;
  icon: string;
  color: string; // color principal del rango
  bgColor: string; // fondo suave (modal de celebración, chips)
  textColor: string; // texto sobre fondo suave
  isExclusive: boolean;
  effect: RankEffect | null;
}

// 10 rangos gema (Bronce → Obsidiana). Los umbrales están calibrados a ~50 XP/día.
export const RANKS: RankDef[] = [
  { level: 1, name: 'Bronce', minXP: 0, icon: '🥉', color: '#CD7F32', bgColor: '#F5E6D3', textColor: '#7A4A1A', isExclusive: false, effect: null },
  { level: 2, name: 'Plata', minXP: 50, icon: '🥈', color: '#C0C0C0', bgColor: '#F0F0F0', textColor: '#707070', isExclusive: false, effect: null },
  { level: 3, name: 'Oro', minXP: 150, icon: '🥇', color: '#FFD700', bgColor: '#FFF3CC', textColor: '#7A6000', isExclusive: false, effect: null },
  { level: 4, name: 'Esmeralda', minXP: 400, icon: '💚', color: '#50C878', bgColor: '#D4F5E9', textColor: '#1A6B3A', isExclusive: false, effect: null },
  { level: 5, name: 'Zafiro', minXP: 900, icon: '💙', color: '#0F52BA', bgColor: '#D6EEFF', textColor: '#0A3A8A', isExclusive: false, effect: null },
  { level: 6, name: 'Rubí', minXP: 1800, icon: '❤️', color: '#E0115F', bgColor: '#FFE0EF', textColor: '#900030', isExclusive: false, effect: null },
  { level: 7, name: 'Amatista', minXP: 3200, icon: '💜', color: '#9B59B6', bgColor: '#E8E4FF', textColor: '#6A2A8A', isExclusive: false, effect: null },
  { level: 8, name: 'Platino', minXP: 5000, icon: '⚡', color: '#E5E4E2', bgColor: '#F0F8FF', textColor: '#707880', isExclusive: true, effect: 'pulsating_silver_border' },
  { level: 9, name: 'Diamante', minXP: 7000, icon: '💎', color: '#9AD8FF', bgColor: '#F0FAFF', textColor: '#3A6A8A', isExclusive: true, effect: 'rotating_white_sparkles' },
  { level: 10, name: 'Obsidiana', minXP: 9000, icon: '🌑', color: '#1A1A1A', bgColor: '#1A1A1A', textColor: '#FFD93D', isExclusive: true, effect: 'black_gold_flames' },
];

export function getRank(xpTotal: number): RankDef {
  return [...RANKS].reverse().find((r) => xpTotal >= r.minXP) ?? RANKS[0];
}

export function getNextRank(xpTotal: number): RankDef | null {
  const current = getRank(xpTotal);
  return RANKS.find((r) => r.level === current.level + 1) ?? null;
}

export function getXPToNextRank(xpTotal: number): number {
  const next = getNextRank(xpTotal);
  return next ? next.minXP - xpTotal : 0;
}

export function getRankProgress(xpTotal: number): number {
  const current = getRank(xpTotal);
  const next = getNextRank(xpTotal);
  if (!next) return 100;
  const span = next.minXP - current.minXP;
  return span > 0 ? Math.round(((xpTotal - current.minXP) / span) * 100) : 0;
}

export function didRankChange(prevXP: number, newXP: number): {
  changed: boolean;
  wentUp: boolean;
  wentDown: boolean;
  newRank: RankDef;
} {
  const prevRank = getRank(prevXP);
  const newRank = getRank(newXP);
  return {
    changed: newRank.level !== prevRank.level,
    wentUp: newRank.level > prevRank.level,
    wentDown: newRank.level < prevRank.level,
    newRank,
  };
}

// Mapea el rango actual al shape UserLevel que ya consume toda la UI.
export function getUserLevel(xpTotal: number): UserLevel {
  const current = getRank(xpTotal);
  const xpToNext = getXPToNextRank(xpTotal);
  const progress = getRankProgress(xpTotal);
  return {
    level: current.level,
    name: current.name,
    icon: current.icon,
    color: current.color,
    minXP: current.minXP,
    bgColor: current.bgColor,
    textColor: current.textColor,
    isExclusive: current.isExclusive,
    effect: current.effect,
    progress: Math.max(0, Math.min(100, progress)),
    xpToNext,
  };
}
