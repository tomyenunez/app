export interface XPEvent {
  id: string;
  amount: number;
  reason: string;
  timestamp: string; // ISO
  isBonus: boolean;
  isStar: boolean;
}

export interface UserLevel {
  level: number;
  name: string;
  icon: string;
  color: string;
  minXP: number;
  progress: number; // 0-100 hacia el siguiente nivel
  xpToNext: number;
}

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  color: string;
}

export interface Mission {
  id: string;
  text: string;
  xp: number;
  type: 'daily' | 'weekly';
  progress: number; // 0-100
  completed: boolean;
  completedAt?: string;
}

export interface PersonalRecords {
  bestStreak: number;
  bestWeekXP: number;
  bestDayXP: number;
  totalExtraStars: number;
  totalBadges: number;
  totalHabitsCompleted: number;
  totalTodosCompleted: number;
}

export interface Temperature {
  label: string;
  emoji: string;
  color: string;
  level: 0 | 1 | 2 | 3 | 4;
}

// Datos cacheados del jugador (perfil)
export interface PlayerProfile {
  username: string;
  avatarColor: string; // hex
}

// Resultado de otorgar XP — la UI lo usa para disparar toasts/modales
export interface AwardResult {
  awarded: number;
  reason: string;
  isBonus: boolean;
  isStar: boolean;
  newTotal: number;
  leveledUp: boolean;
  newLevel?: UserLevel;
  newBadges: Badge[];
}
