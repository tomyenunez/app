import { useState, useEffect } from 'react';
import { getStreak, saveStreak, getLastActive, saveLastActive } from '../services/storage';
import { todayKey } from '../utils/dateUtils';

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function useStreak() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    async function update() {
      const [currentStreak, lastActive] = await Promise.all([getStreak(), getLastActive()]);
      const today = todayKey();

      let newStreak = currentStreak;
      if (lastActive === today) {
        // Already updated today, do nothing
        newStreak = currentStreak;
      } else if (lastActive === yesterdayKey()) {
        // Consecutive day
        newStreak = currentStreak + 1;
      } else {
        // Gap or first time
        newStreak = 1;
      }

      setStreak(newStreak);
      await Promise.all([saveStreak(newStreak), saveLastActive(today)]);
    }
    update();
  }, []);

  return streak;
}
