import React, { useState, useMemo, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { ModalHeader } from '../shared/ModalHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { SharedGroup, SharedExpense } from '../../types';
import { DateField } from '../shared/DateField';
import { formatARS, formatMontoInput, parseMontoInput } from '../../utils/formatters';
import { dateKey } from '../../utils/dateUtils';

interface Props {
  visible: boolean;
  group: SharedGroup;
  onClose: () => void;
  onAdd: (expense: Omit<SharedExpense, 'id'>) => void;
}

export function AddSharedExpenseModal({ visible, group, onClose, onAdd }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [desc, setDesc] = useState('');
  const [monto, setMonto] = useState('');
  const [paidBy, setPaidBy] = useState<string>('');
  const [split, setSplit] = useState<string[]>([]);
  const [fecha, setFecha] = useState(new Date());

  const allIds = useMemo(() => group.members.map((m) => m.id), [group.members]);

  useEffect(() => {
    if (!visible) return;
    const you = group.members.find((m) => m.isYou) ?? group.members[0];
    setDesc(''); setMonto(''); setFecha(new Date());
    setPaidBy(you?.id ?? '');
    setSplit(allIds);
  }, [visible, group.id]);

  const value = parseMontoInput(monto);
  const canAdd = value > 0 && !!paidBy && split.length > 0;
  const porCabeza = split.length > 0 ? value / split.length : 0;

  const toggleSplit = (id: string) => {
    setSplit((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleAdd = async () => {
    if (!canAdd) return;
    onAdd({ desc: desc.trim() || 'Gasto', monto: value, paidBy, splitBetween: split, fecha: dateKey(fecha) });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.handleWrap}><View style={styles.handle} /></View>
          <ModalHeader title="Nuevo gasto" subtitle={group.nombre} onClose={onClose} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>DESCRIPCIÓN</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Carne, Bebidas, Nafta..."
              placeholderTextColor={colors.textSecondary}
              value={desc}
              onChangeText={setDesc}
              maxLength={50}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>MONTO</Text>
            <TextInput
              style={styles.input}
              placeholder="$ 0"
              placeholderTextColor={colors.textSecondary}
              value={monto}
              onChangeText={(t) => setMonto(formatMontoInput(t))}
              keyboardType="numeric"
            />

            <Text style={[styles.label, { marginTop: 16 }]}>¿QUIÉN PAGÓ?</Text>
            <View style={styles.chipWrap}>
              {group.members.map((m) => {
                const sel = paidBy === m.id;
                return (
                  <TouchableOpacity key={m.id} style={[styles.chip, sel && { backgroundColor: Dayxo.blue, borderColor: Dayxo.blue }]} onPress={() => setPaidBy(m.id)}>
                    <Text style={[styles.chipTxt, sel && { color: '#fff' }]}>{m.isYou ? 'Vos' : m.nombre}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.splitHead}>
              <Text style={styles.label}>¿ENTRE QUIÉNES SE DIVIDE?</Text>
              <TouchableOpacity onPress={() => setSplit(split.length === allIds.length ? [] : allIds)}>
                <Text style={styles.todos}>{split.length === allIds.length ? 'Ninguno' : 'Todos'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.chipWrap}>
              {group.members.map((m) => {
                const sel = split.includes(m.id);
                return (
                  <TouchableOpacity key={m.id} style={[styles.chip, sel && { backgroundColor: Dayxo.purple, borderColor: Dayxo.purple }]} onPress={() => toggleSplit(m.id)}>
                    <Text style={[styles.chipTxt, sel && { color: '#fff' }]}>{m.isYou ? 'Vos' : m.nombre}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {canAdd && (
              <Text style={styles.perHead}>{formatARS(Math.round(porCabeza))} por persona · {split.length} {split.length === 1 ? 'integrante' : 'integrantes'}</Text>
            )}

            <Text style={[styles.label, { marginTop: 16 }]}>FECHA</Text>
            <DateField value={fecha} onChange={setFecha} accent={colors.blue} />

            <TouchableOpacity onPress={handleAdd} style={[styles.submit, !canAdd && { opacity: 0.5 }]} disabled={!canAdd}>
              <Text style={styles.submitTxt}>Agregar gasto</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.card },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  body: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 8 },
  input: {
    backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card },
  chipTxt: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  splitHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  todos: { fontSize: 12, fontFamily: 'Inter_700Bold', color: Dayxo.purple },
  perHead: { fontSize: 12.5, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary, marginTop: 10 },
  submit: { backgroundColor: Dayxo.blue, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 22 },
  submitTxt: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
