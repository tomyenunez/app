import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Todo } from '../types';
import { getTodos, saveTodos } from '../services/storage';
import { todayKey } from '../utils/dateUtils';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  // Recarga al enfocar el tab: otra pantalla pudo haber modificado el storage
  useFocusEffect(
    useCallback(() => {
      getTodos().then((t) => { setTodos(t); setLoading(false); });
    }, [])
  );

  const add = useCallback(async (text: string, tag: Todo['tag']) => {
    const next: Todo = {
      id: Date.now().toString(),
      text,
      done: false,
      tag,
      created: todayKey(),
    };
    const updated = [next, ...todos];
    setTodos(updated);
    await saveTodos(updated);
  }, [todos]);

  const toggle = useCallback(async (id: string) => {
    const updated = todos.map((t) => t.id === id ? { ...t, done: !t.done } : t);
    setTodos(updated);
    await saveTodos(updated);
  }, [todos]);

  const remove = useCallback(async (id: string) => {
    const updated = todos.filter((t) => t.id !== id);
    setTodos(updated);
    await saveTodos(updated);
  }, [todos]);

  const pending = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return { todos, pending, done, loading, add, toggle, remove };
}
