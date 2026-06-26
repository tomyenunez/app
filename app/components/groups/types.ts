// Tipos de la pantalla de Grupos (solo UI — el backend lo arma Mateo).
// Los datos hoy son mock; estas interfaces son el contrato visual.

export interface GroupActivityFeedItem {
  id: string;
  emoji: string;     // 🥇 🎯 🎲 🔥 🏆 🪞 según el evento
  text: string;      // el nombre propio va entre **dobles asteriscos** (se renderiza en negrita)
  groupId: string;
  timestamp: string; // relativo: "Hace 20 min", "Hace 2 hs", "Ayer"
}

export interface GroupListItem {
  id: string;
  name: string;
  emoji: string;       // ícono elegido por el creador
  accentColor: string; // color del fondo del ícono (se usa translúcido)
  memberCount: number;
  groupStreak: number; // 0 si no hay racha activa
  hasLiveGame: boolean; // hay un juego/torneo/misión activo ahora
  unreadCount: number;  // novedades sin ver
}

// --- Detalle de grupo ---

export interface GroupMember {
  userId: string;
  username: string;
  avatarColor: string;
  isAdmin: boolean;
}

export interface ActiveGroupGame {
  type: 'shared_habit' | 'group_streak' | 'group_mission' | 'tournament' | 'roulette' | 'mirror_habit';
  emoji: string;
  title: string;
  description: string;
  timeRemaining: string; // "3 días restantes"
  progress: number;      // 0-100
  progressLabel: string; // "34 / 50 hábitos · +500 XP al completar"
}

export interface RankingEntry {
  position: number;
  userId: string;
  username: string;
  avatarColor: string;
  rankName: string;  // rango individual, ej "Amatista"
  rankIcon: string;  // 💜 ⚡ 🥇
  xpThisWeek: number;
  isCurrentUser: boolean;
}

export interface GroupInviteRequest {
  id: string;
  invitedUsername: string;
  invitedByUsername: string;
  avatarColor: string;
}

// Gradientes predefinidos para la portada (combinaciones de los colores Dayxo)
export const GROUP_COVER_GRADIENTS: [string, string][] = [
  ['#FF6B00', '#7C3AED'], // naranja → violeta (default)
  ['#FF6B00', '#FFD93D'], // naranja → amarillo
  ['#7C3AED', '#E84393'], // violeta → rosa
  ['#00B894', '#0984E3'], // verde → azul
  ['#E84393', '#FFD93D'], // rosa → amarillo
  ['#0984E3', '#7C3AED'], // azul → violeta
  ['#1A1A1A', '#FF6B00'], // negro → naranja
  ['#00B894', '#FFD93D'], // verde → amarillo
];
