export type FamiliaColor = 'violeta' | 'verde' | 'naranja' | 'azul' | 'rosa' | 'amarillo' | 'gris';

// Familia = categoría/grupo personalizable, compartida entre To-do y Agenda
export interface Familia {
  id: string;
  nombre: string;
  color: FamiliaColor;
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  tag: string; // id de Familia
  created: string; // "YYYY-M-D"
  fecha?: string; // ISO — fecha asignada por el usuario (opcional); se marca en el calendario
  hora?: string; // "HH:MM" en 24h — opcional, solo tiene sentido junto con fecha
  pinned?: boolean; // fijado arriba de la lista
  completedAt?: string; // ISO — cuándo se completó (alimenta el historial)
}

export interface Deuda {
  id: string;
  nombre: string;
  monto: number;
  desc: string;
  tipo: 'me-debe' | 'le-debo';
  fecha: string; // "YYYY-M-D"
  pinned?: boolean; // fijado arriba de la lista
}

export interface HabitReminder {
  enabled: boolean;
  hora: string; // "HH:MM" en 24h
  mensaje?: string; // opcional; si está vacío se usa uno por defecto
}

export interface Habito {
  id: string;
  name: string;
  days: number[]; // 0=Lunes ... 6=Domingo
  pinned?: boolean; // fijado arriba de la lista
  recordatorio?: HabitReminder; // notificación local configurable
}

// Categoría de gasto o forma de pago personalizable (comida, efectivo, MP...)
export interface OpcionGasto {
  id: string;
  nombre: string;
  color: FamiliaColor;
}

export interface Transaction {
  id: string;
  desc: string;
  monto: number;
  tipo: 'ingreso' | 'gasto';
  fecha: string; // "YYYY-M-D"
  fechaStr: string;
  categoria?: string; // id de OpcionGasto (solo gastos)
  metodo?: string; // id de OpcionGasto — forma de pago
  pinned?: boolean; // fijado arriba de la lista
}

export interface Evento {
  id: string;
  titulo: string;
  fecha: string; // ISO string
  tipo: string; // id de Familia
  hora: string; // "HH:MM" o ""
}

export interface AppState {
  todos: Todo[];
  deudas: Deuda[];
  habitos: Habito[];
  txs: Transaction[];
  eventos: Evento[];
  familias: Familia[];
  habitDone: Record<string, boolean>;
  streak: number;
  lastActive: string;
}
