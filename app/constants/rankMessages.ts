// Frases motivacionales al subir de rango (por nombre de gema).
export const RANK_UP_MESSAGES: Record<string, string> = {
  Plata: 'Arrancaste. El primer paso es el más difícil y ya lo diste.',
  Oro: 'Le agarraste el ritmo. Esto recién empieza.',
  Esmeralda: 'Tu constancia ya se nota. Seguí firme.',
  Zafiro: 'Estás entre los pocos que llegan hasta acá.',
  Rubí: 'Esta disciplina no la tiene cualquiera.',
  Amatista: 'Te superaste. Ya sos otra versión de vos.',
  Platino: 'Élite. Cada rango anterior valió la pena.',
  Diamante: 'Casi nadie ve esto. Vos sí.',
  Obsidiana: 'Leyenda. Ya no hay límite, solo versiones tuyas por superar.',
};

export function rankUpMessage(rankName: string): string {
  return RANK_UP_MESSAGES[rankName] ?? '¡Seguí así!';
}
