import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { greeting, formatFullDate, capitalizeFirst } from '../utils/dateUtils';
import { formatARS } from '../utils/formatters';
import { ScoreBanner } from '../components/home/ScoreBanner';
import { WeekStrip } from '../components/home/WeekStrip';
import { HomeCard } from '../components/home/HomeCard';
import { StreakChips } from '../components/home/StreakChip';
import { XPBar } from '../components/game/XPBar';
import { TemperatureChip } from '../components/game/TemperatureChip';
import { MissionsSection } from '../components/game/MissionsSection';
import { useGame } from '../context/GameContext';
import { useTodos } from '../hooks/useTodos';
import { useDeudas } from '../hooks/useDeudas';
import { useHabitos } from '../hooks/useHabitos';
import { usePresupuesto } from '../hooks/usePresupuesto';
import { useAgenda } from '../hooks/useAgenda';
import { useStreak } from '../hooks/useStreak';

const USER_NAME = 'Eladio';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'light', label: 'Claro', icon: '☀️' },
  { mode: 'dark', label: 'Oscuro', icon: '🌙' },
  { mode: 'system', label: 'Seguir al sistema', icon: '📱' },
];

export function HomeScreen() {
  const nav = useNavigation<any>();
  const { colors, isDark, themeMode, setThemeMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile } = useGame();
  const { pending, todos } = useTodos();
  const { balance } = useDeudas();
  const { habitos, todayHabits, completadosHoy, bonusHoy } = useHabitos();
  const { saldo } = usePresupuesto();
  const { nextEvento, hasEvents } = useAgenda();
  const streak = useStreak();
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  // Los bonus (hábitos hechos en días que no tocaban) suman extra: puede superar 100%
  const score = useMemo(() => {
    const total = todayHabits.length + todos.length;
    if (total === 0) return bonusHoy > 0 ? 100 : 0;
    const done = completadosHoy + bonusHoy + todos.filter((t) => t.done).length;
    return Math.round((done / total) * 100);
  }, [todayHabits, todos, completadosHoy, bonusHoy]);

  const completed = completadosHoy + bonusHoy + todos.filter((t) => t.done).length;
  const total = todayHabits.length + todos.length;

  const balanceLabel = balance > 0 ? 'a tu favor' : balance < 0 ? 'en contra' : 'sin deudas';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting()}, {USER_NAME}</Text>
            <Text style={styles.date}>{capitalizeFirst(formatFullDate(new Date()))}</Text>
          </View>
          <TouchableOpacity onPress={() => setThemeModalVisible(true)} style={styles.themeBtn}>
            <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => nav.navigate('Profile')} style={[styles.avatar, { backgroundColor: profile.avatarColor }]}>
            <Text style={[styles.avatarText, { color: '#fff' }]}>{profile.username.slice(0, 2).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* XP Bar */}
        <XPBar onPress={() => nav.navigate('Profile')} />

        {/* Week Strip */}
        <WeekStrip hasEventOnDay={hasEvents} />

        {/* Score Banner */}
        <View style={{ marginTop: 14 }}>
          <ScoreBanner score={score} completed={completed} total={total} />
        </View>

        {/* Temperatura del día */}
        <TemperatureChip />

        {/* Streak Chips */}
        <StreakChips
          streak={streak}
          habitosHoy={completadosHoy}
          totalHoy={todayHabits.length}
          bonus={bonusHoy}
        />

        {/* Grid */}
        <View style={styles.grid}>
          <View style={styles.row}>
            <HomeCard
              bg={colors.violetLight}
              iconName="checkmark-circle-outline"
              iconColor={colors.violet}
              title="Pendientes"
              value={pending.length.toString()}
              sub="tareas activas"
              onPress={() => nav.navigate('Todo')}
            />
            <HomeCard
              bg={colors.greenLight}
              iconName="cash-outline"
              iconColor={colors.green}
              title="Entre amigos"
              value={`${balance >= 0 ? '+' : '-'}${formatARS(Math.abs(balance))}`}
              sub={balanceLabel}
              onPress={() => nav.navigate('Deudas')}
            />
          </View>
          <View style={styles.row}>
            <HomeCard
              bg={colors.orangeLight}
              iconName="flame-outline"
              iconColor={colors.orange}
              title="Hábitos"
              value={habitos.length.toString()}
              sub="configurados"
              onPress={() => nav.navigate('Habitos')}
            />
            <HomeCard
              bg={colors.blueLight}
              iconName="wallet-outline"
              iconColor={colors.blue}
              title="Saldo"
              value={formatARS(Math.abs(saldo))}
              sub="acumulado"
              onPress={() => nav.navigate('Plata')}
            />
          </View>
          {/* Wide card */}
          <TouchableOpacity
            style={styles.wideCard}
            activeOpacity={0.85}
            onPress={() => nav.navigate('Agenda')}
          >
            <View style={styles.wideLeft}>
              <View style={styles.wideIconWrap}>
                <Text style={{ fontSize: 18 }}>📅</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.wideLabel}>PRÓXIMO EVENTO</Text>
                <Text style={styles.wideValue} numberOfLines={1}>
                  {nextEvento ? nextEvento.titulo : 'Sin eventos próximos'}
                </Text>
                {nextEvento ? (
                  <Text style={styles.wideSub}>
                    {capitalizeFirst(formatFullDate(new Date(nextEvento.fecha)))}
                    {nextEvento.hora ? ` · ${nextEvento.hora}` : ''}
                  </Text>
                ) : null}
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Misiones */}
        <MissionsSection />

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Selector de tema */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.themeOverlay}
          activeOpacity={1}
          onPress={() => setThemeModalVisible(false)}
        >
          <View style={styles.themeSheet}>
            <Text style={styles.themeTitle}>Apariencia</Text>
            {THEME_OPTIONS.map((opt) => {
              const active = themeMode === opt.mode;
              return (
                <TouchableOpacity
                  key={opt.mode}
                  style={styles.themeOption}
                  onPress={() => {
                    setThemeMode(opt.mode);
                    setThemeModalVisible(false);
                  }}
                >
                  <Text style={styles.themeOptionEmoji}>{opt.icon}</Text>
                  <Text style={styles.themeOptionLabel}>{opt.label}</Text>
                  {active && <Ionicons name="checkmark" size={20} color={colors.violet} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: colors.card,
    gap: 10,
  },
  headerLeft: { flex: 1 },
  greeting: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  date: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  themeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.grayVeryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.violetLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: colors.violet,
  },
  grid: {
    marginHorizontal: 14,
    marginTop: 14,
    gap: 10,
  },
  row: { flexDirection: 'row', gap: 10 },
  wideCard: {
    backgroundColor: colors.pinkLight,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  wideLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  wideIconWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  wideLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  wideValue: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    marginTop: 2,
  },
  wideSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: { fontSize: 22, color: colors.pink, fontFamily: 'Inter_400Regular' },
  themeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  themeSheet: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },
  themeTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  themeOptionEmoji: { fontSize: 18 },
  themeOptionLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: colors.textPrimary,
  },
});
