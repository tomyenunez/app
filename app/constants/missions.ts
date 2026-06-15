import { XP_VALUES } from './xpValues';

export interface MissionTemplate {
  id: string;
  text: string;
  xp: number;
  type: 'daily' | 'weekly';
}

// Misiones diarias que se muestran (progreso calculado desde los datos)
export const DAILY_MISSIONS: MissionTemplate[] = [
  { id: 'dm_all_habits', text: 'Completá todos tus hábitos de hoy', xp: XP_VALUES.MISSION_DAILY, type: 'daily' },
  { id: 'dm_3_todos', text: 'Completá 3 tareas', xp: 80, type: 'daily' },
  { id: 'dm_log_tx', text: 'Registrá un gasto o ingreso', xp: 60, type: 'daily' },
];

// Misiones semanales
export const WEEKLY_MISSIONS: MissionTemplate[] = [
  { id: 'wm_10_todos', text: 'Completá 10 tareas esta semana', xp: 300, type: 'weekly' },
  { id: 'wm_extra_5stars', text: 'Conseguí 5 estrellas extra esta semana', xp: XP_VALUES.MISSION_WEEKLY, type: 'weekly' },
];
