export interface Todo {
  id: string;
  text: string;
  done: boolean;
  tag: 'personal' | 'uni' | 'trabajo' | 'otro';
  created: string; // "YYYY-M-D"
}

export interface Deuda {
  id: string;
  nombre: string;
  monto: number;
  desc: string;
  tipo: 'me-debe' | 'le-debo';
  fecha: string; // "YYYY-M-D"
}

export interface Habito {
  id: string;
  name: string;
  days: number[]; // 0=Lunes ... 6=Domingo
}

export interface Transaction {
  id: string;
  desc: string;
  monto: number;
  tipo: 'ingreso' | 'gasto';
  fecha: string; // "YYYY-M-D"
  fechaStr: string;
}

export interface Evento {
  id: string;
  titulo: string;
  fecha: string; // ISO string
  tipo: 'personal' | 'grupo' | 'uni';
  hora: string; // "HH:MM" o ""
}

export interface AppState {
  todos: Todo[];
  deudas: Deuda[];
  habitos: Habito[];
  txs: Transaction[];
  eventos: Evento[];
  habitDone: Record<string, boolean>;
  streak: number;
  lastActive: string;
}
