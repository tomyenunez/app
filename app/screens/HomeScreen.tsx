import React, { useMemo, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { AppText as Text } from '../components/shared/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTabBar } from '../context/TabBarContext';
import { AppColors } from '../constants/colors';
import { Dayxo } from '../constants/dayxo';
import { formatMonth, isSameDay } from '../utils/dateUtils';
import { ScoreBanner } from '../components/home/ScoreBanner';
import { WeekStrip } from '../components/home/WeekStrip';
import { PendientesSection } from '../components/home/PendientesSection';
import { HabitosSection } from '../components/home/HabitosSection';
import { QuickNotesCard } from '../components/home/QuickNotesCard';
import { SideMenu } from '../components/home/SideMenu';
import { DayDetailSheet } from '../components/home/DayDetailSheet';
import { CalendarModal } from '../components/agenda/CalendarModal';
import { getHabitsStatusToday, getTodosStatusToday, getTotalXPToday } from '../utils/dayDetailUtils';
import { useGame } from '../context/GameContext';
import { useTodos } from '../hooks/useTodos';
import { useFamilias } from '../hooks/useFamilias';
import { useHabitos } from '../hooks/useHabitos';
import { useAgenda } from '../hooks/useAgenda';
import { useNotas } from '../hooks/useNotas';
import { useStreak } from '../hooks/useStreak';

export function HomeScreen() {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { handleScroll } = useTabBar();
  const { profile } = useGame();
  const { todos, add: addTodo, update: updateTodo, toggle: toggleTodo, remove: removeTodo, togglePin: togglePinTodo } = useTodos();
  const { familias, getFamilia } = useFamilias();
  const {
    habitos, habitDone, todayHabits, completadosHoy,
    add: addHabito, update: updateHabito, remove: removeHabito, togglePin: togglePinHabito, toggleToday,
    isDoneToday, isDoneOnDate, weekStats,
  } = useHabitos();
  const { hasEvents, eventosForDay, add: addEvento, remove: removeEvento } = useAgenda();
  const { notas, draft: notaDraft, setDraft: setNotaDraft, saveDraft: saveNotaDraft, clearDraft: clearNotaDraft, update: updateNota, remove: removeNota, togglePin: togglePinNota } = useNotas();
  const streak = useStreak();
  const [menuVisible, setMenuVisible] = useState(false);
  const [calVisible, setCalVisible] = useState(false);
  const [calDay, setCalDay] = useState<Date | null>(null);
  const [dayDetailVisible, setDayDetailVisible] = useState(false);

  const openCalendar = (day: Date | null) => {
    setCalDay(day);
    setCalVisible(true);
  };

  // Pendientes con fecha asignada para un día puntual (se marcan en el calendario)
  const todosForDay = useCallback((date: Date) =>
    todos.filter((t) => t.fecha && isSameDay(new Date(t.fecha), date)), [todos]);

  // Un día se marca en el calendario si tiene un evento o un pendiente con fecha
  const hasMark = useCallback((date: Date) =>
    hasEvents(date) || todos.some((t) => t.fecha && isSameDay(new Date(t.fecha), date)),
    [hasEvents, todos]);

  // Score del día: hábitos de hoy + pendientes con fecha de hoy
  const todayTodos = useMemo(() =>
    todos.filter((t) => t.fecha && isSameDay(new Date(t.fecha), new Date())), [todos]);
  const totalScore = todayHabits.length + todayTodos.length;
  const doneScore = completadosHoy + todayTodos.filter((t) => t.done).length;
  const score = totalScore === 0 ? 0 : Math.round((doneScore / totalScore) * 100);

  // Desglose para el bottom sheet "Tu día de hoy"
  const habitsStatus = useMemo(() => getHabitsStatusToday(habitos, habitDone), [habitos, habitDone]);
  const todosStatus = useMemo(() => getTodosStatusToday(todos), [todos]);
  const totalXPToday = useMemo(() => getTotalXPToday(habitsStatus, todosStatus), [habitsStatus, todosStatus]);
  const pendingToday = totalScore - doneScore;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" onScroll={handleScroll} scrollEventThrottle={16}>
        {/* Header: menú · título · avatar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inicio</Text>
          <TouchableOpacity
            style={[styles.avatarBtn, { backgroundColor: profile.avatarColor }]}
            onPress={() => nav.navigate('Stats', { editProfile: true })}
          >
            {profile.avatarUrl
              ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatarBtnImg} />
              : <Text style={styles.avatarBtnText}>{profile.username.slice(0, 2).toUpperCase()}</Text>}
          </TouchableOpacity>
        </View>

        {/* Burbuja: avatar + nombre + mes + calendario semanal (hero con degradado) */}
        <LinearGradient
          colors={[Dayxo.orange, Dayxo.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileBubble}
        >
          <View style={styles.profileTop}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={28} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{profile.username}</Text>
              <Text style={styles.profileMonth}>{formatMonth(new Date())}</Text>
            </View>
            <View style={styles.streakChip}>
              <Text style={styles.streakLabel}>Racha</Text>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakNum}>{streak}</Text>
            </View>
          </View>
          <WeekStrip hasEventOnDay={hasMark} onDayPress={openCalendar} onColor />
        </LinearGradient>

        {/* Score Banner */}
        <View style={{ marginTop: 14 }}>
          <ScoreBanner score={score} completed={doneScore} total={totalScore} onPress={() => setDayDetailVisible(true)} />
        </View>

        {/* Notas rápidas (Anotador + historial) */}
        <QuickNotesCard
          notas={notas}
          draft={notaDraft}
          setDraft={setNotaDraft}
          saveDraft={saveNotaDraft}
          clearDraft={clearNotaDraft}
          onUpdate={updateNota}
          onRemove={removeNota}
          onTogglePin={togglePinNota}
        />

        {/* Pendientes */}
        <PendientesSection
          todos={todos}
          familias={familias}
          getFamilia={getFamilia}
          onAdd={addTodo}
          onUpdate={updateTodo}
          onToggle={toggleTodo}
          onRemove={removeTodo}
          onTogglePin={togglePinTodo}
        />

        {/* Hábitos */}
        <HabitosSection
          habitos={habitos}
          onAdd={addHabito}
          onUpdate={updateHabito}
          onRemove={removeHabito}
          onTogglePin={togglePinHabito}
          onToggleToday={toggleToday}
          isDoneToday={isDoneToday}
          isDoneOnDate={isDoneOnDate}
          weekStats={weekStats}
        />

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Detalle del día (al tocar el Score) */}
      <DayDetailSheet
        visible={dayDetailVisible}
        onClose={() => setDayDetailVisible(false)}
        score={score}
        habits={habitsStatus}
        todos={todosStatus}
        totalXP={totalXPToday}
        pendingCount={pendingToday}
      />

      {/* Menú lateral (incluye Misiones adentro) */}
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />

      {/* Calendario (popup) */}
      <CalendarModal
        visible={calVisible}
        onClose={() => setCalVisible(false)}
        initialDay={calDay}
        familias={familias}
        getFamilia={getFamilia}
        onAdd={addEvento}
        onRemove={removeEvento}
        hasEvents={hasMark}
        eventosForDay={eventosForDay}
        todosForDay={todosForDay}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: colors.bg,
    gap: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarBtnImg: { width: 44, height: 44, borderRadius: 22 },
  avatarBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  profileBubble: {
    backgroundColor: colors.card,
    borderRadius: 22,
    marginHorizontal: 14,
    marginTop: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'Inter_800ExtraBold',
    color: '#fff',
  },
  profileMonth: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  streakEmoji: { fontSize: 14 },
  streakLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  streakNum: { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
});

