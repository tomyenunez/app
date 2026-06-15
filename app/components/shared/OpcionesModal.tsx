import React, { useState, useMemo } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors, FAMILIA_COLOR_KEYS } from '../../constants/colors';
import { OpcionGasto, FamiliaColor } from '../../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  titulo: string;
  placeholder: string;
  items: OpcionGasto[];
  onAdd: (nombre: string, color: FamiliaColor) => void;
  onUpdate: (id: string, changes: { nombre?: string; color?: FamiliaColor }) => void;
  onRemove: (id: string) => void;
}

export function OpcionesModal({ visible, onClose, titulo, placeholder, items, onAdd, onUpdate, onRemove }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState<FamiliaColor>('violeta');
  const [editingId, setEditingId] = useState<string | null>(null);

  const startEdit = (item: OpcionGasto) => {
    setEditingId(item.id);
    setNombre(item.nombre);
    setColor(item.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNombre('');
    setColor('violeta');
  };

  const handleSave = () => {
    if (!nombre.trim()) return;
    if (editingId) {
      onUpdate(editingId, { nombre: nombre.trim(), color });
    } else {
      onAdd(nombre.trim(), color);
    }
    cancelEdit();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>
        <View style={styles.header}>
          <Text style={styles.title}>{titulo}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <View style={styles.list}>
            {items.map((item) => {
              const pal = colors.familia[item.color];
              const isEditing = editingId === item.id;
              return (
                <View key={item.id} style={[styles.row, isEditing && styles.rowEditing]}>
                  <View style={[styles.colorDot, { backgroundColor: pal.fg }]} />
                  <Text style={styles.rowName}>{item.nombre}</Text>
                  <TouchableOpacity onPress={() => startEdit(item)} style={styles.rowBtn}>
                    <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onRemove(item.id)} style={styles.rowBtn}>
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          <View style={styles.form}>
            <Text style={styles.formLabel}>
              {editingId ? 'EDITAR' : 'AGREGAR NUEVA'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor={colors.textSecondary}
              value={nombre}
              onChangeText={setNombre}
            />
            <Text style={[styles.formLabel, { marginTop: 12 }]}>COLOR</Text>
            <View style={styles.swatchRow}>
              {FAMILIA_COLOR_KEYS.map((key) => {
                const pal = colors.familia[key];
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setColor(key)}
                    style={[
                      styles.swatch,
                      { backgroundColor: pal.fg },
                      color === key && styles.swatchSelected,
                    ]}
                  >
                    {color === key && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, !nombre.trim() && { opacity: 0.5 }]}
              disabled={!nombre.trim()}
            >
              <Text style={styles.saveBtnText}>
                {editingId ? 'Guardar cambios' : 'Agregar'}
              </Text>
            </TouchableOpacity>
            {editingId && (
              <TouchableOpacity onPress={cancelEdit} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancelar edición</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
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
  list: { padding: 14, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.grayVeryLight,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
  },
  rowEditing: { borderWidth: 1.5, borderColor: colors.blue },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  rowName: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  rowBtn: { padding: 6 },
  form: {
    margin: 14, padding: 14,
    backgroundColor: colors.grayVeryLight, borderRadius: 14,
  },
  formLabel: {
    fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary,
    letterSpacing: 0.5, marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.border,
  },
  swatchRow: { flexDirection: 'row', gap: 8 },
  swatch: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  swatchSelected: { borderWidth: 3, borderColor: colors.textPrimary },
  saveBtn: {
    backgroundColor: colors.blue, borderRadius: 10,
    paddingVertical: 13, alignItems: 'center', marginTop: 14,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
});
