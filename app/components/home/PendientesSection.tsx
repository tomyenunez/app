import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Familia, Todo } from '../../types';
import { AddTodoModal } from './AddTodoModal';

interface Props {
  todos: Todo[];
  familias: Familia[];
  getFamilia: (id: string) => Familia;
  onAdd: (text: string, tag: Todo['tag'], fecha?: Date) => Promise<void> | void;
  onUpdate: (id: string, text: string, tag: Todo['tag'], fecha?: Date) => Promise<void> | void;
  onToggle: (id: string) => Promise<void> | void;
  onRemove: (id: string) => Promise<void> | void;
  onTogglePin: (id: string) => Promise<void> | void;
}

export function PendientesSection({ todos, familias, getFamilia, onAdd, onUpdate, onToggle, onRemove, onTogglePin }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTodo, setEditTodo] = useState<Todo | null>(null);

  // Fijados arriba; dentro de cada grupo, pendientes antes que completados
  const ordered = useMemo(
    () => [...todos].sort((a, b) => {
      const pin = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      if (pin !== 0) return pin;
      return (a.done ? 1 : 0) - (b.done ? 1 : 0);
    }),
    [todos]
  );

  const handleToggle = async (id: string) => {
    await onToggle(id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleWrap}>
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.violet} />
          <Text style={styles.sectionTitle}>Pendientes</Text>
        </View>
        <TouchableOpacity style={styles.addPill} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.addPillText}>Agregar</Text>
        </TouchableOpacity>
      </View>

      {ordered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Sin pendientes — agregá el primero ✦</Text>
        </View>
      ) : (
        ordered.map((item) => {
          const fam = getFamilia(item.tag);
          const pal = colors.familia[fam.color];
          return (
            <View key={item.id} style={[styles.item, item.pinned && styles.itemPinned]}>
              <TouchableOpacity
                onPress={() => handleToggle(item.id)}
                style={[styles.checkbox, item.done && styles.checkboxDone]}
              >
                {item.done && <Ionicons name="checkmark" size={14} color="#fff" />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.itemBody} activeOpacity={0.6} onPress={() => setEditTodo(item)}>
                <Text style={[styles.itemText, item.done && styles.itemTextDone]} numberOfLines={2}>
                  {item.text}
                </Text>
                {item.fecha && (
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={11} color={colors.textSecondary} />
                    <Text style={styles.dateText}>{format(new Date(item.fecha), 'd MMM', { locale: es })}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={[styles.tag, { backgroundColor: pal.bg }]}>
                <Text style={[styles.tagText, { color: pal.fg }]}>{fam.nombre}</Text>
              </View>
              <TouchableOpacity onPress={() => onTogglePin(item.id)} style={styles.iconBtn}>
                <Ionicons name={item.pinned ? 'pin' : 'pin-outline'} size={15} color={item.pinned ? colors.violet : colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onRemove(item.id)} style={styles.iconBtn}>
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          );
        })
      )}

      <AddTodoModal
        visible={modalVisible || !!editTodo}
        onClose={() => { setModalVisible(false); setEditTodo(null); }}
        familias={familias}
        onAdd={onAdd}
        editing={editTodo}
        onSave={onUpdate}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  section: {
    backgroundColor: colors.violetLight,
    borderRadius: 20,
    marginTop: 14,
    marginHorizontal: 14,
    padding: 14,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  addPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.violet,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  addPillText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  emptyBox: {
    backgroundColor: colors.card, borderRadius: 12,
    paddingVertical: 22, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
  },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary },
  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 12,
    padding: 12, gap: 8, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  itemPinned: { borderWidth: 1.5, borderColor: colors.violet },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.violet, borderColor: colors.violet },
  itemBody: { flex: 1 },
  itemText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.textPrimary },
  itemTextDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  dateText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  tag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  iconBtn: { padding: 4 },
});
