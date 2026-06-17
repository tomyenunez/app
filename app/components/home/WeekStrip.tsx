import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { weekDays, formatShortDay, isSameDay } from '../../utils/dateUtils';

interface Props {
  hasEventOnDay?: (date: Date) => boolean;
  onDayPress?: (date: Date) => void;
}

export function WeekStrip({ hasEventOnDay, onDayPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const days = weekDays().slice(0, 5); // lunes a viernes de la semana actual
  const today = new Date();

  return (
    <View style={styles.bubble}>
      {days.map((day, i) => {
        const isToday = isSameDay(day, today);
        const hasEvent = hasEventOnDay?.(day) ?? false;
        return (
          <TouchableOpacity
            key={i}
            style={styles.dayCol}
            activeOpacity={0.6}
            onPress={() => onDayPress?.(day)}
            disabled={!onDayPress}
          >
            <Text style={styles.dayLabel}>{formatShortDay(day)}</Text>
            <View style={[styles.circle, isToday && styles.circleToday]}>
              <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>
                {day.getDate()}
              </Text>
            </View>
            {hasEvent && <View style={[styles.dot, isToday && styles.dotToday]} />}
            {!hasEvent && <View style={styles.dotPlaceholder} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: { alignItems: 'center', gap: 5, flex: 1 },
  dayLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleToday: { backgroundColor: colors.chipDark },
  dayNum: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: colors.textPrimary,
  },
  dayNumToday: {
    color: colors.chipDarkText,
    fontFamily: 'Inter_800ExtraBold',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#C8C4FF',
  },
  dotToday: { backgroundColor: colors.violet },
  dotPlaceholder: { width: 5, height: 5 },
});
