import React, { useMemo, useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { Familia, Todo } from '../../types';
import { EmptyState } from '../shared/EmptyState';
import { HistoryFilter, filterByRange, groupTodosByCompletedDate } from '../../utils/todoHistoryUtils';

interface Props {
  visible: boolean;
  onClose: () => void;
  todos: Todo[];
  getFamilia: (id: string) => Familia;
  onUndo: (id: string) => Promise<void> | void; // vuelve la tarea a pendientes
}

const FILTERS: { key: HistoryFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
];

// Historial: registro de las tareas completadas, agrupadas por día de completado.
// Las completadas ya no aparecen en la lista activa; viven acá y se pueden deshacer.
export function TodoHistoryModal({ visible, onClose, todos, getFamilia, onUndo }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [range, setRange] = useState<HistoryFilter>('all');

  const completed = useMemo(() => todos.filter((t) => t.done), [todos]);
  const groups = useMemo(
    () => groupTodosByCompletedDate(filterByRange(completed, range)),
    [completed, range]
  );
  const total = completed.length;

  const handleUndo = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await onUndo(id);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>

        <View style={styles.header}>
          <View style={styles.titleWrap}>
            <View style={styles.iconWrap}>
              <Ionicons name="time-outline" size={20} color={Dayxo.purple} />
            </View>
            <View>
              <Text style={styles.title}>Historial de pendientes</Text>
              <Text style={styles.sub}>
                {total} {total === 1 ? 'tarea completada' : 'tareas completadas'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = range === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setRange(f.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {groups.length === 0 ? (
          <EmptyState
            icon="checkmark-done-outline"
            text={range === 'all' ? 'Todavía no completaste tareas' : 'Sin tareas completadas en este rango'}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {groups.map((g) => (
              <View key={g.key} style={styles.group}>
                <Text style={styles.groupLabel}>{g.label.toUpperCase()}</Text>
                {g.todos.map((t) => (
                  <HistoryItem
                    key={t.id}
                    todo={t}
                    fam={getFamilia(t.tag)}
                    colors={colors}
                    styles={styles}
                    onUndo={() => handleUndo(t.id)}
                  />
                ))}
              </View>
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

type Styles = ReturnType<typeof createStyles>;

interface ItemProps {
  todo: Todo;
  fam: Familia;
  colors: AppColors;
  styles: Styles;
  onUndo: () => void;
}

function HistoryItem({ todo, fam, colors, styles, onUndo }: ItemProps) {
  const pal = colors.familia[fam.color];
  return (
    <View style={styles.item}>
      <View style={styles.checkDone}>
        <Ionicons name="checkmark" size={13} color="#fff" />
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.itemText} numberOfLines={2}>{todo.text}</Text>
        <View style={[styles.tag, { backgroundColor: pal.bg }]}>
          <Text style={[styles.tagText, { color: pal.fg }]}>{fam.nombre}</Text>
        </View>
      </View>
      {todo.completedAt && (
        <Text style={styles.time}>{format(new Date(todo.completedAt), 'HH:mm')}</Text>
      )}
      <TouchableOpacity onPress={onUndo} style={styles.undoBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="arrow-undo-outline" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6, backgroundColor: colors.card },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.violetLight, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2 },

  filterRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  filterChip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: colors.grayVeryLight,
  },
  filterChipActive: { backgroundColor: Dayxo.purple },
  filterText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },
  filterTextActive: { color: '#fff' },

  body: { padding: 14 },
  group: { marginBottom: 18 },
  groupLabel: {
    fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary,
    letterSpacing: 0.5, marginBottom: 8, marginLeft: 2,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  checkDone: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: Dayxo.green, alignItems: 'center', justifyContent: 'center',
  },
  itemBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemText: {
    flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular',
    color: colors.textSecondary, textDecorationLine: 'line-through',
  },
  tag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  time: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },
  undoBtn: { padding: 4 },
});
