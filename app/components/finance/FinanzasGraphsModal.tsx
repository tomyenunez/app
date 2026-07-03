import React, { useMemo } from 'react';
import { Modal, View, StyleSheet, ScrollView } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { ModalHeader } from '../shared/ModalHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { Transaction, OpcionGasto } from '../../types';
import { DonutChart } from '../stats/DonutChart';
import { formatARS, formatPercent } from '../../utils/formatters';
import { formatMonth } from '../../utils/dateUtils';

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

// Gráficos del mes, estética Dayxo: hero con gradiente (el número que importa
// bien grande) + tarjetas con donut y desglose con barras de proporción.
export function FinanzasGraphsModal({ visible, onClose, txs, categorias, metodos }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const gastoTxs = useMemo(() => txs.filter((t) => t.tipo === 'gasto'), [txs]);
  const ingresoTotal = useMemo(() => txs.filter((t) => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0), [txs]);
  const gastoTotal = useMemo(() => gastoTxs.reduce((s, t) => s + t.monto, 0), [gastoTxs]);
  const disponible = ingresoTotal - gastoTotal;

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

  // Desglose con barra de proporción: más visual que la leyenda con puntitos
  const renderBreakdown = (entries: Entry[], total: number) => (
    <View style={styles.breakdown}>
      {entries.map((e) => {
        const pct = total > 0 ? (e.monto / total) * 100 : 0;
        return (
          <View key={e.id} style={styles.bkItem}>
            <View style={styles.bkTop}>
              <View style={[styles.bkChip, { backgroundColor: e.color + '22' }]}>
                <View style={[styles.bkDot, { backgroundColor: e.color }]} />
                <Text style={[styles.bkName, { color: e.color }]} numberOfLines={1}>{e.nombre}</Text>
              </View>
              <Text style={styles.bkValue}>{formatARS(e.monto)}</Text>
              <Text style={styles.bkPct}>{formatPercent(pct)}</Text>
            </View>
            <View style={styles.bkTrack}>
              <View style={[styles.bkFill, { width: `${Math.max(pct, 2)}%`, backgroundColor: e.color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderDonutSection = (emoji: string, title: string, entries: Entry[], total: number) => (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionEmoji}>{emoji}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.donutWrap}>
        <DonutChart
          data={entries.map((e) => ({ value: e.monto, color: e.color, label: e.nombre }))}
          centerLabel={total > 0 ? formatARS(total) : undefined}
          centerSub={total > 0 ? 'gastado' : undefined}
        />
      </View>
      {entries.length === 0 ? (
        <Text style={styles.empty}>Registrá gastos para ver el detalle 📊</Text>
      ) : (
        renderBreakdown(entries, total)
      )}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>
        <ModalHeader title="Gráficos" subtitle={formatMonth(new Date())} onClose={onClose} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Hero: el número del mes, bien Dayxo */}
          <LinearGradient
            colors={[Dayxo.blue, Dayxo.purple]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Text style={styles.heroLabel}>DISPONIBLE DE {formatMonth(new Date()).toUpperCase()}</Text>
            <Text style={styles.heroValue}>{formatARS(disponible)}</Text>
            <View style={styles.heroRow}>
              <View style={styles.heroPill}>
                <Ionicons name="arrow-down-circle" size={15} color="#B8F5D0" />
                <Text style={styles.heroPillText}>{formatARS(ingresoTotal)}</Text>
              </View>
              <View style={styles.heroPill}>
                <Ionicons name="arrow-up-circle" size={15} color="#FFC4DE" />
                <Text style={styles.heroPillText}>{formatARS(gastoTotal)}</Text>
              </View>
            </View>
          </LinearGradient>

          {renderDonutSection('💳', 'Por forma de pago', porMetodo, gastoTotal)}
          {renderDonutSection('🏷️', 'Por motivo', porCategoria, gastoTotal)}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },

  hero: {
    marginHorizontal: 14, marginTop: 8, borderRadius: 20,
    paddingVertical: 22, paddingHorizontal: 18, alignItems: 'center',
  },
  heroLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.8)', letterSpacing: 1 },
  heroValue: { fontSize: 34, fontFamily: 'Inter_800ExtraBold', color: '#fff', marginTop: 6 },
  heroRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  heroPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 999,
    paddingHorizontal: 13, paddingVertical: 7,
  },
  heroPillText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },

  section: {
    backgroundColor: colors.card, marginHorizontal: 14, marginTop: 14,
    borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionEmoji: { fontSize: 18 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  donutWrap: { alignItems: 'center', marginBottom: 10 },
  empty: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, textAlign: 'center', marginTop: 4, paddingBottom: 6 },

  breakdown: { gap: 12, marginTop: 4 },
  bkItem: { gap: 6 },
  bkTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bkChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
    maxWidth: '50%',
  },
  bkDot: { width: 7, height: 7, borderRadius: 4 },
  bkName: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  bkValue: { flex: 1, fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.textPrimary, textAlign: 'right' },
  bkPct: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary, width: 44, textAlign: 'right' },
  bkTrack: { height: 6, borderRadius: 3, backgroundColor: colors.grayVeryLight, overflow: 'hidden' },
  bkFill: { height: 6, borderRadius: 3 },
});
