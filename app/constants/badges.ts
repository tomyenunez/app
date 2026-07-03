import { Badge, BadgeCategory } from '../types/game';
import { RANKS } from './ranks';

// ============================================================
// Catálogo de logros v2 — 6 familias curadas por Mateo.
// Dos mecanismos de desbloqueo:
//  - `check(stats)`: se evalúa automáticamente al ganar XP (metas numéricas).
//  - sin check: se desbloquea con unlockBadge(id) desde el punto exacto
//    de la app donde ocurre el trigger (easter eggs, eventos puntuales).
// Los `secret: true` se muestran como "???" hasta desbloquearse.
// Todo se guarda en la nube (game_state.badges).
// ============================================================

// Métricas que evalúan las condiciones automáticas
export interface BadgeStats {
  streak: number;
  xpTotal: number;
  totalTodos: number;
  totalHabits: number;
  activeDays: number;      // días distintos con actividad (claves de xp_daily)
  lostStreak7: boolean;    // perdió una racha de 7+ alguna vez (Remontada)
  unlockedIds: string[];   // para los logros meta (coleccionista, etc.)
  // Hints legacy que siguen mandando los hooks (hoy sin logros asociados)
  weeklyStars?: number;
  perfectDays7?: boolean;
  completedAfter23?: boolean;
  completedBefore7?: boolean;
  perfectDay?: boolean;
  newWeekRecord?: boolean;
}

export interface BadgeDef extends Badge {
  check?: (s: BadgeStats) => boolean; // sin check = solo unlockBadge() directo
}

const secretIds = (defs: BadgeDef[]) => defs.filter((b) => b.secret).map((b) => b.id);

// Rarezas por nivel de rango (1-10)
const RANK_RARITY = ['common', 'common', 'common', 'rare', 'rare', 'epic', 'epic', 'legendary', 'legendary', 'legendary'] as const;

// Un logro por cada rango gema (Bronce → Obsidiana)
const RANK_BADGES: BadgeDef[] = RANKS.map((r) => ({
  id: `rank_${r.level}`,
  name: `Rango ${r.name}`,
  description: `Alcanzaste el rango ${r.name} ${r.icon}`,
  icon: r.icon,
  rarity: RANK_RARITY[r.level - 1],
  color: r.color,
  category: 'meta' as BadgeCategory,
  check: (s) => s.xpTotal >= r.minXP && s.xpTotal > 0,
}));

