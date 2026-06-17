import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Habito } from '../../types';
import { HabitCard } from '../habits/HabitCard';
import { AddHabitModal } from './AddHabitModal';

interface Props {
  habitos: Habito[];
  onAdd: (name: string, days: number[]) => Promise<void> | void;
  onUpdate: (id: string, name: string, days: number[]) => Promise<void> | void;
  onRemove: (id: string) => Promise<void> | void;
  onTogglePin: (id: string) => Promise<void> | void;
  onToggleToday: (id: string) => Promise<void> | void;
  isDoneToday: (id: string) => boolean;
  isDoneOnDate: (id: string, date: Date) => boolean;
  weekStats: (habito: Habito) => { applies: number; done: number; bonus: number };
}

export function HabitosSection({
  habitos, onAdd, onUpdate, onRemove, onTogglePin, onToggleToday, isDoneToday, isDoneOnDate, weekStats,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editHabit, setEditHabit] = useState<Habito | null>(null);

  const handleToggleToday = async (id: string) => {
    await onToggleToday(id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Fijados arriba
  const ordered = useMemo(
    () => [...habitos].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
    [habitos]
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleWrap}>
          <Ionicons name="flame-outline" size={18} color={colors.orange} />
          <Text style={styles.sectionTitle}>Hábitos</Text>
        </View>
        <TouchableOpacity style={styles.addPill} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.addPillText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      {habitos.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Sin hábitos — sumá tu primer desafío 🔥</Text>
        </View>
      ) : (
        ordered.map((habito) => (
          <HabitCard
            key={habito.id}
            habito={habito}
            onToggleToday={() => handleToggleToday(habito.id)}
            onRemove={() => onRemove(habito.id)}
            onTogglePin={() => onTogglePin(habito.id)}
            onEdit={() => setEditHabit(habito)}
            isDoneToday={isDoneToday(habito.id)}
            isDoneOnDate={isDoneOnDate}
            weekStats={weekStats(habito)}
            embedded
          />
        ))
      )}

      <AddHabitModal
        visible={modalVisible || !!editHabit}
        onClose={() => { setModalVisible(false); setEditHabit(null); }}
        onAdd={onAdd}
        editing={editHabit}
        onSave={onUpdate}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  section: {
    backgroundColor: colors.orangeLight,
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
    backgroundColor: colors.orange,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  addPillText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  emptyBox: {
    backgroundColor: colors.card, borderRadius: 12,
    paddingVertical: 22, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
  },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary },
});
