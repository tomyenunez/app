export interface LunaMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // ISO string (sobrevive el round-trip por AsyncStorage)
  isContextShare?: boolean; // true si es la burbuja "Compartiste X con Luna"
  contextData?: string; // datos reales compartidos (se mandan a la API, no se muestran)
}

export type ContextType = 'tareas' | 'habitos' | 'finanzas' | 'completo';
