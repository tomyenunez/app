import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { weekDays, formatShortDay, isSameDay } from '../../utils/dateUtils';

interface Props {
  hasEventOnDay?: (date: Date) => boolean;
  onDayPress?: (date: Date) => void;
  onColor?: boolean; // cuando vive sobre un fondo de color (degradado): texto claro
}

export function WeekStrip({ hasEventOnDay, onDayPress, onColor }: Props) {
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
            <Text style={[styles.dayLabel, onColor && styles.dayLabelOnColor]}>{formatShortDay(day)}</Text>
            <View style={[styles.circle, isToday && (onColor ? styles.circleTodayOnColor : styles.circleToday)]}>
              <Text style={[
                styles.dayNum,
                onColor && styles.dayNumOnColor,
                isToday && (onColor ? styles.dayNumTodayOnColor : styles.dayNumToday),
              ]}>
                {day.getDate()}
              </Text>
            </View>
            {hasEvent && <View style={[styles.dot, onColor ? styles.dotOnColor : (isToday && styles.dotToday)]} />}
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
  circleToday: { backgroundColor: Dayxo.orange },
  dayNum: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: colors.textPrimary,
  },
  dayNumToday: {
    color: '#fff',
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
  dayLabelOnColor: { color: 'rgba(255,255,255,0.85)' },
  dayNumOnColor: { color: '#fff' },
  circleTodayOnColor: { backgroundColor: '#fff' },
  dayNumTodayOnColor: { color: Dayxo.orange, fontFamily: 'Inter_800ExtraBold' },
  dotOnColor: { backgroundColor: 'rgba(255,255,255,0.85)' },
});
