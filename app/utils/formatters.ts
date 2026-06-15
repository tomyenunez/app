export function formatARS(amount: number): string {
  const abs = Math.abs(amount);
  // Solo muestra centavos si los hay (1.000 / 1.000,50)
  const hasDecimals = Math.round(abs * 100) % 100 !== 0;
  return '$' + abs.toLocaleString('es-AR', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  });
}

export function formatARSWithSign(amount: number): string {
  return (amount >= 0 ? '+' : '-') + formatARS(amount);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// Formatea el monto mientras se escribe: "1000" → "1.000", coma para centavos
// (los puntos de miles que ya estaban se descartan y se recalculan en cada tecla)
export function formatMontoInput(text: string): string {
  const cleaned = text.replace(/[^\d,]/g, '');
  const firstComma = cleaned.indexOf(',');
  let intPart = firstComma === -1 ? cleaned : cleaned.slice(0, firstComma);
  const decPart = firstComma === -1 ? null : cleaned.slice(firstComma + 1).replace(/,/g, '').slice(0, 2);
  intPart = intPart.replace(/^0+(?=\d)/, '');
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart === null ? withDots : `${withDots},${decPart}`;
}

// "1.000,50" → 1000.5
export function parseMontoInput(formatted: string): number {
  const normalized = formatted.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : n;
}
