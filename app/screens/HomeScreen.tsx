import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { greeting, formatFullDate, capitalizeFirst } from '../utils/dateUtils';
import { formatARS } from '../utils/formatters';
import { ScoreBanner } from '../components/home/ScoreBanner';
import { WeekStrip } from '../components/home/WeekStrip';
import { HomeCard } from '../components/home/HomeCard';
import { StreakChips } from '../components/home/StreakChip';
import { useTodos } from '../hooks/useTodos';
import { useDeudas } from '../hooks/useDeudas';
import { useHabitos } from '../hooks/useHabitos';
import { usePresupuesto } from '../hooks/usePresupuesto';
import { useAgenda } from '../hooks/useAgenda';
import { useStreak } from '../hooks/useStreak';

const USER_NAME = 'Eladio';

export function HomeScreen() {
  const nav = useNavigation<any>();
  const { pending, todos } = useTodos();
  const { balance, meDeben, leDebo } = useDeudas();
  const { habitos, todayHabits, completadosHoy } = useHabitos();
  const { saldo } = usePresupuesto();
  const { nextEvento, hasEvents } = useAgenda();
  const streak = useStreak();

  const score = useMemo(() => {
    const total = todayHabits.length + todos.length;
    if (total === 0) return 0;
    const done = completadosHoy + todos.filter((t) => t.done).length;
    return Math.round((done / total) * 100);
  }, [todayHabits, todos, completadosHoy]);

  const completed = completadosHoy + todos.filter((t) => t.done).length;
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
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>EA</Text>
          </View>
        </View>

        {/* Week Strip */}
        <WeekStrip hasEventOnDay={hasEvents} />

        {/* Score Banner */}
        <View style={{ marginTop: 14 }}>
          <ScoreBanner score={score} completed={completed} total={total} />
        </View>

        {/* Streak Chips */}
        <StreakChips
          streak={streak}
          habitosHoy={completadosHoy}
          totalHoy={todayHabits.length}
        />

        {/* Grid */}
        <View style={styles.grid}>
          <View style={styles.row}>
            <HomeCard
              bg={Colors.violetLight}
              iconName="checkmark-circle-outline"
              iconColor={Colors.violet}
              title="Pendientes"
              value={pending.length.toString()}
              sub="tareas activas"
              onPress={() => nav.navigate('Todo')}
            />
            <HomeCard
              bg={Colors.greenLight}
              iconName="cash-outline"
              iconColor={Colors.green}
              title="Entre amigos"
              value={`${balance >= 0 ? '+' : '-'}${formatARS(Math.abs(balance))}`}
              sub={balanceLabel}
              onPress={() => nav.navigate('Deudas')}
            />
          </View>
          <View style={styles.row}>
            <HomeCard
              bg={Colors.orangeLight}
              iconName="flame-outline"
              iconColor={Colors.orange}
              title="Hábitos"
              value={habitos.length.toString()}
              sub="configurados"
              onPress={() => nav.navigate('Habitos')}
            />
            <HomeCard
              bg={Colors.blueLight}
              iconName="wallet-outline"
              iconColor={Colors.blue}
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
                {nextEvento?.hora ? (
                  <Text style={styles.wideSub}>{nextEvento.hora}</Text>
                ) : null}
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: Colors.card,
  },
  headerLeft: { flex: 1 },
  greeting: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  date: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.violetLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.violet,
  },
  grid: {
    marginHorizontal: 14,
    marginTop: 14,
    gap: 10,
  },
  row: { flexDirection: 'row', gap: 10 },
  wideCard: {
    backgroundColor: Colors.pinkLight,
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
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  wideValue: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  wideSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chevron: { fontSize: 22, color: Colors.pink, fontFamily: 'Inter_400Regular' },
});
