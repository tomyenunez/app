// Frases motivacionales al subir de rango (por nombre de gema).
export const RANK_UP_MESSAGES: Record<string, string> = {
  Plata: 'Arrancaste. El primer paso es el más difícil.',
  Oro: 'Ya le agarraste el ritmo. Esto recién empieza.',
  Esmeralda: 'Un mes y ya se nota. Seguí.',
  Zafiro: 'Estás entre los pocos que llegan hasta acá.',
  Rubí: 'Tres meses de constancia. Eso no lo tiene cualquiera.',
  Amatista: 'Medio año. Ya sos otro.',
  Platino: 'Élite. El 95% nunca llegó hasta acá.',
  Diamante: 'Casi nadie ve esto. Vos sí.',
  Obsidiana: 'Leyenda. No hay nada más arriba.',
};

export function rankUpMessage(rankName: string): string {
  return RANK_UP_MESSAGES[rankName] ?? '¡Seguí así!';
}
