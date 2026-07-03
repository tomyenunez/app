import React, { useState, useMemo, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { ModalHeader } from '../shared/ModalHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { formatARS, formatMontoInput, parseMontoInput } from '../../utils/formatters';
import { useTapGuard } from '../../hooks/useTapGuard';

export type AhorroMode = 'depositar' | 'retirar' | 'set';

interface Props {
  visible: boolean;
  mode: AhorroMode;
  balance: number;
  onClose: () => void;
  onConfirm: (monto: number) => void | Promise<void>;
}

const COPY: Record<AhorroMode, { title: string; label: string; btn: string }> = {
  depositar: { title: 'Guardar en ahorros', label: '¿CUÁNTO GUARDÁS?', btn: 'Guardar' },
  retirar: { title: 'Usar de ahorros', label: '¿CUÁNTO USÁS?', btn: 'Usar' },
  set: { title: 'Editar ahorros', label: 'TOTAL AHORRADO', btn: 'Guardar' },
};

export function AddAhorroModal({ visible, mode, balance, onClose, onConfirm }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [monto, setMonto] = useState('');

  // Al abrir: en "editar total" precargo el saldo actual; si no, vacío.
  useEffect(() => {
    if (!visible) return;
    setMonto(mode === 'set' && balance > 0 ? formatMontoInput(String(balance)) : '');
  }, [visible, mode, balance]);

  const value = parseMontoInput(monto);
  // En "usar" no podés retirar más de lo que tenés.
  const canConfirm = value > 0 && (mode !== 'retirar' || value <= balance);

  const handleSubmit = useTapGuard(async () => {
    if (!canConfirm) return;
    await onConfirm(value);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  });

  const copy = COPY[mode];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.handleWrap}><View style={styles.handle} /></View>
          <ModalHeader title={copy.title} subtitle={`Ahorrado: ${formatARS(balance)}`} onClose={onClose} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>{copy.label}</Text>
            <TextInput
              style={styles.input}
              placeholder="$ 0"
              placeholderTextColor={colors.textSecondary}
              value={monto}
              onChangeText={(t) => setMonto(formatMontoInput(t))}
              keyboardType="numeric"
              autoFocus
            />
            {mode === 'retirar' && value > balance && (
              <Text style={styles.warn}>No podés usar más de {formatARS(balance)}.</Text>
            )}

            <TouchableOpacity onPress={handleSubmit} style={[styles.submitInline, !canConfirm && { opacity: 0.5 }]} disabled={!canConfirm}>
              <Text style={styles.addBtnText}>{copy.btn}</Text>
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
  body: { padding: 16 },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 8 },
  input: {
    backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },
  warn: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Dayxo.coral, marginTop: 8 },
  submitInline: { backgroundColor: Dayxo.blue, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 18 },
  addBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
