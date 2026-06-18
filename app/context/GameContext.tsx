import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserLevel, PersonalRecords, PlayerProfile } from '../types/game';
import { getUserLevel } from '../constants/levels';
import { gameEvents } from '../services/xpService';
import { onAppOpen } from '../services/session';
import {
  getXpTotal, getBadges, getRecords, getProfile, saveProfile, getXpDaily,
} from '../services/storage';

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
  profile: { username: 'Eladio', avatarColor: '#6C5CE7' },
  xpDaily: {},
  setProfile: () => {},
  reload: () => {},
});

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [xpTotal, setXpTotal] = useState(0);
  const [badges, setBadges] = useState<Record<string, string>>({});
  const [records, setRecords] = useState<PersonalRecords>(DEFAULT_RECORDS);
  const [profile, setProfileState] = useState<PlayerProfile>({ username: 'Eladio', avatarColor: '#6C5CE7' });
  const [xpDaily, setXpDaily] = useState<Record<string, number>>({});

  const reload = useCallback(() => {
    Promise.all([getXpTotal(), getBadges(), getRecords(), getProfile(), getXpDaily()]).then(
      ([xp, b, r, p, d]) => {
        setXpTotal(xp);
        setBadges(b);
        setRecords(r);
        setProfileState(p);
        setXpDaily(d);
      }
    );
  }, []);

  useEffect(() => {
    reload();
    // Cada vez que se otorga XP, refrescamos el estado visible
    const unsub = gameEvents.subscribe(() => reload());
    // Racha diaria + penalización por inactividad (una vez por arranque).
    // Otorga XP de racha, que dispara reload vía el evento de arriba.
    onAppOpen().then(() => reload());
    return unsub;
  }, [reload]);

  const setProfile = useCallback((p: PlayerProfile) => {
    setProfileState(p);
    saveProfile(p);
  }, []);

  const level = useMemo(() => getUserLevel(xpTotal), [xpTotal]);

  const value = useMemo(
    () => ({ xpTotal, level, badges, records, profile, xpDaily, setProfile, reload }),
    [xpTotal, level, badges, records, profile, xpDaily, setProfile, reload]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGame = () => useContext(GameContext);
