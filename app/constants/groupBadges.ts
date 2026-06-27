// Badges grupales (10). Visual; el desbloqueo real lo maneja el backend de Mateo.

export type GroupBadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface GroupBadge {
  id: string;
  name: string;
  emoji: string;
  rarity: GroupBadgeRarity;
  description: string; // cómo se desbloquea
}

// Badge con su estado de desbloqueo (lo arma la sección a partir de datos del backend)
export interface GroupBadgeDisplay extends GroupBadge {
  unlocked: boolean;
  unlockedDaysAgo?: number;
}

export const GROUP_BADGES: GroupBadge[] = [
  { id: 'group_machine', name: 'Máquina grupal', emoji: '🏭', rarity: 'common', description: '50 hábitos grupales completados en una semana.' },
  { id: 'group_perfect', name: 'Día perfecto en equipo', emoji: '✨', rarity: 'rare', description: 'Todo el grupo completó todos sus hábitos el mismo día.' },
  { id: 'group_productive', name: 'Equipo productivo', emoji: '📈', rarity: 'common', description: '100 tareas completadas entre todos en un mes.' },
  { id: 'group_streak_all', name: 'Racha total', emoji: '🔥', rarity: 'epic', description: 'Todos mantuvieron la racha grupal durante 30 días.' },
  { id: 'group_extra', name: 'Milla extra', emoji: '⭐', rarity: 'rare', description: 'El grupo sumó 20 hábitos extra en una semana.' },
  { id: 'tournament_gold', name: 'Oro de torneo', emoji: '🥇', rarity: 'legendary', description: 'Ganaste un torneo del grupo.' },
  { id: 'tournament_silver', name: 'Plata de torneo', emoji: '🥈', rarity: 'epic', description: 'Saliste 2° en un torneo del grupo.' },
  { id: 'tournament_bronze', name: 'Bronce de torneo', emoji: '🥉', rarity: 'rare', description: 'Saliste 3° en un torneo del grupo.' },
  { id: 'mirror_winner', name: 'Rey del espejo', emoji: '🪞', rarity: 'epic', description: 'Ganaste un desafío de hábito espejo.' },
  { id: 'roulette_7', name: 'Ruletero', emoji: '🎲', rarity: 'rare', description: 'Completaste 7 retos de la ruleta grupal.' },
];

// Estilo de cada rareza (mismo sistema que los badges individuales)
export const GROUP_BADGE_RARITY: Record<GroupBadgeRarity, { bg: string; border: string; glow?: string }> = {
  common: { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.15)' },
  rare: { bg: 'rgba(9,132,227,0.15)', border: 'rgba(9,132,227,0.4)' },
  epic: { bg: 'rgba(124,58,237,0.18)', border: 'rgba(124,58,237,0.5)', glow: '#7C3AED' },
  legendary: { bg: 'rgba(255,217,61,0.15)', border: '#FFD93D', glow: '#FFD93D' },
};

export const GROUP_BADGE_RARITY_LABEL: Record<GroupBadgeRarity, string> = {
  common: 'Común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
};
