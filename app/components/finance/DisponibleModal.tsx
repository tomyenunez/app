import React, { useMemo } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { formatARS, formatARSWithSign } from '../../utils/formatters';

interface Props {
  visible: boolean;
  onClose: () => void;
  ingresos: number;
  gastos: number;
  saldo: number;
}

// Muestra cómo se llega al disponible: ingresos − suma de gastos.
export function DisponibleModal({ visible, onClose, ingresos, gastos, saldo }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Disponible</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Ingresos totales</Text>
            <Text style={[styles.rowValue, { color: colors.green }]}>{formatARS(ingresos)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Gastos totales</Text>
            <Text style={[styles.rowValue, { color: colors.pink }]}>− {formatARS(gastos)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.totalLabel}>Disponible</Text>
            <Text style={[styles.totalValue, { color: saldo >= 0 ? colors.blue : colors.pink }]}>
              {formatARSWithSign(saldo)}
            </Text>
          </View>

          <Text style={styles.hint}>Es lo que te queda: ingresos menos todos los gastos.</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 28 },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7 },
  rowLabel: { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  rowValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  totalLabel: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  totalValue: { fontSize: 22, fontFamily: 'Inter_800ExtraBold' },
  hint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 10 },
});
