import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { startOfWeek, startOfMonth, subMonths, addMonths, subDays } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { Dayxo } from '../constants/dayxo';
import { useTodos } from '../hooks/useTodos';
import { useHabitos } from '../hooks/useHabitos';
import { usePresupuesto } from '../hooks/usePresupuesto';
import { useCategoriasGasto } from '../hooks/useOpcionesGasto';
import { useStreak } from '../hooks/useStreak';
import { useGame } from '../context/GameContext';
import { BADGES } from '../constants/badges';
import { dateKey, weekDays } from '../utils/dateUtils';
import { formatARS, formatARSWithSign, formatPercent } from '../utils/formatters';
import { DonutChart, DonutSlice } from '../components/stats/DonutChart';
import { BarRow } from '../components/stats/BarRow';
import { ProfileCard } from '../components/profile/ProfileCard';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { ActivityGrid } from '../components/profile/ActivityGrid';
import { useFamilias } from '../hooks/useFamilias';
import {
  habitInsights, taskInsights, financeInsights, evolutionInsights, buildSmartInsights,
} from '../utils/statsInsights';

type Periodo = 'mes-anterior' | 'mes' | 'todo';

// Versión oscura tintada de un color de acento (fondo de card relacionado a su tema)
function darkTint(hex: string): string {
  const h = hex.replace('#', '');
  const f = 0.18;
  const r = Math.round(parseInt(h.slice(0, 2), 16) * f);
  const g = Math.round(parseInt(h.slice(2, 4), 16) * f);
  const b = Math.round(parseInt(h.slice(4, 6), 16) * f);
  return `rgb(${r}, ${g}, ${b})`;
}

