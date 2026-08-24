import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Habito } from '../../types';
import { weekDays, isSameDay, isPast } from '../../utils/dateUtils';

const DAY_NAMES = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
export const BONUS_COLOR = '#FF9F43';

interface Props {
  habito: Habito;
  onToggleDay: (date: Date) => void;
  isDoneOnDate: (id: string, date: Date) => boolean;
  streak: number;
  weekStats: { applies: number; done: number; bonus: number };
  embedded?: boolean;
  onTogglePin?: () => void;
  onEdit?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function HabitCard({
  habito, onToggleDay, isDoneOnDate, streak, weekStats, embedded, onTogglePin, onEdit, style,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // ¿Te olvidaste de marcar algo la semana pasada? El pager retrocede una semana
  const [prevWeek, setPrevWeek] = useState(false);
  const weekDaysList = weekDays().map((d) => {
    if (!prevWeek) return d;
    const p = new Date(d);
    p.setDate(p.getDate() - 7);
    return p;
  });
  const pct = weekStats.applies > 0 ? weekStats.done / weekStats.applies : 0;
  const appliesLabels = habito.days.map((d) => DAY_NAMES[d]).join(' · ');

  return (
    <View style={[styles.habitCard, embedded && styles.habitCardEmbedded, habito.pinned && styles.habitCardPinned, style]}>
      {/* Header */}
      <View style={styles.habitHeader}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={onEdit ? 0.6 : 1} onPress={onEdit} disabled={!onEdit}>
          <Text style={styles.habitName}>{habito.name}</Text>
          <Text style={styles.habitDaysLabel}>{appliesLabels}</Text>
        </TouchableOpacity>
        <View style={styles.habitRight}>
          {streak > 0 && (
            <View style={styles.rachaBadge}>
              <Text style={styles.rachaText}>{streak} 🔥</Text>
            </View>
          )}
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>✓ {weekStats.done}/{weekStats.applies}</Text>
          </View>
          {weekStats.bonus > 0 && (
            <View style={styles.bonusBadge}>
              <Text style={styles.bonusText}>★ +{weekStats.bonus}</Text>
            </View>
          )}
          {onTogglePin && (
            <TouchableOpacity onPress={onTogglePin} style={{ padding: 4 }}>
              <Ionicons name={habito.pinned ? 'pin' : 'pin-outline'} size={15} color={habito.pinned ? colors.orange : colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(pct, 1) * 100}%` }]} />
      </View>

      {/* Pager de semana: permite recuperar días olvidados de la semana pasada */}
      <View style={styles.weekNav}>
        <TouchableOpacity
          onPress={() => setPrevWeek(true)}
          disabled={prevWeek}
          hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Ver semana pasada"
        >
          <Ionicons name="chevron-back" size={13} color={prevWeek ? 'transparent' : colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.weekNavLabel}>{prevWeek ? 'SEMANA PASADA' : 'ESTA SEMANA'}</Text>
        <TouchableOpacity
          onPress={() => setPrevWeek(false)}
          disabled={!prevWeek}
          hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Volver a esta semana"
        >
          <Ionicons name="chevron-forward" size={13} color={prevWeek ? colors.textSecondary : 'transparent'} />
        </TouchableOpacity>
      </View>

      {/* Days row */}
      <View style={styles.daysRow}>
        {weekDaysList.map((day, i) => {
          const dayI = (day.getDay() + 6) % 7;
          const applies = habito.days.includes(dayI);
          const isToday = isSameDay(day, new Date());
          const done = isDoneOnDate(habito.id, day);

          const circleStyle: StyleProp<ViewStyle>[] = [styles.dayCircle];
          const textStyle: StyleProp<TextStyle>[] = [styles.dayCircleText];
          // HOY y los días pasados se pueden tocar (¿te olvidaste de marcar? tocá y
          // recuperás el día); el futuro no. Si no aplica, cuenta como bonus.
          const tappable = isToday || isPast(day);
          let content: string = day.getDate().toString();

          if (applies) {
            if (isToday && !done) {
              circleStyle.push(styles.dayTodayPending);
              textStyle.push(styles.dayTodayPendingText);
            } else if (done) {
              circleStyle.push(styles.dayDone);
              textStyle.push(styles.dayDoneText);
              content = '✓';
            } else if (isPast(day)) {
              // día que tocaba y quedó vacío: punteado = "tocá para recuperarlo"
              circleStyle.push(styles.dayMissed);
              textStyle.push(styles.dayMissedText);
            } else {
              circleStyle.push(styles.dayPending);
              textStyle.push(styles.dayPendingText);
            }
          } else {
            if (done) {
              circleStyle.push(styles.dayBonusDone);
              textStyle.push(styles.dayBonusDoneText);
              content = '★';
            } else if (isToday) {
              circleStyle.push(styles.dayBonusPending);
              textStyle.push(styles.dayBonusPendingText);
              content = '+';
            } else {
              circleStyle.push(styles.dayNA);
              textStyle.push(styles.dayNAText);
            }
          }

          return (
            <View key={i} style={styles.dayCol}>
              <TouchableOpacity
                onPress={tappable ? () => onToggleDay(day) : undefined}
                style={circleStyle}
                activeOpacity={tappable ? 0.7 : 1}
                disabled={!tappable}
                accessibilityRole="button"
                accessibilityState={{ disabled: !tappable, checked: done }}
                accessibilityLabel={`${isToday ? 'Hoy' : DAY_NAMES[dayI]} ${day.getDate()}, ${
                  done ? (applies ? 'completado' : 'bonus completado') : applies ? 'pendiente' : 'día no programado'
                }`}
              >
                <Text style={textStyle}>{content}</Text>
              </TouchableOpacity>
              <Text style={styles.dayShortLabel}>{isToday ? 'HOY' : DAY_NAMES[dayI]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  habitCard: {
    backgroundColor: colors.card,
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.orange,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  habitCardEmbedded: { marginHorizontal: 0 },
  habitCardPinned: { borderWidth: 1.5, borderColor: colors.orange },
  habitHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  habitName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  habitDaysLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2 },
  habitRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  // Racha: días marcados consecutivos (número + fueguito)
  rachaBadge: {
    backgroundColor: colors.orange,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rachaText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },
  streakBadge: {
    backgroundColor: colors.orangeLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  streakText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.orange },
  bonusBadge: {
    backgroundColor: colors.yellowLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bonusText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: BONUS_COLOR },
  progressTrack: {
    height: 4,
    backgroundColor: colors.grayLight,
    borderRadius: 2,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressFill: { height: 4, backgroundColor: colors.orange, borderRadius: 2 },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  weekNavLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 4 },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  dayNA: { backgroundColor: colors.grayLight, opacity: 0.4 },
  dayNAText: { color: colors.textSecondary },
  dayTodayPending: {
    backgroundColor: colors.orangeLight,
    borderWidth: 2,
    borderColor: colors.orange,
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  dayTodayPendingText: { color: colors.orange },
  dayDone: { backgroundColor: colors.orange },
  dayDoneText: { color: '#fff', fontFamily: 'Inter_700Bold' },
  dayPending: { borderWidth: 1.5, borderColor: colors.orange, opacity: 0.75 },
  dayPendingText: { color: colors.orange },
  // Día pasado que tocaba y quedó sin marcar: tappable para recuperarlo
  dayMissed: { borderWidth: 1.5, borderColor: colors.orange, borderStyle: 'dashed' },
  dayMissedText: { color: colors.orange },
  // Bonus: hábito hecho un día que no tocaba — dorado
  dayBonusPending: {
    borderWidth: 2,
    borderColor: BONUS_COLOR,
    borderStyle: 'dashed',
    backgroundColor: colors.yellowLight,
  },
  dayBonusPendingText: { color: BONUS_COLOR, fontSize: 16, fontFamily: 'Inter_700Bold' },
  dayBonusDone: { backgroundColor: BONUS_COLOR },
  dayBonusDoneText: { color: '#fff', fontFamily: 'Inter_700Bold' },
  dayShortLabel: { fontSize: 8, fontFamily: 'Inter_500Medium', color: colors.textSecondary, letterSpacing: 0.3 },
});
