export function formatARS(amount: number): string {
  return '$' + Math.abs(amount).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatARSWithSign(amount: number): string {
  const abs = Math.abs(amount).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return (amount >= 0 ? '+$' : '-$') + abs;
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
