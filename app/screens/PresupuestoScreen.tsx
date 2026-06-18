import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { Dayxo } from '../constants/dayxo';
import { Transaction } from '../types';
import { usePresupuesto } from '../hooks/usePresupuesto';
import { useDeudas } from '../hooks/useDeudas';
import { useCategoriasGasto, useMetodosPago } from '../hooks/useOpcionesGasto';
import { getFinanceOrder, saveFinanceOrder } from '../services/storage';
import { SideMenu } from '../components/home/SideMenu';
import { AddGastoModal } from '../components/finance/AddGastoModal';
import { AddIngresoModal } from '../components/finance/AddIngresoModal';
import { AddDeudaModal } from '../components/finance/AddDeudaModal';
import { DisponibleModal } from '../components/finance/DisponibleModal';
import { FinanzasGraphsModal } from '../components/finance/FinanzasGraphsModal';
import { formatARS, formatARSWithSign } from '../utils/formatters';

function fmtFecha(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return '';
  return format(new Date(y, m - 1, d), 'd MMM', { locale: es });
}

const DEFAULT_ORDER = ['gastos', 'deudas', 'ingresos'];

export function PresupuestoScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { ingresos, gastos, saldo, ingresosList, gastosList, add, update, remove, resetMes } = usePresupuesto();
  const deudas = useDeudas();
  const categorias = useCategoriasGasto();
  const metodos = useMetodosPago();

  const [menuVisible, setMenuVisible] = useState(false);
  const [graphsVisible, setGraphsVisible] = useState(false);
  const [dispVisible, setDispVisible] = useState(false);
  const [addGasto, setAddGasto] = useState(false);
  const [addIngreso, setAddIngreso] = useState(false);
  const [addDeuda, setAddDeuda] = useState(false);
  const [editGasto, setEditGasto] = useState<Transaction | null>(null);
  const [editIngreso, setEditIngreso] = useState<Transaction | null>(null);

  // Orden de las burbujas (persistido, reordenable arrastrando)
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  useEffect(() => {
    getFinanceOrder().then((o) => {
      const merged = [
        ...o.filter((k) => DEFAULT_ORDER.includes(k)),
        ...DEFAULT_ORDER.filter((k) => !o.includes(k)),
      ];
      setOrder(merged.length === DEFAULT_ORDER.length ? merged : DEFAULT_ORDER);
    });
  }, []);
  const onDragEnd = useCallback(({ data }: { data: string[] }) => {
    setOrder(data);
    saveFinanceOrder(data);
  }, []);

  const txs = useMemo(() => [...ingresosList, ...gastosList], [ingresosList, gastosList]);

  const handleReset = () => {
    Alert.alert(
      'Reiniciar mes',
      'Se borran gastos, ingresos y deudas. Lo que te sobró (Disponible) se conserva. ¿Seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar', style: 'destructive',
          onPress: async () => { await resetMes(); await deudas.clearAll(); },
        },
      ],
    );
  };

  // --- Burbuja: Gastos ---
  const renderGastos = () => (
    <View style={[styles.bubble, styles.bubbleGastos]}>
      <View style={styles.bubbleHead}>
        <Text style={[styles.bubbleTitle, { color: Dayxo.coral }]}>Gastos del mes</Text>
        <View style={styles.headRight}>
          <Text style={styles.bubbleTotal}>{formatARS(gastos)}</Text>
          <Ionicons name="reorder-three" size={20} color={colors.textTertiary} />
        </View>
      </View>

      <TouchableOpacity style={[styles.addBtn, { backgroundColor: Dayxo.coral }]} onPress={() => setAddGasto(true)}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addBtnText}>Agregar gasto</Text>
      </TouchableOpacity>

      {gastosList.length === 0 ? (
        <Text style={styles.emptyText}>Sin gastos todavía</Text>
      ) : (
        gastosList.map((item) => {
          const cat = item.categoria ? categorias.getItem(item.categoria) : null;
          const met = item.metodo ? metodos.getItem(item.metodo) : null;
          return (
            <View key={item.id} style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: Dayxo.coral + '66' }]}>
                <Ionicons name="arrow-up-outline" size={18} color={Dayxo.coral} />
              </View>
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.6} onPress={() => setEditGasto(item)}>
                <Text style={styles.rowDesc}>{item.desc}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaFecha}>{item.fechaStr}</Text>
                  {met && (
                    <View style={[styles.miniBadge, { backgroundColor: colors.familia[met.color].bg }]}>
                      <Text style={[styles.miniBadgeText, { color: colors.familia[met.color].fg }]}>{met.nombre}</Text>
                    </View>
                  )}
                  {cat && (
                    <View style={[styles.miniBadge, { backgroundColor: colors.familia[cat.color].bg }]}>
                      <Text style={[styles.miniBadgeText, { color: colors.familia[cat.color].fg }]}>{cat.nombre}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              <Text style={[styles.rowMonto, { color: Dayxo.coral }]}>− {formatARS(item.monto)}</Text>
              <TouchableOpacity onPress={() => remove(item.id)} style={styles.delBtn}>
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </View>
  );

  // --- Burbuja: Deudas ---
  const renderDeudas = () => (
    <View style={[styles.bubble, styles.bubbleDeudas]}>
      <View style={styles.bubbleHead}>
        <Text style={[styles.bubbleTitle, { color: Dayxo.purple }]}>Deudas</Text>
        <Ionicons name="reorder-three" size={20} color={colors.textTertiary} />
      </View>

      <TouchableOpacity style={[styles.addBtn, { backgroundColor: Dayxo.purple }]} onPress={() => setAddDeuda(true)}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addBtnText}>Agregar deuda</Text>
      </TouchableOpacity>

      <View style={styles.deudaSummary}>
        <View style={styles.deudaCol}>
          <Text style={styles.deudaColLabel}>Me deben</Text>
          <Text style={[styles.deudaColValue, { color: Dayxo.green }]}>{formatARS(deudas.totalMeDeben)}</Text>
        </View>
        <View style={styles.deudaDivider} />
        <View style={styles.deudaCol}>
          <Text style={styles.deudaColLabel}>Debo</Text>
          <Text style={[styles.deudaColValue, { color: Dayxo.coral }]}>{formatARS(deudas.totalLeDebo)}</Text>
        </View>
        <View style={styles.deudaDivider} />
        <View style={styles.deudaCol}>
          <Text style={styles.deudaColLabel}>Balance</Text>
          <Text style={[styles.deudaColValue, { color: deudas.balance >= 0 ? Dayxo.green : Dayxo.coral }]}>
            {formatARSWithSign(deudas.balance)}
          </Text>
        </View>
      </View>

      {deudas.deudas.length === 0 ? (
        <Text style={styles.emptyText}>Sin deudas registradas</Text>
      ) : (
        deudas.deudas.map((d) => {
          const meDebe = d.tipo === 'me-debe';
          const accent = meDebe ? Dayxo.green : Dayxo.coral;
          const accentBg = accent + '66';
          return (
            <View key={d.id} style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: accentBg }]}>
                <Ionicons name={meDebe ? 'arrow-down-outline' : 'arrow-up-outline'} size={18} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowDesc}>{d.nombre}</Text>
                <Text style={styles.metaFecha}>{fmtFecha(d.fecha)}</Text>
              </View>
              <Text style={[styles.rowMonto, { color: accent }]}>
                {meDebe ? '+' : '−'} {formatARS(d.monto)}
              </Text>
              <TouchableOpacity onPress={() => deudas.remove(d.id)} style={styles.delBtn}>
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </View>
  );

  // --- Burbuja: Ingresos ---
  const renderIngresos = () => (
    <View style={[styles.bubble, styles.bubbleIngresos]}>
      <View style={styles.bubbleHead}>
        <Text style={[styles.bubbleTitle, { color: Dayxo.green }]}>Ingresos</Text>
        <Ionicons name="reorder-three" size={20} color={colors.textTertiary} />
      </View>

      <TouchableOpacity style={[styles.addBtn, { backgroundColor: Dayxo.green }]} onPress={() => setAddIngreso(true)}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addBtnText}>Agregar ingreso</Text>
      </TouchableOpacity>

      {ingresosList.length === 0 ? (
        <Text style={styles.emptyText}>Sin ingresos registrados</Text>
      ) : (
        ingresosList.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: Dayxo.green + '66' }]}>
              <Ionicons name="arrow-down-outline" size={18} color={Dayxo.green} />
            </View>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.6} onPress={() => setEditIngreso(item)}>
              <Text style={styles.rowDesc}>{item.desc}</Text>
              <Text style={styles.metaFecha}>{item.fechaStr}</Text>
            </TouchableOpacity>
            <Text style={[styles.rowMonto, { color: Dayxo.green }]}>+ {formatARS(item.monto)}</Text>
            <TouchableOpacity onPress={() => remove(item.id)} style={styles.delBtn}>
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  const renderItem = ({ item, drag, isActive }: RenderItemParams<string>) => {
    const content = item === 'gastos' ? renderGastos() : item === 'deudas' ? renderDeudas() : renderIngresos();
    return (
      <ScaleDecorator>
        <TouchableOpacity activeOpacity={0.9} onLongPress={drag} delayLongPress={220} disabled={isActive}>
          {content}
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  const Header = (
    <>
      {/* Header: menú · título · gráficos */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finanzas</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setGraphsVisible(true)}>
          <Ionicons name="pie-chart-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Top bubbles: Ingresos + Disponible */}
      <View style={styles.topRow}>
        <LinearGradient colors={[Dayxo.orange, Dayxo.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topBubble}>
          <View style={styles.topHead}>
            <Text style={styles.topLabel}>Ingresos</Text>
            <TouchableOpacity style={styles.topIcon} onPress={() => setAddIngreso(true)}>
              <Ionicons name="bar-chart" size={18} color={Dayxo.orange} />
            </TouchableOpacity>
          </View>
          <Text style={styles.topValue}>{formatARS(ingresos)}</Text>
        </LinearGradient>

        <LinearGradient colors={[Dayxo.orange, Dayxo.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topBubble}>
          <View style={styles.topHead}>
            <Text style={styles.topLabel}>Disponible</Text>
            <TouchableOpacity style={styles.topIcon} onPress={() => setDispVisible(true)}>
              <Ionicons name="wallet-outline" size={16} color={Dayxo.purple} />
            </TouchableOpacity>
          </View>
          <Text style={styles.topValue}>{formatARSWithSign(saldo)}</Text>
        </LinearGradient>
      </View>

      <Text style={styles.dragHint}>Mantené apretada una sección para reordenarla</Text>
    </>
  );

  const Footer = (
    <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
      <Ionicons name="refresh" size={15} color={colors.error} />
      <Text style={styles.resetText}>Reiniciar mes</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <DraggableFlatList
        data={order}
        keyExtractor={(k) => k}
        renderItem={renderItem}
        onDragEnd={onDragEnd}
        ListHeaderComponent={Header}
        ListFooterComponent={Footer}
        contentContainerStyle={{ paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Menú lateral (incluye Misiones adentro) */}
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />

      {/* Popups de finanzas */}
      <FinanzasGraphsModal
        visible={graphsVisible}
        onClose={() => setGraphsVisible(false)}
        txs={txs}
        categorias={categorias}
        metodos={metodos}
      />
      <DisponibleModal
        visible={dispVisible}
        onClose={() => setDispVisible(false)}
        ingresos={ingresos}
        gastos={gastos}
        saldo={saldo}
      />
      <AddGastoModal
        visible={addGasto || !!editGasto}
        editing={editGasto}
        onClose={() => { setAddGasto(false); setEditGasto(null); }}
        categorias={categorias}
        metodos={metodos}
        onAdd={(desc, monto, cat, met, fecha) => add(desc, monto, 'gasto', cat, met, fecha)}
        onUpdate={(id, desc, monto, cat, met, fecha) => update(id, desc, monto, cat, met, fecha)}
      />
      <AddIngresoModal
        visible={addIngreso || !!editIngreso}
        editing={editIngreso}
        onClose={() => { setAddIngreso(false); setEditIngreso(null); }}
        onAdd={(desc, monto, fecha) => add(desc, monto, 'ingreso', undefined, undefined, fecha)}
        onUpdate={(id, desc, monto, fecha) => update(id, desc, monto, undefined, undefined, fecha)}
      />
      <AddDeudaModal
        visible={addDeuda}
        onClose={() => setAddDeuda(false)}
        onAdd={(nombre, monto, tipo, fecha) => deudas.add(nombre, monto, tipo, fecha)}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6, gap: 10,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  topRow: { flexDirection: 'row', gap: 10, marginHorizontal: 14, marginTop: 8 },
  topBubble: {
    flex: 1, borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  topHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  topLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.9)' },
  topIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  topValue: { fontSize: 22, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
  dragHint: {
    fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textTertiary,
    textAlign: 'center', marginTop: 14, marginBottom: -6,
  },
  bubble: {
    marginHorizontal: 14, marginTop: 18,
    borderRadius: 18, padding: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 2,
  },
  bubbleGastos: { backgroundColor: colors.pinkLight, borderColor: Dayxo.coral + '40', shadowColor: Dayxo.coral },
  bubbleDeudas: { backgroundColor: colors.violetLight, borderColor: Dayxo.purple + '40', shadowColor: Dayxo.purple },
  bubbleIngresos: { backgroundColor: colors.greenLight, borderColor: Dayxo.green + '40', shadowColor: Dayxo.green },
  bubbleHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bubbleTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  bubbleTotal: { fontSize: 17, fontFamily: 'Inter_800ExtraBold', color: colors.textPrimary },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, textAlign: 'center', paddingVertical: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowDesc: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' },
  metaFecha: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2 },
  miniBadge: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  miniBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  rowMonto: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  delBtn: { padding: 4 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 14, paddingVertical: 13, marginTop: 8, marginBottom: 12,
  },
  addBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  deudaSummary: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 12, paddingVertical: 12, marginBottom: 10,
  },
  deudaCol: { flex: 1, alignItems: 'center' },
  deudaColLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  deudaColValue: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 4 },
  deudaDivider: { width: 1, height: 32, backgroundColor: colors.border },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 20 },
  resetText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.error },
});
