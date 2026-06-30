import { SharedGroup, SharedMember } from '../types';

// Saldo de cada integrante dentro de un grupo de gastos compartidos.
export interface MemberBalance {
  member: SharedMember;
  paid: number;     // cuánto puso
  share: number;    // cuánto le tocaba (su parte de los gastos)
  balance: number;  // paid - share → positivo: le deben · negativo: debe
}

// Una transferencia sugerida para saldar las cuentas.
export interface Settlement {
  from: SharedMember; // el que paga
  to: SharedMember;   // el que cobra
  monto: number;
}

export function groupTotal(group: SharedGroup): number {
  return group.expenses.reduce((s, e) => s + e.monto, 0);
}

// Calcula cuánto puso y cuánto le tocaba a cada integrante.
// La parte de cada gasto se divide en partes iguales entre `splitBetween`.
export function computeBalances(group: SharedGroup): MemberBalance[] {
  const paid: Record<string, number> = {};
  const share: Record<string, number> = {};
  group.members.forEach((m) => { paid[m.id] = 0; share[m.id] = 0; });

  group.expenses.forEach((e) => {
    const entre = e.splitBetween.length > 0 ? e.splitBetween : group.members.map((m) => m.id);
    if (paid[e.paidBy] !== undefined) paid[e.paidBy] += e.monto;
    // Reparto en partes iguales; el resto (centavos) se le suma al primero
    // para que la suma de las partes dé exactamente el total.
    const base = Math.floor(e.monto / entre.length);
    let resto = e.monto - base * entre.length;
    entre.forEach((id) => {
      if (share[id] === undefined) return;
      share[id] += base + (resto > 0 ? 1 : 0);
      if (resto > 0) resto--;
    });
  });

  return group.members.map((m) => ({
    member: m,
    paid: paid[m.id],
    share: share[m.id],
    balance: paid[m.id] - share[m.id],
  }));
}

// A partir de los balances, calcula las transferencias mínimas para saldar todo
// (algoritmo greedy: empareja al que más debe con el que más le deben).
export function computeSettlements(balances: MemberBalance[]): Settlement[] {
  const acreedores = balances.filter((b) => b.balance > 0).map((b) => ({ member: b.member, monto: b.balance }));
  const deudores = balances.filter((b) => b.balance < 0).map((b) => ({ member: b.member, monto: -b.balance }));
  acreedores.sort((a, b) => b.monto - a.monto);
  deudores.sort((a, b) => b.monto - a.monto);

  const out: Settlement[] = [];
  let i = 0, j = 0;
  while (i < deudores.length && j < acreedores.length) {
    const pago = Math.min(deudores[i].monto, acreedores[j].monto);
    if (pago > 0) {
      out.push({ from: deudores[i].member, to: acreedores[j].member, monto: pago });
    }
    deudores[i].monto -= pago;
    acreedores[j].monto -= pago;
    if (deudores[i].monto <= 0) i++;
    if (acreedores[j].monto <= 0) j++;
  }
  return out;
}
