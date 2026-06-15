import { Badge } from '../types/game';

// Métricas que evalúan las condiciones de los badges
export interface BadgeStats {
  streak: number;
  weeklyStars: number;
  perfectDays7: boolean; // 7 días completando todos los hábitos del día
  totalTodos: number;
  completedAfter23: boolean;
  completedBefore7: boolean;
  xpTotal: number;
  perfectDay: boolean; // completó todo en un día
  newWeekRecord: boolean;
}

export interface BadgeDef extends Badge {
  check: (s: BadgeStats) => boolean;
}

export const BADGES: BadgeDef[] = [
  // Rachas
  { id: 'streak_3', name: 'Primera Sangre', description: '3 días de racha', icon: '🔥', rarity: 'common', color: '#E17055', check: (s) => s.streak >= 3 },
  { id: 'streak_7', name: 'Una Semana', description: '7 días de racha', icon: '📅', rarity: 'common', color: '#0984E3', check: (s) => s.streak >= 7 },
  { id: 'streak_30', name: 'Diamante', description: '30 días de racha', icon: '💎', rarity: 'rare', color: '#74B9FF', check: (s) => s.streak >= 30 },
  { id: 'streak_100', name: 'Centurión', description: '100 días de racha', icon: '🏛️', rarity: 'legendary', color: '#FDCB6E', check: (s) => s.streak >= 100 },

  // Hábitos
  { id: 'extra_10', name: 'Sobre-humano', description: '10 estrellas extra en una semana', icon: '⭐', rarity: 'rare', color: '#FDCB6E', check: (s) => s.weeklyStars >= 10 },
  { id: 'all_habits_7', name: 'Perfecto', description: '7 días completando todos los hábitos', icon: '✨', rarity: 'epic', color: '#6C5CE7', check: (s) => s.perfectDays7 },

  // Tareas
  { id: 'todos_100', name: 'Productivo', description: '100 tareas completadas', icon: '📋', rarity: 'common', color: '#00B894', check: (s) => s.totalTodos >= 100 },
  { id: 'todos_500', name: 'Imparable', description: '500 tareas completadas', icon: '🚀', rarity: 'rare', color: '#E84393', check: (s) => s.totalTodos >= 500 },

  // Tiempo
  { id: 'night_owl', name: 'Noctámbulo', description: 'Completar hábitos después de las 23hs', icon: '🌙', rarity: 'common', color: '#A29BFE', check: (s) => s.completedAfter23 },
  { id: 'early_bird', name: 'Madrugador', description: 'Completar hábitos antes de las 7am', icon: '🌅', rarity: 'common', color: '#FDCB6E', check: (s) => s.completedBefore7 },

  // XP
  { id: 'xp_1000', name: 'Empezando', description: '1.000 XP acumulados', icon: '💫', rarity: 'common', color: '#B2BEC3', check: (s) => s.xpTotal >= 1000 },
  { id: 'xp_10000', name: 'Veterano', description: '10.000 XP acumulados', icon: '🎖️', rarity: 'rare', color: '#6C5CE7', check: (s) => s.xpTotal >= 10000 },
  { id: 'xp_50000', name: 'Elite', description: '50.000 XP acumulados', icon: '🏆', rarity: 'epic', color: '#FDCB6E', check: (s) => s.xpTotal >= 50000 },

  // Records
  { id: 'best_week', name: 'En Racha', description: 'Superar tu récord de XP semanal', icon: '📈', rarity: 'rare', color: '#0984E3', check: (s) => s.newWeekRecord },
  { id: 'perfect_day', name: 'Día Perfecto', description: 'Completar TODO en un día', icon: '💥', rarity: 'epic', color: '#E84393', check: (s) => s.perfectDay },
];

export const RARITY_LABEL: Record<Badge['rarity'], string> = {
  common: 'Común',
  rare: 'Rara',
  epic: 'Épica',
  legendary: 'Legendaria',
};
