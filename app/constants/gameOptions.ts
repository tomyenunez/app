// Opciones de juego grupal (solo 1 activo a la vez por grupo). La racha grupal
// no se elige — corre automática en paralelo. UI visual; la lógica es de Mateo.

export type GroupGameType = 'group_mission' | 'tournament' | 'shared_habit' | 'roulette' | 'mirror_habit';

export interface GameOption {
  type: GroupGameType;
  emoji: string;
  title: string;
  description: string;
  durationTag: string; // "1 semana", "1-4 semanas", etc.
  rewardTag: string;   // "+500 XP", etc.
  accentColor: string;
}

export const GAME_OPTIONS: GameOption[] = [
  {
    type: 'group_mission',
    emoji: '🎯',
    title: 'Misión semanal',
    description: 'Un objetivo colectivo — entre todos llegan a una meta y ganan XP bonus + badge.',
    durationTag: '1 semana',
    rewardTag: '+500 XP',
    accentColor: '#7C3AED',
  },
  {
    type: 'tournament',
    emoji: '🏆',
    title: 'Torneo',
    description: 'Todos contra todos por XP. Ranking en vivo. Top 3 se llevan premios.',
    durationTag: '1-4 semanas',
    rewardTag: '+500/250/100 XP',
    accentColor: '#FF6B00',
  },
  {
    type: 'shared_habit',
    emoji: '🔥',
    title: 'Hábito compartido',
    description: 'Todos adoptan el mismo hábito. Bonus si todos lo completan el mismo día.',
    durationTag: '1-4 semanas',
    rewardTag: '+30/+50 XP',
    accentColor: '#00B894',
  },
  {
    type: 'roulette',
    emoji: '🎲',
    title: 'Ruleta de retos',
    description: 'Reto aleatorio para todo el grupo. Se puede usar 1 vez por semana.',
    durationTag: '1 día - 1 semana',
    rewardTag: '+80 a +200 XP',
    accentColor: '#FFD93D',
  },
  {
    type: 'mirror_habit',
    emoji: '🪞',
    title: 'Hábito espejo',
    description: 'Desafío 1v1 — copiás el hábito de alguien y compiten para ver quién es más constante.',
    durationTag: '7/14/30 días',
    rewardTag: '+150 XP',
    accentColor: '#E84393',
  },
];

export interface DurationOption {
  label: string;
  value: number; // en días
}

// Opciones de duración por tipo de juego. La ruleta no tiene selector (es automática).
export const GAME_DURATIONS: Record<GroupGameType, DurationOption[]> = {
  group_mission: [{ label: '1 semana', value: 7 }, { label: '2 semanas', value: 14 }, { label: '1 mes', value: 30 }],
  tournament: [{ label: '1 semana', value: 7 }, { label: '2 semanas', value: 14 }, { label: '1 mes', value: 30 }],
  shared_habit: [{ label: '1 semana', value: 7 }, { label: '2 semanas', value: 14 }, { label: '1 mes', value: 30 }],
  roulette: [],
  mirror_habit: [{ label: '7 días', value: 7 }, { label: '14 días', value: 14 }, { label: '30 días', value: 30 }],
};
