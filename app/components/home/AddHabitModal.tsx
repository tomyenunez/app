import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Habito } from '../../types';

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, days: number[]) => Promise<void> | void;
  editing?: Habito | null;
  onSave?: (id: string, name: string, days: number[]) => Promise<void> | void;
}

export function AddHabitModal({ visible, onClose, onAdd, editing, onSave }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  // Al abrir: precarga los datos si es edición, o arranca limpio si es nuevo
  useEffect(() => {
    if (visible) {
      setName(editing?.name ?? '');
      setSelectedDays(editing ? [...editing.days] : []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const toggleDay = (d: number) => {
    setSelectedDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const canAdd = name.trim().length > 0 && selectedDays.length > 0;

  const handleSubmit = async () => {
    if (!canAdd) return;
    if (editing && onSave) {
      await onSave(editing.id, name.trim(), [...selectedDays].sort());
    } else {
      await onAdd(name.trim(), [...selectedDays].sort());
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.handleWrap}><View style={styles.handle} /></View>
          <View style={styles.header}>
            <Text style={styles.title}>{editing ? 'Editar hábito' : 'Nuevo hábito'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>NOMBRE DEL HÁBITO</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Leer 30 minutos..."
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <Text style={[styles.label, { marginTop: 16 }]}>DÍAS QUE APLICA</Text>
            <View style={styles.daySelector}>
              {DAY_LABELS.map((labelChar, i) => {
                const active = selectedDays.includes(i);
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => toggleDay(i)}
                    style={[styles.daySelectorBtn, active && styles.daySelectorBtnActive]}
                  >
                    <Text style={[styles.daySelectorText, active && styles.daySelectorTextActive]}>
                      {labelChar}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.addBtn, !canAdd && { opacity: 0.5 }]}
              disabled={!canAdd}
            >
              <Text style={styles.addBtnText}>{editing ? 'Guardar cambios' : 'Agregar hábito'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.card },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  body: { padding: 16 },
  label: {
    fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary,
    letterSpacing: 0.5, marginBottom: 8,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.border,
  },
  daySelector: { flexDirection: 'row', gap: 6 },
  daySelectorBtn: {
    flex: 1, aspectRatio: 1, borderRadius: 8,
    backgroundColor: colors.grayVeryLight,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  daySelectorBtnActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  daySelectorText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },
  daySelectorTextActive: { color: '#fff' },
  footer: {
    padding: 16,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  addBtn: {
    backgroundColor: colors.orange, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
