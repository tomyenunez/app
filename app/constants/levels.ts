// Shim de compatibilidad: el sistema de niveles fue reemplazado por los 10
// rangos gema (ver ranks.ts). Se mantiene este re-export para no romper los
// imports existentes de `getUserLevel`.
export { getUserLevel, RANKS, getRank, getNextRank, getRankProgress, getXPToNextRank, didRankChange } from './ranks';
