import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Deuda } from '../../types';
import { DateField } from '../shared/DateField';
import { formatMontoInput, parseMontoInput } from '../../utils/formatters';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (nombre: string, monto: number, tipo: Deuda['tipo'], fecha: Date) => Promise<void> | void;
  editing?: Deuda | null;
  onUpdate?: (id: string, nombre: string, monto: number, tipo: Deuda['tipo'], fecha: Date) => Promise<void> | void;
}

export function AddDeudaModal({ visible, onClose, onAdd, editing, onUpdate }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tipo, setTipo] = useState<Deuda['tipo']>('me-debe');
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date());

  const isEditing = !!editing;

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      const [y, m, d] = editing.fecha.split('-').map(Number);
      setTipo(editing.tipo);
      setNombre(editing.nombre);
      setMonto(formatMontoInput(String(editing.monto)));
      setFecha(new Date(y, (m || 1) - 1, d || 1));
    } else {
      setTipo('me-debe'); setNombre(''); setMonto(''); setFecha(new Date());
    }
  }, [visible, editing]);

  const canAdd = nombre.trim().length > 0 && parseMontoInput(monto) > 0;

  const handleAdd = async () => {
    if (!canAdd) return;
    if (isEditing && onUpdate) {
      await onUpdate(editing!.id, nombre.trim(), parseMontoInput(monto), tipo, fecha);
    } else {
      await onAdd(nombre.trim(), parseMontoInput(monto), tipo, fecha);
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
            <Text style={styles.title}>{isEditing ? 'Editar deuda' : 'Nueva deuda'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.toggle}>
              <TouchableOpacity
                onPress={() => { Keyboard.dismiss(); setTipo('me-debe'); }}
                style={[styles.toggleBtn, tipo === 'me-debe' && { backgroundColor: colors.greenLight }]}
              >
                <Text style={[styles.toggleText, tipo === 'me-debe' && { color: colors.green }]}>Me deben</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { Keyboard.dismiss(); setTipo('le-debo'); }}
                style={[styles.toggleBtn, tipo === 'le-debo' && { backgroundColor: colors.pinkLight }]}
              >
                <Text style={[styles.toggleText, tipo === 'le-debo' && { color: colors.pink }]}>Yo debo</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>NOMBRE</Text>
            <TextInput
              style={styles.input}
              placeholder="¿A quién / quién te debe?"
              placeholderTextColor={colors.textSecondary}
              value={nombre}
              onChangeText={setNombre}
              autoFocus
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

            <Text style={[styles.label, { marginTop: 16 }]}>FECHA</Text>
            <DateField value={fecha} onChange={setFecha} accent={tipo === 'me-debe' ? colors.green : colors.pink} />

            <TouchableOpacity
              onPress={handleAdd}
              style={[styles.submitInline, { backgroundColor: tipo === 'me-debe' ? colors.green : colors.pink }, !canAdd && { opacity: 0.5 }]}
              disabled={!canAdd}
            >
              <Text style={styles.addBtnText}>{isEditing ? 'Guardar cambios' : 'Agregar deuda'}</Text>
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  body: { padding: 16 },
  toggle: { flexDirection: 'row', gap: 8, backgroundColor: colors.grayVeryLight, borderRadius: 10, padding: 4 },
  toggleBtn: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  toggleText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 8 },
  input: {
    backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },
  submitInline: { borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 18 },
  addBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
