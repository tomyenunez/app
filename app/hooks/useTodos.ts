import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Todo } from '../types';
import { getTodos, saveTodos } from '../services/storage';
import { todayKey } from '../utils/dateUtils';
import { awardXPOnce, incrementTodoRecord } from '../services/xpService';
import { XP_VALUES } from '../constants/xpValues';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  // Recarga al enfocar el tab: otra pantalla pudo haber modificado el storage
  useFocusEffect(
    useCallback(() => {
      getTodos().then((t) => { setTodos(t); setLoading(false); });
    }, [])
  );

  const add = useCallback(async (text: string, tag: Todo['tag'], fecha?: Date) => {
    const next: Todo = {
      id: Date.now().toString(),
      text,
      done: false,
      tag,
      created: todayKey(),
      ...(fecha ? { fecha: fecha.toISOString() } : {}),
    };
    const updated = [next, ...todos];
    setTodos(updated);
    await saveTodos(updated);
  }, [todos]);

  const toggle = useCallback(async (id: string) => {
    const target = todos.find((t) => t.id === id);
    const updated = todos.map((t) => t.id === id ? { ...t, done: !t.done } : t);
    setTodos(updated);
    await saveTodos(updated);
    // XP solo al completar (nunca resta); una vez por tarea
    if (target && !target.done) {
      incrementTodoRecord();
      awardXPOnce(`todo-${id}`, XP_VALUES.COMPLETE_TODO, 'Tarea completada');
    }
  }, [todos]);

  const remove = useCallback(async (id: string) => {
    const updated = todos.filter((t) => t.id !== id);
    setTodos(updated);
    await saveTodos(updated);
  }, [todos]);

  const update = useCallback(async (id: string, text: string, tag: Todo['tag'], fecha?: Date) => {
    const updated = todos.map((t) => t.id === id
      ? { ...t, text, tag, fecha: fecha ? fecha.toISOString() : undefined }
      : t);
    setTodos(updated);
    await saveTodos(updated);
  }, [todos]);

  const togglePin = useCallback(async (id: string) => {
    const updated = todos.map((t) => t.id === id ? { ...t, pinned: !t.pinned } : t);
    setTodos(updated);
    await saveTodos(updated);
  }, [todos]);

  const pending = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return { todos, pending, done, loading, add, update, toggle, remove, togglePin };
}
