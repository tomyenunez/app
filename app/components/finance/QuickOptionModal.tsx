import React, { useState, useMemo, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors, FAMILIA_COLOR_KEYS } from '../../constants/colors';
import { FamiliaColor } from '../../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  placeholder: string;
  onAdd: (nombre: string, color: FamiliaColor) => void;
}

// Popup chico (centrado, translúcido) para agregar un motivo o forma de pago nuevo.
export function QuickOptionModal({ visible, onClose, title, placeholder, onAdd }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState<FamiliaColor>('violeta');

  useEffect(() => {
    if (visible) { setNombre(''); setColor('violeta'); }
  }, [visible]);

  const handleAdd = () => {
    if (!nombre.trim()) return;
    onAdd(nombre.trim(), color);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            value={nombre}
            onChangeText={setNombre}
            autoFocus
          />
          <Text style={styles.label}>COLOR</Text>
          <View style={styles.swatchRow}>
            {FAMILIA_COLOR_KEYS.map((key) => {
              const pal = colors.familia[key];
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setColor(key)}
                  style={[styles.swatch, { backgroundColor: pal.fg }, color === key && styles.swatchSel]}
                >
                  {color === key && <Ionicons name="checkmark" size={15} color="#fff" />}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity onPress={handleAdd} style={[styles.addBtn, !nombre.trim() && { opacity: 0.5 }]} disabled={!nombre.trim()}>
            <Text style={styles.addBtnText}>Agregar</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 28 },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  input: {
    backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.border,
  },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5, marginTop: 14, marginBottom: 8 },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  swatchSel: { borderWidth: 3, borderColor: colors.textPrimary },
  addBtn: { backgroundColor: colors.violet, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 18 },
  addBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
