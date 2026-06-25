import React, { useMemo } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Transaction, OpcionGasto } from '../../types';
import { DonutChart, DonutSlice } from '../stats/DonutChart';
import { formatARS, formatPercent } from '../../utils/formatters';

interface Catalogo {
  getItem: (id: string | undefined) => OpcionGasto;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  txs: Transaction[];
  categorias: Catalogo;
  metodos: Catalogo;
}

interface Entry { id: string; nombre: string; monto: number; color: string; }

export function FinanzasGraphsModal({ visible, onClose, txs, categorias, metodos }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const gastoTxs = useMemo(() => txs.filter((t) => t.tipo === 'gasto'), [txs]);
  const ingresoTotal = useMemo(() => txs.filter((t) => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0), [txs]);
  const gastoTotal = useMemo(() => gastoTxs.reduce((s, t) => s + t.monto, 0), [gastoTxs]);

  const agrupar = (getId: (t: Transaction) => string | undefined, getItem: Catalogo['getItem']): Entry[] => {
    const map = new Map<string, number>();
    gastoTxs.forEach((t) => {
      const id = getId(t) ?? 'sin';
      map.set(id, (map.get(id) ?? 0) + t.monto);
    });
    return [...map.entries()]
      .map(([id, monto]) => {
        const item = getItem(id === 'sin' ? undefined : id);
        return { id, nombre: item.nombre, monto, color: colors.familia[item.color].fg };
      })
      .filter((e) => e.monto > 0)
      .sort((a, b) => b.monto - a.monto);
  };

  const porMetodo = useMemo(() => agrupar((t) => t.metodo, metodos.getItem), [gastoTxs, metodos, colors]);
  const porCategoria = useMemo(() => agrupar((t) => t.categoria, categorias.getItem), [gastoTxs, categorias, colors]);

  const ivgSlices: DonutSlice[] = [
    { value: ingresoTotal, color: colors.green, label: 'Ingresos' },
    { value: gastoTotal, color: colors.pink, label: 'Gastos' },
  ];

  const renderDonutSection = (title: string, entries: Entry[], total: number) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.donutWrap}>
        <DonutChart
          data={entries.map((e) => ({ value: e.monto, color: e.color, label: e.nombre }))}
          centerLabel={total > 0 ? formatARS(total) : undefined}
          centerSub={total > 0 ? 'gastado' : undefined}
        />
      </View>
      {entries.length === 0 ? (
        <Text style={styles.empty}>Registrá gastos para ver el detalle</Text>
      ) : (
        <View style={styles.legend}>
          {entries.map((e) => (
            <View key={e.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: e.color }]} />
              <Text style={styles.legendName} numberOfLines={1}>{e.nombre}</Text>
              <Text style={styles.legendValue}>
                {formatARS(e.monto)} ({formatPercent((e.monto / total) * 100)})
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>
        <View style={styles.header}>
          <Text style={styles.title}>Gráficos del mes</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32, paddingTop: 6 }}>
          {renderDonutSection('Gastos por forma de pago', porMetodo, gastoTotal)}
          {renderDonutSection('Gastos por motivo', porCategoria, gastoTotal)}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingresos vs Gastos</Text>
            <View style={styles.donutWrap}>
              <DonutChart
                data={ivgSlices}
                centerLabel={(ingresoTotal + gastoTotal) > 0 ? formatARS(ingresoTotal - gastoTotal) : undefined}
                centerSub={(ingresoTotal + gastoTotal) > 0 ? 'disponible' : undefined}
              />
            </View>
            <View style={styles.ivgRow}>
              <View style={styles.ivgCol}>
                <Text style={styles.ivgLabel}>Ingresos</Text>
                <Text style={[styles.ivgValue, { color: colors.green }]}>{formatARS(ingresoTotal)}</Text>
              </View>
              <View style={styles.ivgCol}>
                <Text style={styles.ivgLabel}>Gastos</Text>
                <Text style={[styles.ivgValue, { color: colors.pink }]}>{formatARS(gastoTotal)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  section: {
    backgroundColor: colors.card, marginHorizontal: 14, marginTop: 14,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.textPrimary, marginBottom: 16 },
  donutWrap: { alignItems: 'center', marginBottom: 8 },
  empty: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
  legend: { marginTop: 8, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  legendValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },
  ivgRow: { flexDirection: 'row', marginTop: 8 },
  ivgCol: { flex: 1, alignItems: 'center' },
  ivgLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  ivgValue: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 4 },
});
