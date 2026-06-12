import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
  StyleProp, ViewStyle, TextStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { useHabitos } from '../hooks/useHabitos';
import { EmptyState } from '../components/shared/EmptyState';
import { Habito } from '../types';
import { todayIdx, weekDays, isSameDay } from '../utils/dateUtils';

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAY_NAMES = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

function HabitCard({
  habito,
  onToggleToday,
  onRemove,
  isDoneToday,
  isDoneOnDate,
  weekStats,
}: {
  habito: Habito;
  onToggleToday: () => void;
  onRemove: () => void;
  isDoneToday: boolean;
  isDoneOnDate: (id: string, date: Date) => boolean;
  weekStats: { applies: number; done: number };
}) {
  const todayI = todayIdx();
  const weekDaysList = weekDays();
  const pct = weekStats.applies > 0 ? weekStats.done / weekStats.applies : 0;
  const appliesLabels = habito.days.map((d) => DAY_NAMES[d]).join(' · ');

  return (
    <View style={styles.habitCard}>
      {/* Header */}
      <View style={styles.habitHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.habitName}>{habito.name}</Text>
          <Text style={styles.habitDaysLabel}>{appliesLabels}</Text>
        </View>
        <View style={styles.habitRight}>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {weekStats.done}/{weekStats.applies}</Text>
          </View>
          <TouchableOpacity onPress={onRemove} style={{ padding: 4 }}>
            <Ionicons name="close" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
      </View>

      {/* Days row */}
      <View style={styles.daysRow}>
        {weekDaysList.map((day, i) => {
          const dayI = (day.getDay() + 6) % 7;
          const applies = habito.days.includes(dayI);
          const isToday = isSameDay(day, new Date());
          const isPast = day < new Date() && !isToday;
          const isFuture = day > new Date() && !isToday;
          const done = isToday ? isDoneToday : isDoneOnDate(habito.id, day);

          const circleStyle: StyleProp<ViewStyle>[] = [styles.dayCircle];
          const textStyle: StyleProp<TextStyle>[] = [styles.dayCircleText];
          let tappable = false;

          if (!applies) {
            circleStyle.push(styles.dayNA);
            textStyle.push(styles.dayNAText);
          } else if (isToday && !done) {
            circleStyle.push(styles.dayTodayPending);
            textStyle.push(styles.dayTodayPendingText);
            tappable = true;
          } else if (isToday && done) {
            circleStyle.push(styles.dayDone);
            textStyle.push(styles.dayDoneText);
            tappable = true;
          } else if (isPast && done) {
            circleStyle.push(styles.dayDone);
            textStyle.push(styles.dayDoneText);
          } else if (isPast && !done) {
            circleStyle.push(styles.dayPastMissed);
            textStyle.push(styles.dayPastMissedText);
          } else if (isFuture && applies) {
            circleStyle.push(styles.dayFuture);
            textStyle.push(styles.dayFutureText);
          }

          return (
            <View key={i} style={styles.dayCol}>
              <TouchableOpacity
                onPress={tappable ? onToggleToday : undefined}
                style={circleStyle}
                activeOpacity={tappable ? 0.7 : 1}
                disabled={!tappable}
              >
                {done && applies ? (
                  <Text style={textStyle}>✓</Text>
                ) : (
                  <Text style={textStyle}>{day.getDate()}</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.dayShortLabel}>{isToday ? 'HOY' : DAY_NAMES[dayI]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function HabitosScreen() {
  const { habitos, todayHabits, completadosHoy, add, remove, toggleToday, isDoneToday, isDoneOnDate, weekStats } = useHabitos();
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const toggleDay = (d: number) => {
    setSelectedDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const handleAdd = async () => {
    if (!name.trim() || selectedDays.length === 0) return;
    await add(name.trim(), [...selectedDays].sort());
    setName('');
    setSelectedDays([]);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleToggleToday = async (id: string) => {
    await toggleToday(id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="flame-outline" size={22} color={Colors.orange} />
          </View>
          <View>
            <Text style={styles.title}>Hábitos</Text>
            <Text style={styles.sub}>
              {habitos.length === 0
                ? 'Agregá tu primer hábito abajo'
                : todayHabits.length === 0
                ? 'Sin hábitos para hoy'
                : `${completadosHoy}/${todayHabits.length} completados hoy`}
            </Text>
          </View>
        </View>

        <FlatList
          data={habitos}
          keyExtractor={(h) => h.id}
          ListHeaderComponent={
            /* Add form */
            <View style={styles.form}>
              <Text style={styles.formLabel}>NOMBRE DEL HÁBITO</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Leer 30 minutos..."
                placeholderTextColor={Colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
              <Text style={[styles.formLabel, { marginTop: 12 }]}>DÍAS QUE APLICA</Text>
              <View style={styles.daySelector}>
                {DAY_LABELS.map((label, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => toggleDay(i)}
                    style={[styles.daySelectorBtn, selectedDays.includes(i) && styles.daySelectorBtnActive]}
                  >
                    <Text style={[styles.daySelectorText, selectedDays.includes(i) && styles.daySelectorTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                onPress={handleAdd}
                style={[styles.addBtn, (!name.trim() || selectedDays.length === 0) && styles.addBtnDisabled]}
              >
                <Text style={styles.addBtnText}>Agregar hábito</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <EmptyState icon="flame-outline" text="Agregá tu primer hábito arriba" />
          }
          renderItem={({ item }) => (
            <HabitCard
              habito={item}
              onToggleToday={() => handleToggleToday(item.id)}
              onRemove={() => remove(item.id)}
              isDoneToday={isDoneToday(item.id)}
              isDoneOnDate={isDoneOnDate}
              weekStats={weekStats(item)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.orange },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  form: {
    backgroundColor: Colors.card,
    margin: 14,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  formLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.grayVeryLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  daySelector: { flexDirection: 'row', gap: 6 },
  daySelectorBtn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelectorBtnActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  daySelectorText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  daySelectorTextActive: { color: '#fff' },
  addBtn: {
    backgroundColor: Colors.orange,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  habitCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: Colors.orange,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  habitHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  habitName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  habitDaysLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  habitRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakBadge: {
    backgroundColor: Colors.orangeLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  streakText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.orange },
  progressTrack: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressFill: { height: 4, backgroundColor: Colors.orange, borderRadius: 2 },
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
  dayNA: { backgroundColor: '#F0F0F0', opacity: 0.4 },
  dayNAText: { color: Colors.textSecondary },
  dayTodayPending: {
    backgroundColor: Colors.orangeLight,
    borderWidth: 2,
    borderColor: Colors.orange,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  dayTodayPendingText: { color: Colors.orange },
  dayDone: { backgroundColor: Colors.orange },
  dayDoneText: { color: '#fff', fontFamily: 'Inter_700Bold' },
  dayPastMissed: { borderWidth: 1.5, borderColor: Colors.orange, opacity: 0.75 },
  dayPastMissedText: { color: Colors.orange },
  dayFuture: { borderWidth: 1.5, borderColor: Colors.orange, opacity: 0.75 },
  dayFutureText: { color: Colors.orange },
  dayShortLabel: { fontSize: 8, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, letterSpacing: 0.3 },
});
