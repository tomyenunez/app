export interface XPEvent {
  id: string;
  amount: number;
  reason: string;
  timestamp: string; // ISO
  isBonus: boolean;
  isStar: boolean;
}

// Efectos visuales permanentes de los rangos exclusivos (Platino+)
export type RankEffect =
  | 'pulsating_silver_border' // Platino
  | 'rotating_white_sparkles' // Diamante
  | 'black_gold_flames'; // Obsidiana

// Representa el rango actual del usuario. Mantiene el nombre UserLevel por
// compatibilidad con toda la UI que ya lo consume.
export interface UserLevel {
  level: number; // 1-10 (nivel del rango)
  name: string; // nombre de la gema (Bronce, Plata, ... Obsidiana)
  icon: string;
  color: string;
  minXP: number;
  bgColor: string; // fondo suave del rango
  textColor: string; // texto sobre el fondo suave
  isExclusive: boolean; // Platino, Diamante, Obsidiana
  effect: RankEffect | null; // efecto permanente si es exclusivo
  progress: number; // 0-100 hacia el siguiente rango
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
  avatarColor: string; // hex (fallback cuando no hay foto)
  avatarUrl?: string; // URL de la foto de perfil (Supabase Storage)
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