export function StatsScreen() {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { todos } = useTodos();
  const { habitos, habitDone } = useHabitos();
  const { txs } = usePresupuesto();
  const categorias = useCategoriasGasto();
  const { getFamilia } = useFamilias();
  const streak = useStreak();
  const { records, badges, xpDaily, level } = useGame();
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [socialVisible, setSocialVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  // El avatar del Home navega acá con { editProfile: true } para abrir el pop-up
  const route = useRoute<any>();
  useFocusEffect(useCallback(() => {
    if (route.params?.editProfile) {
      setEditVisible(true);
      nav.setParams({ editProfile: undefined });
    }
  }, [route.params?.editProfile]));

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  // --- Score semanal: % tareas de la semana + % hábitos de la semana (promedio) ---
  const scoreSemanal = useMemo(() => {
    const weekTodos = todos.filter((t) => {
      const [y, m, d] = t.created.split('-').map(Number);
      return new Date(y, m - 1, d) >= weekStart;
    });
    const todosPct = weekTodos.length > 0
      ? (weekTodos.filter((t) => t.done).length / weekTodos.length) * 100
      : null;

    let applies = 0, done = 0;
    weekDays().forEach((day) => {
      if (day > today) return;
      const idx = (day.getDay() + 6) % 7;
      habitos.forEach((h) => {
        if (h.days.includes(idx)) { applies++; if (habitDone[`${dateKey(day)}-${h.id}`]) done++; }
      });
    });
    const habitsPct = applies > 0 ? (done / applies) * 100 : null;

    const parts = [todosPct, habitsPct].filter((x): x is number => x !== null);
    return parts.length > 0 ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;
  }, [todos, habitos, habitDone]);

  // --- XP de la semana ---
  const weekXP = useMemo(() => {
    let sum = 0;
    Object.entries(xpDaily).forEach(([key, xp]) => {
      const [y, m, d] = key.split('-').map(Number);
      if (new Date(y, m - 1, d) >= weekStart) sum += xp;
    });
    return sum;
  }, [xpDaily]);

  // --- Ahorrado: balance del mes actual vs mes anterior ---
  const ahorro = useMemo(() => {
    const thisStart = startOfMonth(today);
    const lastStart = startOfMonth(subMonths(today, 1));
    const saldoBetween = (start: Date, end: Date) => {
      let ing = 0, gas = 0, has = false;
      txs.forEach((t) => {
        const [y, m, d] = t.fecha.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        if (dt >= start && dt < end) { has = true; if (t.tipo === 'ingreso') ing += t.monto; else gas += t.monto; }
      });
      return { saldo: ing - gas, has };
    };
    const thisM = saldoBetween(thisStart, startOfMonth(addMonths(today, 1)));
    const lastM = saldoBetween(lastStart, thisStart);

    let secondary = 'Sin comparación todavía';
    if (lastM.has && lastM.saldo !== 0) {
      const pct = Math.round(((thisM.saldo - lastM.saldo) / Math.abs(lastM.saldo)) * 100);
      secondary = pct >= 0 ? `${pct}% mejor que el mes anterior` : `Uh! Este mes ${Math.abs(pct)}% abajo`;
    }
    return { value: thisM.saldo, secondary, positive: thisM.saldo >= 0 };
  }, [txs]);

  // --- Cumplimiento de hábitos (30 días) → mejor hábito ---
  const bestHabit = useMemo(() => {
    const stats = habitos.map((h) => {
      let applies = 0, done = 0;
      for (let i = 0; i < 30; i++) {
        const day = subDays(today, i);
        const idx = (day.getDay() + 6) % 7;
        if (h.days.includes(idx)) { applies++; if (habitDone[`${dateKey(day)}-${h.id}`]) done++; }
      }
      return { h, pct: applies > 0 ? Math.round((done / applies) * 100) : 0 };
    });
    return [...stats].sort((a, b) => b.pct - a.pct)[0] ?? null;
  }, [habitos, habitDone]);

  // --- Logros ---
  const logrosCount = Object.keys(badges).length;
  const nextBadge = BADGES.find((b) => !badges[b.id]);

  // --- Puntos extra (bonus) ---
  const bonusStats = useMemo(() => {
    let semana = 0, mes = 0;
    weekDays().forEach((day) => {
      const idx = (day.getDay() + 6) % 7;
      habitos.forEach((h) => {
        if (!h.days.includes(idx) && habitDone[`${dateKey(day)}-${h.id}`]) semana++;
      });
    });
    for (let i = 0; i < 30; i++) {
      const day = subDays(today, i);
      const idx = (day.getDay() + 6) % 7;
      habitos.forEach((h) => {
        if (!h.days.includes(idx) && habitDone[`${dateKey(day)}-${h.id}`]) mes++;
      });
    }
    return { semana, mes };
  }, [habitos, habitDone]);

  // --- Las 6 cards ---
  const cards = [
    { accent: Dayxo.orange, icon: 'flame', value: streak.toString(), label: 'Días de racha', secondary: records.bestStreak > 0 ? `Mejor racha: ${records.bestStreak} días` : 'Aún sin récord' },
    { accent: Dayxo.purple, icon: 'trending-up', value: `${scoreSemanal}%`, label: 'Score semanal', secondary: 'Tareas + hábitos' },
    { accent: Dayxo.yellow, icon: 'trophy', value: logrosCount.toString(), label: 'Logros', secondary: nextBadge ? `Próximo: ${nextBadge.name}` : '¡Todos los logros!' },
    { accent: ahorro.positive ? Dayxo.green : Dayxo.coral, icon: 'wallet', value: formatARSWithSign(ahorro.value), label: 'Ahorrado', secondary: ahorro.secondary },
    { accent: Dayxo.blue, icon: 'repeat', value: habitos.length.toString(), label: 'Hábitos activos', secondary: bestHabit ? `Mejor: ${bestHabit.h.name} · ${bestHabit.pct}%` : 'Sin hábitos todavía' },
    { accent: Dayxo.pink, icon: 'sparkles', value: `+${weekXP} XP`, label: 'XP ganada', secondary: records.bestWeekXP > 0 ? `Récord: ${records.bestWeekXP} XP` : 'Récord: —' },
  ];

  // --- Filtro por período (¿en qué gastás?) ---
  const periodTxs = useMemo(() => {
    if (periodo === 'todo') return txs;
    const start = periodo === 'mes' ? startOfMonth(today) : startOfMonth(subMonths(today, 1));
    const end = periodo === 'mes' ? startOfMonth(addMonths(today, 1)) : startOfMonth(today);
    return txs.filter((t) => {
      const [y, m, d] = t.fecha.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt >= start && dt < end;
    });
  }, [txs, periodo]);

  const gastosPorCategoria = useMemo(() => {
    const map = new Map<string, number>();
    periodTxs.filter((t) => t.tipo === 'gasto').forEach((t) => {
      const id = t.categoria ?? 'sin';
      map.set(id, (map.get(id) ?? 0) + t.monto);
    });
    return [...map.entries()]
      .map(([id, monto]) => {
        const item = categorias.getItem(id === 'sin' ? undefined : id);
        return { id, nombre: item.nombre, monto, color: colors.familia[item.color].fg };
      })
      .filter((e) => e.monto > 0)
      .sort((a, b) => b.monto - a.monto);
  }, [periodTxs, categorias, colors]);

  const totalGastosPeriodo = gastosPorCategoria.reduce((s, e) => s + e.monto, 0);
  const categoriaSlices: DonutSlice[] = gastosPorCategoria.map((e) => ({ value: e.monto, color: e.color, label: e.nombre }));

  // --- Stats nuevas (independientes del selector de período) ---
  const hStats = useMemo(() => habitInsights(habitos, habitDone, today), [habitos, habitDone]);
  const tStats = useMemo(() => taskInsights(todos, getFamilia, today), [todos, getFamilia]);
  const fStats = useMemo(() => financeInsights(txs, categorias.getItem, today), [txs, categorias.getItem]);
  const eStats = useMemo(() => evolutionInsights(todos, habitos, habitDone, xpDaily, txs, today), [todos, habitos, habitDone, xpDaily, txs]);
  const smartInsights = useMemo(
    () => buildSmartInsights({ habit: hStats, task: tStats, finance: fStats, level, streak }),
    [hStats, tStats, fStats, level, streak],
  );

  const maxCatTask = Math.max(1, ...tStats.perCategory.map((c) => c.count));
  const maxFin = Math.max(1, fStats.ingresoMes, fStats.gastoMes);

  const PERIODOS: { key: Periodo; label: string }[] = [
    { key: 'mes-anterior', label: 'Mes anterior' },
    { key: 'mes', label: 'Este mes' },
    { key: 'todo', label: 'Todo' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }}>
        {/* Header: home · título · social */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => nav.navigate('Home')}>
            <Ionicons name="home-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Stats</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setSocialVisible(true)}>
            <Ionicons name="people-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Card de perfil — tap en avatar/nombre abre el pop-up de editar */}
        <ProfileCard onPress={() => setEditVisible(true)} />

        {/* Puntos extra */}
        <View style={styles.bonusBanner}>
          <Text style={styles.bonusStar}>★</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bonusLabel}>PUNTOS EXTRA</Text>
            <Text style={styles.bonusValue}>+{bonusStats.semana} esta semana</Text>
            <Text style={styles.bonusSub}>+{bonusStats.mes} en los últimos 30 días</Text>
          </View>
        </View>

        {/* 6 cards premium */}
        <View style={styles.statsGrid}>
          {cards.map((c, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: darkTint(c.accent), shadowColor: c.accent, borderColor: c.accent + '55' }]}>
              <View style={[styles.statIconWrap, { backgroundColor: c.accent + '22' }]}>
                <Ionicons name={c.icon as any} size={18} color={c.accent} />
              </View>
              <Text style={[styles.statValue, { color: c.accent }]} numberOfLines={1} adjustsFontSizeToFit>{c.value}</Text>
              <Text style={styles.statLabel}>{c.label}</Text>
              <Text style={styles.statSecondary} numberOfLines={1}>{c.secondary}</Text>
            </View>
          ))}
        </View>

        {/* Actividad — heatmap del último mes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad — último mes</Text>
          <Text style={styles.sectionSub}>Cada cuadrado = 1 día. Más intenso = más XP ese día.</Text>
          <ActivityGrid weeks={5} accent={Dayxo.orange} />
        </View>

        {/* Selector de período */}
        <View style={styles.periodRow}>
          {PERIODOS.map((p) => {
            const active = periodo === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                onPress={() => setPeriodo(p.key)}
                style={[styles.periodChip, active && { backgroundColor: Dayxo.purple, borderColor: Dayxo.purple }]}
              >
                <Text style={[styles.periodChipText, active && { color: '#fff' }]}>{p.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Donut: ¿en qué gastás? */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿En qué gastás?</Text>
          <View style={styles.donutWrap}>
            <DonutChart
              data={categoriaSlices}
              centerLabel={totalGastosPeriodo > 0 ? formatARS(totalGastosPeriodo) : undefined}
              centerSub={totalGastosPeriodo > 0 ? 'gastado' : undefined}
            />
          </View>
          {gastosPorCategoria.length === 0 ? (
            <Text style={styles.emptyChart}>Sin gastos en este período</Text>
          ) : (
            <View style={styles.legend}>
              {gastosPorCategoria.map((e) => (
                <View key={e.id} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: e.color }]} />
                  <Text style={styles.legendName} numberOfLines={1}>{e.nombre}</Text>
                  <Text style={styles.legendValue}>
                    {formatARS(e.monto)} ({formatPercent((e.monto / totalGastosPeriodo) * 100)})
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* A) Stats de hábitos */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: Dayxo.habitos + '22' }]}>
              <Ionicons name="barbell" size={16} color={Dayxo.habitos} />
            </View>
            <Text style={styles.sectionTitle}>Tus hábitos</Text>
          </View>
          {habitos.length === 0 ? (
            <Text style={styles.emptyBox}>Todavía no tenés hábitos. Creá uno para empezar a ver tus estadísticas.</Text>
          ) : (
            <>
              <View style={styles.miniRow}>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniValue, { color: Dayxo.habitos }]}>{hStats.activos}</Text>
                  <Text style={styles.miniLabel}>{hStats.activos === 1 ? 'hábito activo' : 'hábitos activos'}</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniValue, { color: Dayxo.habitos }]}>{hStats.weekDone}/{hStats.weekTotal}</Text>
                  <Text style={styles.miniLabel}>completados esta semana</Text>
                </View>
              </View>
              <Text style={styles.subLabel}>Cumplimiento · últimos 30 días</Text>
              <View style={styles.barsBlock}>
                {hStats.perHabit.map((h) => (
                  <BarRow key={h.id} label={h.name} value={`${h.pct}%`} fraction={h.pct / 100} color={Dayxo.habitos} />
                ))}
              </View>
              {(hStats.bestDay || hStats.worstDay) && (
                <View style={styles.chipsRow}>
                  {hStats.bestDay && (
                    <View style={[styles.dayChip, { backgroundColor: Dayxo.green + '18', borderColor: Dayxo.green + '44' }]}>
                      <Ionicons name="trending-up" size={13} color={Dayxo.green} />
                      <Text style={[styles.dayChipText, { color: Dayxo.green }]}>Mejor día: {hStats.bestDay.name}</Text>
                    </View>
                  )}
                  {hStats.worstDay && (
                    <View style={[styles.dayChip, { backgroundColor: Dayxo.coral + '18', borderColor: Dayxo.coral + '44' }]}>
                      <Ionicons name="trending-down" size={13} color={Dayxo.coral} />
                      <Text style={[styles.dayChipText, { color: Dayxo.coral }]}>Más flojo: {hStats.worstDay.name}</Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </View>

        {/* B) Stats de pendientes / tareas */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: Dayxo.purple + '22' }]}>
              <Ionicons name="checkbox" size={16} color={Dayxo.purple} />
            </View>
            <Text style={styles.sectionTitle}>Productividad</Text>
          </View>
          {tStats.totalTodos === 0 ? (
            <Text style={styles.emptyBox}>Todavía no agregaste tareas.</Text>
          ) : (
            <>
              <View style={styles.miniRow}>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniValue, { color: Dayxo.purple }]}>{tStats.weekDone}</Text>
                  <Text style={styles.miniLabel}>completadas esta semana</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniValue, { color: tStats.overdue > 0 ? Dayxo.coral : Dayxo.purple }]}>{tStats.overdue}</Text>
                  <Text style={styles.miniLabel}>{tStats.overdue === 1 ? 'vencida' : 'vencidas'}</Text>
                </View>
              </View>
              <View style={styles.factRow}>
                <Text style={styles.factLabel}>Promedio diario</Text>
                <Text style={styles.factValue}>{tStats.perDay} {tStats.perDay === 1 ? 'tarea' : 'tareas'}/día</Text>
              </View>
              <View style={[styles.factRow, styles.factDivider]}>
                <Text style={styles.factLabel}>Categoría más activa</Text>
                <Text style={styles.factValue}>{tStats.topCategory ?? '—'}</Text>
              </View>
              <Text style={styles.subLabel}>Tareas por categoría</Text>
              <View style={styles.barsBlock}>
                {tStats.perCategory.map((c) => (
                  <BarRow key={c.id} label={c.name} value={`${c.count}`} fraction={c.count / maxCatTask} color={colors.familia[c.colorKey].fg} />
                ))}
              </View>
            </>
          )}
        </View>

        {/* C) Stats financieras */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: Dayxo.blue + '22' }]}>
              <Ionicons name="cash" size={16} color={Dayxo.blue} />
            </View>
            <Text style={styles.sectionTitle}>Resumen financiero</Text>
          </View>
          {!fStats.hasData ? (
            <Text style={styles.emptyBox}>Registrá ingresos y gastos para ver tu resumen del mes.</Text>
          ) : (
            <>
              <View style={styles.miniRow}>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniValue, { color: Dayxo.green }]} numberOfLines={1} adjustsFontSizeToFit>{formatARS(fStats.ingresoMes)}</Text>
                  <Text style={styles.miniLabel}>ingresos del mes</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniValue, { color: Dayxo.coral }]} numberOfLines={1} adjustsFontSizeToFit>{formatARS(fStats.gastoMes)}</Text>
                  <Text style={styles.miniLabel}>gastos del mes</Text>
                </View>
              </View>
              <Text style={styles.subLabel}>Ingresos vs gastos · este mes</Text>
              <View style={styles.barsBlock}>
                <BarRow label="Ingresos" value={formatARS(fStats.ingresoMes)} fraction={fStats.ingresoMes / maxFin} color={Dayxo.green} />
                <BarRow label="Gastos" value={formatARS(fStats.gastoMes)} fraction={fStats.gastoMes / maxFin} color={Dayxo.coral} />
              </View>
              <View style={styles.factRow}>
                <Text style={styles.factLabel}>Disponible actual</Text>
                <Text style={[styles.factValue, { color: fStats.disponible >= 0 ? Dayxo.green : Dayxo.coral }]}>{formatARSWithSign(fStats.disponible)}</Text>
              </View>
              <View style={[styles.factRow, styles.factDivider]}>
                <Text style={styles.factLabel}>Gasto diario promedio</Text>
                <Text style={styles.factValue}>{formatARS(fStats.gastoDiario)}/día</Text>
              </View>
              {fStats.topCategoria && (
                <View style={[styles.factRow, styles.factDivider]}>
                  <Text style={styles.factLabel}>Mayor gasto</Text>
                  <Text style={styles.factValue}>{fStats.topCategoria.name} · {formatARS(fStats.topCategoria.monto)}</Text>
                </View>
              )}
              {fStats.gastoDeltaPct !== null && (
                <View style={[styles.factRow, styles.factDivider]}>
                  <Text style={styles.factLabel}>Gastos vs mes anterior</Text>
                  <Text style={[styles.factValue, { color: fStats.gastoDeltaPct <= 0 ? Dayxo.green : Dayxo.coral }]}>
                    {fStats.gastoDeltaPct >= 0 ? '+' : ''}{fStats.gastoDeltaPct}%
                  </Text>
                </View>
              )}
              {fStats.proyeccion !== null && (
                <View style={[styles.projCard, { backgroundColor: darkTint(Dayxo.blue), borderColor: Dayxo.blue + '44' }]}>
                  <View style={[styles.sectionIcon, { backgroundColor: Dayxo.blue + '22' }]}>
                    <Ionicons name="trending-up" size={16} color={Dayxo.blue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.projValue, { color: fStats.proyeccion >= 0 ? Dayxo.green : Dayxo.coral }]}>{formatARSWithSign(fStats.proyeccion)}</Text>
                    <Text style={styles.projLabel}>A este ritmo terminás el mes con esto disponible</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* D) Stats de evolución */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: Dayxo.green + '22' }]}>
              <Ionicons name="trending-up" size={16} color={Dayxo.green} />
            </View>
            <Text style={styles.sectionTitle}>Tu evolución</Text>
          </View>
          {!eStats.hasData ? (
            <Text style={styles.emptyBox}>Necesitamos un poco más de historial para comparar tu evolución.</Text>
          ) : (
            <>
              {eStats.trend !== 'none' && (
                <View style={[styles.trendBanner, { backgroundColor: (eStats.trend === 'down' ? Dayxo.coral : Dayxo.green) + '18' }]}>
                  <Ionicons
                    name={eStats.trend === 'up' ? 'trending-up' : eStats.trend === 'down' ? 'trending-down' : 'remove'}
                    size={18}
                    color={eStats.trend === 'down' ? Dayxo.coral : Dayxo.green}
                  />
                  <Text style={[styles.trendText, { color: colors.textPrimary }]}>
                    {eStats.trend === 'up'
                      ? 'Tu actividad viene subiendo 📈'
                      : eStats.trend === 'down'
                        ? 'Tu actividad bajó respecto a la semana pasada'
                        : 'Tu actividad se mantiene estable'}
                  </Text>
                </View>
              )}
              {eStats.prodDeltaPct !== null && (
                <View style={styles.factRow}>
                  <Text style={styles.factLabel}>vs semana pasada</Text>
                  <Text style={[styles.factValue, { color: eStats.prodDeltaPct >= 0 ? Dayxo.green : Dayxo.coral }]}>
                    {eStats.prodDeltaPct >= 0 ? `+${eStats.prodDeltaPct}% más productivo` : `${eStats.prodDeltaPct}% menos productivo`}
                  </Text>
                </View>
              )}
              <View style={[styles.factRow, styles.factDivider]}>
                <Text style={styles.factLabel}>vs mes pasado</Text>
                <Text style={styles.factValue}>
                  {eStats.tasksMonthDiff > 0
                    ? `${eStats.tasksMonthDiff} ${eStats.tasksMonthDiff === 1 ? 'tarea' : 'tareas'} más`
                    : eStats.tasksMonthDiff < 0
                      ? `${Math.abs(eStats.tasksMonthDiff)} ${Math.abs(eStats.tasksMonthDiff) === 1 ? 'tarea' : 'tareas'} menos`
                      : 'igual que el mes pasado'}
                </Text>
              </View>
              <Text style={styles.subLabel}>Variaciones · vs semana pasada</Text>
              <View>
                {eStats.variations.map((v, i) => (
                  <View key={v.label} style={[styles.varRow, i > 0 && styles.factDivider]}>
                    <Text style={styles.varLabel}>{v.label}</Text>
                    <View style={styles.varRight}>
                      <Text style={[styles.varValue, { color: v.good ? Dayxo.green : Dayxo.coral }]}>{v.display}</Text>
                      <Ionicons
                        name={v.dir === 'up' ? 'arrow-up' : v.dir === 'down' ? 'arrow-down' : 'remove'}
                        size={15}
                        color={v.good ? Dayxo.green : Dayxo.coral}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* E) Insights inteligentes */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: Dayxo.purple + '22' }]}>
              <Ionicons name="bulb" size={16} color={Dayxo.purple} />
            </View>
            <Text style={styles.sectionTitle}>Insights</Text>
          </View>
          {smartInsights.length === 0 ? (
            <Text style={styles.emptyBox}>Seguí usando Dayxo y acá van a aparecer insights sobre tu semana.</Text>
          ) : (
            smartInsights.map((ins, i) => (
              <View key={i} style={[styles.insightRow, { backgroundColor: ins.accent + '14', borderColor: ins.accent + '33' }]}>
                <View style={[styles.insightIcon, { backgroundColor: ins.accent + '22' }]}>
                  <Ionicons name={ins.icon as any} size={17} color={ins.accent} />
                </View>
                <Text style={styles.insightText}>{ins.text}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Social — próximamente */}
      <Modal visible={socialVisible} transparent animationType="fade" onRequestClose={() => setSocialVisible(false)}>
        <TouchableOpacity style={styles.csOverlay} activeOpacity={1} onPress={() => setSocialVisible(false)}>
          <View style={styles.csCard}>
            <View style={styles.csIcon}>
              <Ionicons name="people" size={30} color={Dayxo.purple} />
            </View>
            <Text style={styles.csTitle}>Social</Text>
            <Text style={styles.csText}>Próximamente 🚀</Text>
            <TouchableOpacity style={styles.csBtn} onPress={() => setSocialVisible(false)}>
              <Text style={styles.csBtnText}>Dale</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Pop-up de perfil: editar nombre/color + rangos */}
      <EditProfileModal visible={editVisible} onClose={() => setEditVisible(false)} />
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6, gap: 10,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },

  // 6 cards premium (dark)
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, margin: 14 },
  statCard: {
    width: '47%',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  statIconWrap: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 22, fontFamily: 'Inter_800ExtraBold' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.72)', marginTop: 3 },
  statSecondary: { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.45)', marginTop: 6 },

  bonusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FF9F43',
    marginHorizontal: 14, marginTop: 18, marginBottom: 4,
    borderRadius: 16, padding: 16,
  },
  bonusStar: { fontSize: 28, color: '#fff' },
  bonusLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#FFE3C4', letterSpacing: 0.8 },
  bonusValue: { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: '#fff', marginTop: 2 },
  bonusSub: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#FFE3C4', marginTop: 2 },

  section: {
    backgroundColor: colors.card,
    marginHorizontal: 14, marginTop: 14,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  sectionSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 3, marginBottom: 16 },

  periodRow: { flexDirection: 'row', gap: 8, marginHorizontal: 14, marginTop: 14 },
  periodChip: {
    flex: 1, borderRadius: 10, paddingVertical: 9, alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
  },
  periodChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },

  donutWrap: { alignItems: 'center', marginTop: 16, marginBottom: 8 },
  emptyChart: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, textAlign: 'center', marginTop: 16 },
  legend: { marginTop: 8, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  legendValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },

  // --- Secciones de stats nuevas (A–E) ---
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

  miniRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  miniStat: { flex: 1, backgroundColor: colors.bg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
  miniValue: { fontSize: 18, fontFamily: 'Inter_800ExtraBold' },
  miniLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginTop: 2 },

  subLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary, marginTop: 14, marginBottom: 10 },
  barsBlock: { gap: 12 },

  factRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, gap: 12 },
  factDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  factLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textSecondary, flexShrink: 1 },
  factValue: { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.textPrimary, textAlign: 'right' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  dayChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1 },
  dayChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  projCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, marginTop: 16, borderWidth: 1 },
  projValue: { fontSize: 18, fontFamily: 'Inter_800ExtraBold' },
  projLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginTop: 2 },

  trendBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 12, marginBottom: 6 },
  trendText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1 },

  varRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9 },
  varLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  varRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  varValue: { fontSize: 14, fontFamily: 'Inter_800ExtraBold' },

  insightRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 8 },
  insightIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  insightText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textPrimary, lineHeight: 18 },

  emptyBox: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, textAlign: 'center', paddingVertical: 10, lineHeight: 19 },

  csOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 40 },
  csCard: { backgroundColor: colors.card, borderRadius: 20, padding: 24, alignItems: 'center' },
  csIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.violetLight, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  csTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  csText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 4 },
  csBtn: { backgroundColor: Dayxo.purple, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28, marginTop: 18 },
  csBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