export const BADGES: BadgeDef[] = [
  // ---------- 🥚 OCULTOS (aparecen como "???") ----------
  { id: 'boton_secreto', name: 'No deberías estar acá', description: 'Encontraste un botón secreto', icon: '👁️', rarity: 'epic', color: '#6C5CE7', category: 'ocultos', secret: true },
  { id: 'ritual_nocturno', name: 'Ritual nocturno', description: 'Usaste Dayxo cuando todos dormían', icon: '🌙', rarity: 'rare', color: '#A29BFE', category: 'ocultos', secret: true },
  { id: 'paciencia_rara', name: 'Paciencia rara', description: 'Esperaste más de lo necesario', icon: '🧘', rarity: 'rare', color: '#00B894', category: 'ocultos', secret: true },
  { id: 'se_va_a_romper', name: '¡Se va a romper!', description: 'Tocaste el mismo lugar demasiadas veces', icon: '📡', rarity: 'rare', color: '#E17055', category: 'ocultos', secret: true },
  { id: 'stalker_carinoso', name: 'Stalker cariñoso', description: 'Visitaste el perfil del mismo amigo una y otra vez', icon: '👀', rarity: 'rare', color: '#E84393', category: 'ocultos', secret: true },
  { id: 'nota_flash', name: 'Sin que se escape', description: 'Guardaste una nota apenas abriste la app', icon: '🪤', rarity: 'rare', color: '#FDCB6E', category: 'ocultos', secret: true },
  { id: 'sin_instrucciones', name: 'Sin instrucciones', description: 'Descubriste un secreto sin que nadie te diga nada', icon: '🗝️', rarity: 'epic', color: '#FFD93D', category: 'ocultos', secret: true },

  // ---------- 🤝 SOCIAL ----------
  { id: 'primer_aliado', name: 'Primer aliado', description: 'Tu primera amistad en Dayxo', icon: '🤝', rarity: 'common', color: '#00B894', category: 'social' },
  { id: 'fundador', name: 'Fundador', description: 'Creaste tu primer grupo', icon: '🏛️', rarity: 'common', color: '#0984E3', category: 'social' },
  { id: 'anfitrion', name: 'Anfitrión', description: 'Tu grupo llegó a 3 miembros', icon: '🫂', rarity: 'rare', color: '#E84393', category: 'social' },
  { id: 'conexion_real', name: 'Conexión real', description: '5 amigos en Dayxo', icon: '🔗', rarity: 'rare', color: '#6C5CE7', category: 'social' },
  { id: 'la_banda', name: 'La banda', description: 'Sos parte de 3 grupos', icon: '👥', rarity: 'rare', color: '#FF6B00', category: 'social' },
  { id: 'lider_natural', name: 'Líder natural', description: 'Tu grupo sigue vivo después de una semana', icon: '👑', rarity: 'epic', color: '#FDCB6E', category: 'social' },

  // ---------- 🏆 META / COLECCIÓN ----------
  ...RANK_BADGES,
  { id: 'ascendido', name: 'Ascendido', description: 'Subiste de rango por primera vez', icon: '🚀', rarity: 'common', color: '#74B9FF', category: 'meta', check: (s) => s.xpTotal >= 50 },
  { id: 'veterano', name: 'Veterano', description: 'Usaste Dayxo durante 30 días distintos', icon: '🛡️', rarity: 'epic', color: '#636E72', category: 'meta', check: (s) => s.activeDays >= 30 },
  { id: 'coleccionista', name: 'Coleccionista', description: 'Desbloqueaste 10 logros', icon: '🏆', rarity: 'rare', color: '#FDCB6E', category: 'meta', check: (s) => s.unlockedIds.length >= 10 },
  { id: 'cazador_logros', name: 'Cazador de logros', description: 'Desbloqueaste 25 logros', icon: '🎯', rarity: 'epic', color: '#E17055', category: 'meta', check: (s) => s.unlockedIds.length >= 25 },
  { id: 'primer_brillo', name: 'Primer brillo', description: 'Desbloqueaste tu primer logro oculto', icon: '✨', rarity: 'rare', color: '#FFD93D', category: 'meta', check: (s) => s.unlockedIds.filter((id) => SECRET_IDS.includes(id)).length >= 1 },
  { id: 'cofre_secreto', name: 'Cofre secreto', description: 'Desbloqueaste 5 logros ocultos', icon: '🔐', rarity: 'legendary', color: '#6C5CE7', category: 'meta', check: (s) => s.unlockedIds.filter((id) => SECRET_IDS.includes(id)).length >= 5 },
  {
    id: 'insignia_dorada', name: 'Insignia dorada', description: 'Completaste una familia entera de logros', icon: '🥇', rarity: 'legendary', color: '#FFD700', category: 'meta',
    check: (s) => (['ocultos', 'social', 'pendientes', 'habitos', 'notas'] as BadgeCategory[]).some((cat) => {
      const fam = BADGES.filter((b) => b.category === cat);
      return fam.length > 0 && fam.every((b) => s.unlockedIds.includes(b.id));
    }),
  },

  // ---------- ✅ PENDIENTES ----------
  { id: 'primer_pendiente', name: 'Primer pendiente', description: 'Completaste tu primer pendiente', icon: '✅', rarity: 'common', color: '#00B894', category: 'pendientes', check: (s) => s.totalTodos >= 1 },
  { id: 'dia_resuelto', name: 'Día resuelto', description: 'Completaste todos tus pendientes del día', icon: '☀️', rarity: 'rare', color: '#FDCB6E', category: 'pendientes' },
  { id: 'cero_excusas', name: 'Cero excusas', description: 'Completaste 10 pendientes', icon: '🧱', rarity: 'common', color: '#B2BEC3', category: 'pendientes', check: (s) => s.totalTodos >= 10 },
  { id: 'maquina_tachar', name: 'Máquina de tachar', description: 'Completaste 50 pendientes', icon: '🖊️', rarity: 'rare', color: '#0984E3', category: 'pendientes', check: (s) => s.totalTodos >= 50 },
  { id: 'semana_limpia', name: 'Semana limpia', description: 'Cerraste la semana sin pendientes vencidos', icon: '🧼', rarity: 'epic', color: '#74B9FF', category: 'pendientes' },
  { id: 'ultimo_minuto', name: 'El último minuto', description: 'Completaste un pendiente el día que vencía', icon: '⏰', rarity: 'common', color: '#E17055', category: 'pendientes' },
  { id: 'antes_de_tiempo', name: 'Antes de tiempo', description: 'Completaste un pendiente antes de su fecha', icon: '⚡', rarity: 'common', color: '#FDCB6E', category: 'pendientes' },
  { id: 'orden_interno', name: 'Orden interno', description: 'Usaste 3 categorías distintas en tus pendientes', icon: '🗂️', rarity: 'common', color: '#6C5CE7', category: 'pendientes' },
  { id: 'plan_salio_bien', name: 'El plan salió bien', description: 'Completaste el 100% de tus pendientes de la semana', icon: '🧠', rarity: 'epic', color: '#E84393', category: 'pendientes' },

  // ---------- 🔥 HÁBITOS / RACHAS ----------
  { id: 'primer_fuego', name: 'Primer fuego', description: 'Cumpliste tu primer hábito', icon: '🔥', rarity: 'common', color: '#FF6B00', category: 'habitos', check: (s) => s.totalHabits >= 1 },
  { id: 'streak_3', name: 'Racha inicial', description: 'Racha de 3 días', icon: '🌱', rarity: 'common', color: '#00B894', category: 'habitos', check: (s) => s.streak >= 3 },
  { id: 'streak_7', name: 'Semana de fuego', description: 'Racha de 7 días', icon: '🔥', rarity: 'rare', color: '#E17055', category: 'habitos', check: (s) => s.streak >= 7 },
  { id: 'streak_14', name: 'Modo disciplina', description: 'Racha de 14 días', icon: '🧘', rarity: 'rare', color: '#6C5CE7', category: 'habitos', check: (s) => s.streak >= 14 },
  { id: 'streak_30', name: 'Inquebrantable', description: 'Racha de 30 días', icon: '🛡️', rarity: 'epic', color: '#74B9FF', category: 'habitos', check: (s) => s.streak >= 30 },
  { id: 'ritual_diario', name: 'Ritual diario', description: 'Cumpliste el mismo hábito 10 veces', icon: '📿', rarity: 'rare', color: '#A29BFE', category: 'habitos' },
  { id: 'tres_pilares', name: 'Tres pilares', description: 'Mantuviste 3 hábitos activos', icon: '🏛️', rarity: 'common', color: '#0984E3', category: 'habitos' },
  { id: 'full_semana', name: 'Full semana', description: 'Cumpliste todos los hábitos planeados de la semana', icon: '📆', rarity: 'epic', color: '#00B894', category: 'habitos' },
  { id: 'sin_romper_cadena', name: 'Sin romper cadena', description: 'Un hábito cumplido 7 días seguidos', icon: '⛓️', rarity: 'rare', color: '#636E72', category: 'habitos' },
  { id: 'remontada', name: 'Remontada', description: 'Volviste a una racha de 7 después de perder una', icon: '🔁', rarity: 'epic', color: '#E84393', category: 'habitos', check: (s) => s.streak >= 7 && s.lostStreak7 },

  // ---------- 💡 NOTAS RÁPIDAS ----------
  { id: 'idea_guardada', name: 'Idea guardada', description: 'Creaste tu primera nota rápida', icon: '💡', rarity: 'common', color: '#FDCB6E', category: 'notas' },
  { id: 'no_lo_pierdo_mas', name: 'No lo pierdo más', description: 'Guardaste 10 notas', icon: '🧠', rarity: 'common', color: '#6C5CE7', category: 'notas' },
  { id: 'cerebro_externo', name: 'Cerebro externo', description: 'Guardaste 25 notas', icon: '📝', rarity: 'rare', color: '#0984E3', category: 'notas' },
  { id: 'pensamiento_fugaz', name: 'Pensamiento fugaz', description: 'Escribiste una nota ultra corta', icon: '⚡', rarity: 'common', color: '#74B9FF', category: 'notas' },
  { id: 'manifiesto', name: 'Manifiesto', description: 'Escribiste una nota de más de 500 caracteres', icon: '📜', rarity: 'rare', color: '#E17055', category: 'notas' },
  { id: 'volver_a_mirar', name: 'Volver a mirar', description: 'Abriste una nota de hace más de una semana', icon: '👀', rarity: 'common', color: '#00B894', category: 'notas' },
  { id: 'idea_nocturna', name: 'Idea nocturna', description: 'Guardaste una nota de madrugada', icon: '🌙', rarity: 'common', color: '#A29BFE', category: 'notas' },
  { id: 'nota_rescatada', name: 'Nota rescatada', description: 'Editaste una nota de hace más de una semana', icon: '♻️', rarity: 'rare', color: '#E84393', category: 'notas' },
];

// Ids de los logros secretos (para "Primer brillo" / "Cofre secreto")
export const SECRET_IDS: string[] = secretIds(BADGES);

export const RARITY_LABEL: Record<Badge['rarity'], string> = {
  common: 'Común',
  rare: 'Rara',
  epic: 'Épica',
  legendary: 'Legendaria',
};

export const CATEGORY_LABEL: Record<BadgeCategory, string> = {
  ocultos: '🥚 Secretos',
  habitos: '🔥 Hábitos y rachas',
  pendientes: '✅ Pendientes',
  notas: '💡 Notas rápidas',
  social: '🤝 Social',
  meta: '🏆 Colección',
};

// Orden de las familias en la UI
export const CATEGORY_ORDER: BadgeCategory[] = ['habitos', 'pendientes', 'notas', 'social', 'ocultos', 'meta'];
