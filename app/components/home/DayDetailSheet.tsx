import React, { useMemo } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { capitalizeFirst, formatFullDate } from '../../utils/dateUtils';
import { HabitDayStatus, TodoDayStatus, getMotivationalMessage } from '../../utils/dayDetailUtils';

interface Props {
  visible: boolean;
  onClose: () => void;
  score: number;
  habits: HabitDayStatus[];
  todos: TodoDayStatus;
  totalXP: number;
  pendingCount: number;
}

// Bottom sheet "Tu día de hoy": desglose del score — hábitos, tareas, XP del día
// y un mensaje según cómo viene el día. Se abre al tocar el Score del Home.
export function DayDetailSheet({ visible, onClose, score, habits, todos, totalXP, pendingCount }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const aplican = habits.filter((h) => !h.isExtra);
  const hechos = aplican.filter((h) => h.done).length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Tu día de hoy</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Header: fecha + anillo grande */}
          <Text style={styles.date}>{capitalizeFirst(formatFullDate(new Date()))}</Text>
          <View style={styles.ringWrap}>
            <Ring score={score} colors={colors} />
          </View>

          {/* Hábitos */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>HÁBITOS DE HOY</Text>
            <Text style={styles.sectionCount}>{hechos}/{aplican.length}</Text>
          </View>
          {habits.length === 0 ? (
            <Text style={styles.emptyLine}>Hoy no tenés hábitos asignados.</Text>
          ) : (
            habits.map((h) => <HabitRow key={h.id} habit={h} styles={styles} colors={colors} />)
          )}

          {/* Tareas */}
          <View style={[styles.sectionHead, { marginTop: 22 }]}>
            <Text style={styles.sectionTitle}>TAREAS</Text>
            <Text style={styles.sectionCount}>{todos.completadas}/{todos.total}</Text>
          </View>
          <Text style={styles.taskLine}>
            {todos.total === 0
              ? 'No tenés tareas con fecha de hoy.'
              : `Completaste ${todos.completadas} de ${todos.total} ${todos.total === 1 ? 'tarea' : 'tareas'} de hoy`}
          </Text>

          {/* Total XP del día */}
          <View style={styles.xpCard}>
            <View style={styles.xpLabelRow}>
              <Ionicons name="flash" size={16} color={Dayxo.orange} />
              <Text style={styles.xpLabel}>Total ganado hoy</Text>
            </View>
            <Text style={styles.xpValue}>+{totalXP} XP</Text>
          </View>

          {/* Mensaje motivacional */}
          <Text style={styles.message}>{getMotivationalMessage(score, pendingCount)}</Text>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Cerrar</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const RING = 96;
const RING_STROKE = 9;
const RING_R = (RING - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

function Ring({ score, colors }: { score: number; colors: AppColors }) {
  const pct = Math.min(score, 100) / 100;
  return (
    <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING} height={RING}>
        <Circle cx={RING / 2} cy={RING / 2} r={RING_R} stroke={colors.grayLight} strokeWidth={RING_STROKE} fill="none" />
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={RING_R}
          stroke={Dayxo.orange}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeDasharray={RING_C}
          strokeDashoffset={RING_C * (1 - pct)}
          strokeLinecap="round"
          rotation="-90"
          origin={`${RING / 2}, ${RING / 2}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 26, fontFamily: 'Inter_800ExtraBold', color: Dayxo.orange }}>{score}%</Text>
        </View>
      </View>
    </View>
  );
}

type Styles = ReturnType<typeof createStyles>;

function HabitRow({ habit, styles, colors }: { habit: HabitDayStatus; styles: Styles; colors: AppColors }) {
  return (
    <View style={styles.habitRow}>
      <Ionicons
        name={habit.done ? 'checkmark-circle' : 'ellipse-outline'}
        size={20}
        color={habit.done ? Dayxo.green : colors.textTertiary}
      />
      <Text style={[styles.habitName, habit.done && styles.habitNameDone]} numberOfLines={1}>
        {habit.isExtra ? '⭐ ' : ''}{habit.name}
      </Text>
      <Text style={[styles.habitXP, habit.done ? { color: Dayxo.green } : { color: colors.textTertiary }]}>
        +{habit.xp} XP
      </Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.card },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  body: { paddingHorizontal: 18, paddingBottom: 28 },

  date: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary, textAlign: 'center' },
  ringWrap: { alignItems: 'center', marginTop: 14, marginBottom: 10 },

  sectionHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 18, marginBottom: 10,
  },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5 },
  sectionCount: { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  emptyLine: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary },

  habitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  habitName: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  habitNameDone: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  habitXP: { fontSize: 13, fontFamily: 'Inter_700Bold' },

  taskLine: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.textPrimary },

  xpCard: {
    marginTop: 22, borderRadius: 16, padding: 16,
    backgroundColor: Dayxo.orangeSoft,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  xpLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  xpLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#7A3E00' },
  xpValue: { fontSize: 28, fontFamily: 'Inter_800ExtraBold', color: Dayxo.orange },

  message: {
    fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textSecondary,
    textAlign: 'center', marginTop: 18, lineHeight: 19, paddingHorizontal: 10,
  },

  closeBtn: {
    marginTop: 22, borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    backgroundColor: colors.grayVeryLight,
  },
  closeBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
});
