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
import { OpcionGasto, FamiliaColor } from '../../types';
import { DateField } from '../shared/DateField';
import { QuickOptionModal } from './QuickOptionModal';
import { formatMontoInput, parseMontoInput } from '../../utils/formatters';

interface Catalogo {
  items: OpcionGasto[];
  add: (nombre: string, color: FamiliaColor) => Promise<void> | void;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  categorias: Catalogo;
  metodos: Catalogo;
  onAdd: (desc: string, monto: number, categoria: string | undefined, metodo: string | undefined, fecha: Date) => Promise<void> | void;
}

export function AddGastoModal({ visible, onClose, categorias, metodos, onAdd }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [desc, setDesc] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [selCat, setSelCat] = useState<string | null>(null);
  const [selMet, setSelMet] = useState<string | null>(null);
  const [quickAdd, setQuickAdd] = useState<'cat' | 'met' | null>(null);

  useEffect(() => {
    if (visible) {
      setDesc(''); setMonto(''); setFecha(new Date());
      setSelCat(null); setSelMet(null); setQuickAdd(null);
    }
  }, [visible]);

  const canAdd = desc.trim().length > 0 && parseMontoInput(monto) > 0;

  const handleAdd = async () => {
    if (!canAdd) return;
    await onAdd(desc.trim(), parseMontoInput(monto), selCat ?? undefined, selMet ?? undefined, fecha);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const renderChips = (items: OpcionGasto[], sel: string | null, onSel: (id: string | null) => void, onEdit: () => void) => (
    <View style={styles.chipWrap}>
      {items.map((item) => {
        const pal = colors.familia[item.color];
        const active = sel === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSel(active ? null : item.id)}
            style={[styles.chip, { backgroundColor: pal.bg }, active && { borderWidth: 2, borderColor: pal.fg }]}
          >
            <Text style={[styles.chipText, { color: pal.fg }]}>{item.nombre}</Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity onPress={onEdit} style={styles.editChip}>
        <Ionicons name="add" size={14} color={colors.textSecondary} />
        <Text style={styles.editChipText}>Editar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.handleWrap}><View style={styles.handle} /></View>
          <View style={styles.header}>
            <Text style={styles.title}>Nuevo gasto</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>DESCRIPCIÓN</Text>
            <TextInput
              style={styles.input}
              placeholder="¿En qué gastaste?"
              placeholderTextColor={colors.textSecondary}
              value={desc}
              onChangeText={setDesc}
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
            <DateField value={fecha} onChange={setFecha} accent={colors.pink} />

            <Text style={[styles.label, { marginTop: 16 }]}>MOTIVO (OPCIONAL)</Text>
            {renderChips(categorias.items, selCat, setSelCat, () => setQuickAdd('cat'))}

            <Text style={[styles.label, { marginTop: 16 }]}>FORMA DE PAGO (OPCIONAL)</Text>
            {renderChips(metodos.items, selMet, setSelMet, () => setQuickAdd('met'))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleAdd} style={[styles.addBtn, !canAdd && { opacity: 0.5 }]} disabled={!canAdd}>
              <Text style={styles.addBtnText}>Agregar gasto</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <QuickOptionModal
        visible={quickAdd === 'cat'}
        onClose={() => setQuickAdd(null)}
        title="Nuevo motivo"
        placeholder="Ej: Salidas, Super, Gym..."
        onAdd={categorias.add}
      />
      <QuickOptionModal
        visible={quickAdd === 'met'}
        onClose={() => setQuickAdd(null)}
        title="Nueva forma de pago"
        placeholder="Ej: Débito, Crypto, Cuenta DNI..."
        onAdd={metodos.add}
      />
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
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 8 },
  input: {
    backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 2, borderColor: 'transparent' },
  chipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  editChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.borderStrong, borderStyle: 'dashed',
  },
  editChipText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  addBtn: { backgroundColor: colors.pink, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
