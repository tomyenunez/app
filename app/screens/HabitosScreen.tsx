import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { AppText as Text } from '../components/shared/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { useHabitos } from '../hooks/useHabitos';
import { EmptyState } from '../components/shared/EmptyState';
import { HabitCard } from '../components/habits/HabitCard';
import { SwipeableRow } from '../components/shared/SwipeableRow';
import { AddHabitModal } from '../components/home/AddHabitModal';
import { Habito } from '../types';

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function HabitosScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { habitos, todayHabits, completadosHoy, bonusHoy, add, update, remove, toggleToday, isDoneToday, isDoneOnDate, weekStats } = useHabitos();
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [editHabit, setEditHabit] = useState<Habito | null>(null);

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
            <SwipeableRow onDelete={() => remove(item.id)} containerStyle={styles.habitSwipe}>
              <HabitCard
                habito={item}
                onToggleToday={() => handleToggleToday(item.id)}
                onRemove={() => remove(item.id)}
                onEdit={() => setEditHabit(item)}
                isDoneToday={isDoneToday(item.id)}
                isDoneOnDate={isDoneOnDate}
                weekStats={weekStats(item)}
                embedded
                style={styles.habitCardNoMargin}
              />
            </SwipeableRow>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />

        <AddHabitModal
          visible={!!editHabit}
          onClose={() => setEditHabit(null)}
          onAdd={add}
          editing={editHabit}
          onSave={update}
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
  habitSwipe: { marginHorizontal: 14, marginBottom: 10 },
  habitCardNoMargin: { marginBottom: 0 },
});
