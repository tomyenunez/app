import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
  StyleProp, ViewStyle, TextStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { useHabitos } from '../hooks/useHabitos';
import { EmptyState } from '../components/shared/EmptyState';
import { Habito } from '../types';
import { weekDays, isSameDay } from '../utils/dateUtils';

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAY_NAMES = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const BONUS_COLOR = '#FF9F43';

function HabitCard({
  habito, onToggleToday, onRemove, isDoneToday, isDoneOnDate, weekStats, styles,
}: {
  habito: Habito;
  onToggleToday: () => void;
  onRemove: () => void;
  isDoneToday: boolean;
  isDoneOnDate: (id: string, date: Date) => boolean;
  weekStats: { applies: number; done: number; bonus: number };
  styles: Styles;
}) {
  const { colors } = useTheme();
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
          {weekStats.bonus > 0 && (
            <View style={styles.bonusBadge}>
              <Text style={styles.bonusText}>★ +{weekStats.bonus}</Text>
            </View>
          )}
          <TouchableOpacity onPress={onRemove} style={{ padding: 4 }}>
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(pct, 1) * 100}%` }]} />
      </View>

      {/* Days row */}
      <View style={styles.daysRow}>
        {weekDaysList.map((day, i) => {
          const dayI = (day.getDay() + 6) % 7;
          const applies = habito.days.includes(dayI);
          const isToday = isSameDay(day, new Date());
          const done = isToday ? isDoneToday : isDoneOnDate(habito.id, day);

          const circleStyle: StyleProp<ViewStyle>[] = [styles.dayCircle];
          const textStyle: StyleProp<TextStyle>[] = [styles.dayCircleText];
          // HOY siempre se puede tocar: si no aplica, cuenta como bonus
          const tappable = isToday;
          let content: string = day.getDate().toString();

          if (applies) {
            if (isToday && !done) {
              circleStyle.push(styles.dayTodayPending);
              textStyle.push(styles.dayTodayPendingText);
            } else if (done) {
              circleStyle.push(styles.dayDone);
              textStyle.push(styles.dayDoneText);
              content = '✓';
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
                onPress={tappable ? onToggleToday : undefined}
                style={circleStyle}
                activeOpacity={tappable ? 0.7 : 1}
                disabled={!tappable}
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

export function HabitosScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { habitos, todayHabits, completadosHoy, bonusHoy, add, remove, toggleToday, isDoneToday, isDoneOnDate, weekStats } = useHabitos();
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

  const subtitle = habitos.length === 0
    ? 'Agregá tu primer hábito abajo'
    : todayHabits.length === 0 && bonusHoy === 0
    ? 'Sin hábitos para hoy — podés sumar bonus ★'
    : `${completadosHoy}/${todayHabits.length} completados hoy${bonusHoy > 0 ? ` · ★ +${bonusHoy} bonus` : ''}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="flame-outline" size={22} color={colors.orange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Hábitos</Text>
            <Text style={styles.sub}>{subtitle}</Text>
          </View>
        </View>

        <FlatList
          data={habitos}
          keyExtractor={(h) => h.id}
          ListHeaderComponent={
            <View style={styles.form}>
              <Text style={styles.formLabel}>NOMBRE DEL HÁBITO</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Leer 30 minutos..."
                placeholderTextColor={colors.textSecondary}
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
              styles={styles}
            />
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.orange },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2 },
  form: {
    backgroundColor: colors.card,
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
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  daySelector: { flexDirection: 'row', gap: 6 },
  daySelectorBtn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: colors.grayVeryLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelectorBtnActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  daySelectorText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },
  daySelectorTextActive: { color: '#fff' },
  addBtn: {
    backgroundColor: colors.orange,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
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
  habitHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  habitName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  habitDaysLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2 },
  habitRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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

type Styles = ReturnType<typeof createStyles>;
