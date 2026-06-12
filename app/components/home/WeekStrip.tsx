import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { weekStrip, formatShortDay, isSameDay } from '../../utils/dateUtils';

interface Props {
  hasEventOnDay?: (date: Date) => boolean;
}

export function WeekStrip({ hasEventOnDay }: Props) {
  const days = weekStrip();
  const today = new Date();

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          const hasEvent = hasEventOnDay?.(day) ?? false;
          return (
            <View key={i} style={styles.dayCol}>
              <Text style={styles.dayLabel}>{formatShortDay(day)}</Text>
              <View style={[styles.circle, isToday && styles.circleToday]}>
                <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>
                  {day.getDate()}
                </Text>
              </View>
              {hasEvent && <View style={[styles.dot, isToday && styles.dotToday]} />}
              {!hasEvent && <View style={styles.dotPlaceholder} />}
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.border} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: Colors.card },
  container: { paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
  dayCol: { alignItems: 'center', width: 44, gap: 4 },
  dayLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleToday: { backgroundColor: Colors.textPrimary },
  dayNum: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
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
  dotToday: { backgroundColor: Colors.violet },
  dotPlaceholder: { width: 5, height: 5 },
  border: { height: 1, backgroundColor: Colors.border, marginHorizontal: 14 },
});
