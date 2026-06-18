import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getStreak } from '../services/storage';
import { gameEvents } from '../services/xpService';

// Hook de solo lectura: el conteo de la racha y el XP los procesa
// streakService.onAppOpen() al arrancar. Acá solo reflejamos el valor guardado
// y lo refrescamos cuando se gana XP o al re-enfocar la pantalla.
export function useStreak(): number {
  const [streak, setStreak] = useState(0);

  const refresh = useCallback(() => {
    getStreak().then(setStreak);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  useEffect(() => {
    refresh();
    const unsub = gameEvents.subscribe(() => refresh());
    return unsub;
  }, [refresh]);

  return streak;
}
