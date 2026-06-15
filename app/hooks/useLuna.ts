import { useState, useEffect, useCallback, useRef } from 'react';
import { LunaMessage, ContextType } from '../types/luna';
import { sendToLuna, detectCrisis, buildAppContext, LunaError } from '../services/lunaService';
import { LUNA_WELCOME, LUNA_CRISIS_RESPONSE, LUNA_ERROR_NETWORK } from '../constants/lunaPrompt';
import {
  getLunaHistory, saveLunaHistory, getLunaLastOpened, saveLunaLastOpened,
} from '../services/storage';
import { todayKey } from '../utils/dateUtils';

const CONTEXT_LABELS: Record<ContextType, string> = {
  tareas: 'Compartiste tus tareas con Luna',
  habitos: 'Compartiste tus hábitos con Luna',
  finanzas: 'Compartiste tu situación financiera con Luna',
  completo: 'Compartiste tu resumen del día con Luna',
};

function makeMessage(role: LunaMessage['role'], content: string, extra?: Partial<LunaMessage>): LunaMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    content,
    timestamp: new Date().toISOString(),
    ...extra,
  };
}

// OJO: este hook se usa fuera del navigator (LunaBubble flota sobre toda la app),
// así que usa useEffect plano — useFocusEffect explotaría sin contexto de navegación.
export function useLuna() {
  const [messages, setMessages] = useState<LunaMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [crisisMode, setCrisisMode] = useState(false);
  const [openedToday, setOpenedToday] = useState(true); // arranca true para no pulsar antes de saber
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  useEffect(() => {
    Promise.all([getLunaHistory(), getLunaLastOpened()]).then(([history, lastOpened]) => {
      if (history.length === 0) {
        const welcome = makeMessage('assistant', LUNA_WELCOME);
        setMessages([welcome]);
        saveLunaHistory([welcome]);
      } else {
        setMessages(history);
      }
      setOpenedToday(lastOpened === todayKey());
    });
  }, []);

  const persist = useCallback((msgs: LunaMessage[]) => {
    setMessages(msgs);
    saveLunaHistory(msgs);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
    setOpenedToday(true);
    saveLunaLastOpened(todayKey());
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg = makeMessage('user', trimmed);
    let updated = [...messages, userMsg];
    persist(updated);

    // Crisis: respuesta local inmediata, sin pasar por la API
    if (detectCrisis(trimmed)) {
      setCrisisMode(true);
      const crisisMsg = makeMessage('assistant', LUNA_CRISIS_RESPONSE);
      persist([...updated, crisisMsg]);
      return;
    }

    setIsTyping(true);
    try {
      const reply = await sendToLuna(updated);
      updated = [...updated, makeMessage('assistant', reply)];
    } catch (e) {
      const msg = e instanceof LunaError ? e.message : LUNA_ERROR_NETWORK;
      updated = [...updated, makeMessage('assistant', msg)];
    } finally {
      setIsTyping(false);
    }
    persist(updated);
    if (!isOpenRef.current) setUnreadCount((c) => c + 1);
  }, [messages, isTyping, persist]);

  const shareContext = useCallback(async (type: ContextType) => {
    const contextData = await buildAppContext(type);
    const shareMsg = makeMessage('system', CONTEXT_LABELS[type], {
      isContextShare: true,
      contextData,
    });
    persist([...messages, shareMsg]);
  }, [messages, persist]);

  return {
    messages,
    isOpen,
    isTyping,
    unreadCount,
    crisisMode,
    openedToday,
    open,
    close,
    send,
    shareContext,
  };
}
