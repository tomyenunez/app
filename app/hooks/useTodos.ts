import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Todo } from '../types';
import { todayKey } from '../utils/dateUtils';
import { awardXPOnce, incrementTodoRecord } from '../services/xpService';
import { XP_VALUES } from '../constants/xpValues';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

// Mapeo entre la fila de la tabla `todos` y el tipo Todo de la app
function fromRow(r: any): Todo {
  return {
    id: r.id,
    text: r.texto ?? '',
    done: !!r.done,
    tag: r.tag,
    created: r.created,
    ...(r.fecha ? { fecha: r.fecha } : {}),
    ...(r.pinned ? { pinned: true } : {}),
  };
}
function toRow(t: Todo, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    texto: t.text,
    done: t.done,
    tag: t.tag,
    created: t.created,
    fecha: t.fecha ?? null,
    pinned: !!t.pinned,
  };
}

export function useTodos() {
  const { user } = useAuth();
  const userId = user?.id;
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  // Recarga al enfocar: trae las tareas del usuario desde la nube
  useFocusEffect(
    useCallback(() => {
      if (!userId) { setTodos([]); setLoading(false); return; }
      let active = true;
      (async () => {
        const { data, error } = await supabase
          .from('todos')
          .select('*')
          .order('created_at', { ascending: false });
        if (!active) return;
        if (error) console.warn('[Dayxo todos] leer:', error.message);
        setTodos((data ?? []).map(fromRow));
        setLoading(false);
      })();
      return () => { active = false; };
    }, [userId])
  );

  const add = useCallback(async (text: string, tag: Todo['tag'], fecha?: Date) => {
    if (!userId) return;
    const next: Todo = {
      id: Date.now().toString(),
      text,
      done: false,
      tag,
      created: todayKey(),
      ...(fecha ? { fecha: fecha.toISOString() } : {}),
    };
    setTodos((prev) => [next, ...prev]);
    const { error } = await supabase.from('todos').insert(toRow(next, userId));
    if (error) console.warn('[Dayxo todos] crear:', error.message);
  }, [userId]);

  const toggle = useCallback(async (id: string) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;
    const newDone = !target.done;
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, done: newDone } : t));
    const { error } = await supabase.from('todos').update({ done: newDone }).eq('id', id);
    if (error) console.warn('[Dayxo todos] completar:', error.message);
    // XP solo al completar (nunca resta); una vez por tarea
    if (newDone) {
      incrementTodoRecord();
      awardXPOnce(`todo-${id}`, XP_VALUES.COMPLETE_TODO, 'Tarea completada');
    }
  }, [todos]);

  const remove = useCallback(async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (error) console.warn('[Dayxo todos] borrar:', error.message);
  }, []);

  const update = useCallback(async (id: string, text: string, tag: Todo['tag'], fecha?: Date) => {
    const nextFecha = fecha ? fecha.toISOString() : undefined;
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, text, tag, fecha: nextFecha } : t));
    const { error } = await supabase.from('todos')
      .update({ texto: text, tag, fecha: nextFecha ?? null })
      .eq('id', id);
    if (error) console.warn('[Dayxo todos] editar:', error.message);
  }, []);

  const togglePin = useCallback(async (id: string) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;
    const newPinned = !target.pinned;
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, pinned: newPinned } : t));
    const { error } = await supabase.from('todos').update({ pinned: newPinned }).eq('id', id);
    if (error) console.warn('[Dayxo todos] pin:', error.message);
  }, [todos]);

  const pending = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return { todos, pending, done, loading, add, update, toggle, remove, togglePin };
}
