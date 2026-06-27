import React, { useState, useMemo, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { Transaction } from '../../types';
import { DateField } from '../shared/DateField';
import { formatMontoInput, parseMontoInput } from '../../utils/formatters';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (desc: string, monto: number, fecha: Date) => Promise<void> | void;
  editing?: Transaction | null;
  onUpdate?: (id: string, desc: string, monto: number, fecha: Date) => Promise<void> | void;
}

function parseFechaKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function AddIngresoModal({ visible, onClose, onAdd, editing, onUpdate }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [desc, setDesc] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date());

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setDesc(editing.desc);
      setMonto(formatMontoInput(String(editing.monto).replace('.', ',')));
      setFecha(parseFechaKey(editing.fecha));
    } else {
      setDesc(''); setMonto(''); setFecha(new Date());
    }
  }, [visible, editing]);

  const canAdd = parseMontoInput(monto) > 0;

  const handleSubmit = async () => {
    if (!canAdd) return;
    if (editing && onUpdate) {
      await onUpdate(editing.id, desc.trim() || 'Ingreso', parseMontoInput(monto), fecha);
    } else {
      await onAdd(desc.trim() || 'Ingreso', parseMontoInput(monto), fecha);
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
            <View style={styles.headerSide} />
            <View style={styles.titleWrap}>
              <LinearGradient
                colors={[Dayxo.orange, Dayxo.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.titlePill}
              >
                <Text style={styles.title}>{editing ? 'Editar ingreso' : 'Nuevo ingreso'}</Text>
              </LinearGradient>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.headerSide} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>MONTO</Text>
            <TextInput
              style={styles.input}
              placeholder="$ 0"
              placeholderTextColor={colors.textSecondary}
              value={monto}
              onChangeText={(t) => setMonto(formatMontoInput(t))}
              keyboardType="numeric"
              autoFocus
            />

            <Text style={[styles.label, { marginTop: 16 }]}>DESCRIPCIÓN (OPCIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Sueldo, Venta, Regalo..."
              placeholderTextColor={colors.textSecondary}
              value={desc}
              onChangeText={setDesc}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>FECHA</Text>
            <DateField value={fecha} onChange={setFecha} accent={colors.green} />

            <TouchableOpacity onPress={handleSubmit} style={[styles.submitInline, !canAdd && { opacity: 0.5 }]} disabled={!canAdd}>
              <Text style={styles.addBtnText}>{editing ? 'Guardar cambios' : 'Agregar ingreso'}</Text>
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12,
  },
  headerSide: { width: 28, alignItems: 'flex-end', justifyContent: 'center' },
  titleWrap: { flex: 1, alignItems: 'center' },
  titlePill: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 15, overflow: 'hidden' },
  title: { fontSize: 19, fontFamily: 'Inter_800ExtraBold', color: '#fff', textAlign: 'center' },
  body: { padding: 16 },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 8 },
  input: {
    backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },
  submitInline: { backgroundColor: colors.green, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 18 },
  addBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
