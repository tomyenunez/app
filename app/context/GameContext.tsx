import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserLevel, PersonalRecords, PlayerProfile } from '../types/game';
import { getUserLevel } from '../constants/levels';
import { gameEvents } from '../services/xpService';
import { onAppOpen } from '../services/session';
import {
  getXpTotal, getBadges, getRecords, getXpDaily, resetGameCache,
} from '../services/storage';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase';

interface GameContextType {
  xpTotal: number;
  level: UserLevel;
  badges: Record<string, string>; // badgeId -> ISO
  records: PersonalRecords;
  profile: PlayerProfile;
  xpDaily: Record<string, number>;
  setProfile: (p: PlayerProfile) => void;
  reload: () => void;
}

const DEFAULT_RECORDS: PersonalRecords = {
  bestStreak: 0, bestWeekXP: 0, bestDayXP: 0, totalExtraStars: 0,
  totalBadges: 0, totalHabitsCompleted: 0, totalTodosCompleted: 0,
};

const GameContext = createContext<GameContextType>({
  xpTotal: 0,
  level: getUserLevel(0),
  badges: {},
  records: DEFAULT_RECORDS,
  profile: { username: 'Dayxo', avatarColor: '#6C5CE7' },
  xpDaily: {},
  setProfile: () => {},
  reload: () => {},
});

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [xpTotal, setXpTotal] = useState(0);
  const [badges, setBadges] = useState<Record<string, string>>({});
  const [records, setRecords] = useState<PersonalRecords>(DEFAULT_RECORDS);
  const [profile, setProfileState] = useState<PlayerProfile>({ username: 'Dayxo', avatarColor: '#6C5CE7' });
  const [xpDaily, setXpDaily] = useState<Record<string, number>>({});

  const reload = useCallback(() => {
    Promise.all([getXpTotal(), getBadges(), getRecords(), getXpDaily()]).then(
      ([xp, b, r, d]) => {
        setXpTotal(xp);
        setBadges(b);
        setRecords(r);
        setXpDaily(d);
      }
    );
  }, []);

  // Perfil desde la nube (online-only): al loguear lo trae; si no existe, lo crea (upsert)
  useEffect(() => {
    if (!user) {
      setProfileState({ username: 'Dayxo', avatarColor: '#6C5CE7' });
      return;
    }
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_color')
        .eq('id', user.id)
        .maybeSingle();
      if (error) console.warn('[Dayxo profiles] leer:', error.message);
      if (!active) return;
      if (data) {
        setProfileState({ username: data.username, avatarColor: data.avatar_color });
      } else {
        const def = { username: (user.user_metadata?.username as string) || user.email?.split('@')[0] || 'Dayxo', avatarColor: '#6C5CE7' };
        const { error: insErr } = await supabase.from('profiles').upsert({ id: user.id, username: def.username, avatar_color: def.avatarColor });
        if (insErr) console.warn('[Dayxo profiles] crear:', insErr.message);
        if (active) setProfileState(def);
      }
    })();
    return () => { active = false; };
  }, [user]);

  // Cada vez que se otorga XP, refrescamos el estado visible
  useEffect(() => {
    const unsub = gameEvents.subscribe(() => reload());
    return unsub;
  }, [reload]);

  // Al cambiar de usuario (login/logout): limpiar el cache de gamificación y
  // recargar desde SU fila en la nube. Si está logueado, corre la racha diaria.
  useEffect(() => {
    resetGameCache();
    if (user?.id) {
      onAppOpen().then(() => reload());
    } else {
      reload();
    }
  }, [user?.id]);

  const setProfile = useCallback(async (p: PlayerProfile) => {
    setProfileState(p);
    if (user) {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        username: p.username,
        avatar_color: p.avatarColor,
        updated_at: new Date().toISOString(),
      });
      if (error) console.warn('[Dayxo profiles] guardar:', error.message);
    }
  }, [user]);

  const level = useMemo(() => getUserLevel(xpTotal), [xpTotal]);

  const value = useMemo(
    () => ({ xpTotal, level, badges, records, profile, xpDaily, setProfile, reload }),
    [xpTotal, level, badges, records, profile, xpDaily, setProfile, reload]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGame = () => useContext(GameContext);
