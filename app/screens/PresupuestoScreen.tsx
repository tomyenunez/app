import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Modal, ScrollView, FlatList } from 'react-native';
import { AppText as Text } from '../components/shared/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../context/ThemeContext';
import { useTabBar } from '../context/TabBarContext';
import { AppColors } from '../constants/colors';
import { Dayxo } from '../constants/dayxo';
import { Transaction, Deuda } from '../types';
import { usePresupuesto } from '../hooks/usePresupuesto';
import { useDeudas } from '../hooks/useDeudas';
import { useAhorros } from '../hooks/useAhorros';
import { useCategoriasGasto, useMetodosPago } from '../hooks/useOpcionesGasto';
import { getFinanceOrder, saveFinanceOrder, getAhorrosVisible, saveAhorrosVisible } from '../services/storage';
import { SideMenu } from '../components/home/SideMenu';
import { SocialModal } from '../components/social/SocialModal';
import { AddGastoModal } from '../components/finance/AddGastoModal';
import { AddIngresoModal } from '../components/finance/AddIngresoModal';
import { AddDeudaModal } from '../components/finance/AddDeudaModal';
import { AddAhorroModal, AhorroMode } from '../components/finance/AddAhorroModal';
import { SharedExpensesScreen } from './SharedExpensesScreen';
import { useGastosCompartidos } from '../hooks/useGastosCompartidos';
import { DisponibleModal } from '../components/finance/DisponibleModal';
import { SwipeableRow } from '../components/shared/SwipeableRow';
import { FinanzasGraphsModal } from '../components/finance/FinanzasGraphsModal';
import { formatARS, formatARSWithSign } from '../utils/formatters';

function fmtFecha(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return '';
  return format(new Date(y, m - 1, d), 'd MMM', { locale: es });
}

const DEFAULT_ORDER = ['gastos', 'deudas', 'ingresos', 'ahorros'];

export function PresupuestoScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { handleScrollOffset, registerScrollToTop } = useTabBar();
  // Tocar la billetera con Finanzas ya enfocado → scroll arriba de todo
  const listRef = useRef<FlatList<string>>(null);
  useEffect(
    () => registerScrollToTop('Plata', () => listRef.current?.scrollToOffset({ offset: 0, animated: true })),
    [registerScrollToTop]
  );
  const { ingresos, gastos, saldo, ingresosList, gastosList, add, update, remove, togglePin, resetMes } = usePresupuesto();
  const deudas = useDeudas();
  const ahorros = useAhorros();
  const compartidos = useGastosCompartidos();
  const categorias = useCategoriasGasto();
  const metodos = useMetodosPago();

  const [menuVisible, setMenuVisible] = useState(false);
  const [socialVisible, setSocialVisible] = useState(false);
  const [graphsVisible, setGraphsVisible] = useState(false);
  const [dispVisible, setDispVisible] = useState(false);
  const [addGasto, setAddGasto] = useState(false);
  const [addIngreso, setAddIngreso] = useState(false);
  const [addDeuda, setAddDeuda] = useState(false);
  const [editGasto, setEditGasto] = useState<Transaction | null>(null);
  const [editIngreso, setEditIngreso] = useState<Transaction | null>(null);
  const [editDeuda, setEditDeuda] = useState<Deuda | null>(null);
  const [verTodo, setVerTodo] = useState<'gastos' | 'ingresos' | 'deudas' | null>(null);
  const [ahorroMode, setAhorroMode] = useState<AhorroMode | null>(null);
  const [compartidosOpen, setCompartidosOpen] = useState(false);

  // Burbuja de Ahorros: oculta por defecto (no todos la usan). Local.
  const [ahorrosVisible, setAhorrosVisible] = useState(false);
  useEffect(() => { getAhorrosVisible().then(setAhorrosVisible); }, []);
  const showAhorros = useCallback(() => { setAhorrosVisible(true); saveAhorrosVisible(true); }, []);
  const hideAhorros = useCallback(() => { setAhorrosVisible(false); saveAhorrosVisible(false); }, []);

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

  // La burbuja de Ahorros solo se muestra (y reordena) cuando está activada.
  const visibleOrder = useMemo(
    () => order.filter((k) => k !== 'ahorros' || ahorrosVisible),
    [order, ahorrosVisible],
  );
  const onDragEnd = useCallback(({ data }: { data: string[] }) => {
    // `data` = orden de los visibles; si Ahorros está oculto, lo dejo en su lugar.
    setOrder((prev) => {
      let vi = 0;
      const merged = prev.map((k) => (k === 'ahorros' && !ahorrosVisible) ? k : data[vi++]);
      saveFinanceOrder(merged);
      return merged;
    });
  }, [ahorrosVisible]);

  const handleAhorroConfirm = useCallback(async (monto: number) => {
    if (ahorroMode === 'depositar') ahorros.depositar(monto);
    else if (ahorroMode === 'retirar') ahorros.retirar(monto);
    else if (ahorroMode === 'set') await ahorros.set(monto);
  }, [ahorroMode, ahorros]);

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

  // --- Fila de gasto (swipe: pin / borrar · tap en el texto: editar) ---
  const renderGastoRow = (item: Transaction) => {
    const cat = item.categoria ? categorias.getItem(item.categoria) : null;
    const met = item.metodo ? metodos.getItem(item.metodo) : null;
    return (
      <SwipeableRow
        key={item.id}
        pinned={item.pinned}
        pinColor={Dayxo.coral}
        containerStyle={styles.rowSpacing}
        onPin={() => togglePin(item.id)}
        onDelete={() => remove(item.id)}
      >
        <View style={[styles.row, item.pinned && { borderWidth: 1.5, borderColor: Dayxo.coral }]}>
          <View style={[styles.rowIcon, { backgroundColor: Dayxo.coral + '66' }]}>
            <Ionicons name="arrow-up-outline" size={18} color={Dayxo.coral} />
          </View>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.6} onPress={() => { setVerTodo(null); setEditGasto(item); }}>
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
        </View>
      </SwipeableRow>
    );
  };

  // --- Fila de ingreso (swipe: pin / borrar · tap en el texto: editar) ---
  const renderIngresoRow = (item: Transaction) => (
    <SwipeableRow
      key={item.id}
      pinned={item.pinned}
      pinColor={Dayxo.green}
      containerStyle={styles.rowSpacing}
      onPin={() => togglePin(item.id)}
      onDelete={() => remove(item.id)}
    >
      <View style={[styles.row, item.pinned && { borderWidth: 1.5, borderColor: Dayxo.green }]}>
        <View style={[styles.rowIcon, { backgroundColor: Dayxo.green + '66' }]}>
          <Ionicons name="arrow-down-outline" size={18} color={Dayxo.green} />
        </View>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.6} onPress={() => { setVerTodo(null); setEditIngreso(item); }}>
          <Text style={styles.rowDesc}>{item.desc}</Text>
          <Text style={styles.metaFecha}>{item.fechaStr}</Text>
        </TouchableOpacity>
        <Text style={[styles.rowMonto, { color: Dayxo.green }]}>+ {formatARS(item.monto)}</Text>
      </View>
    </SwipeableRow>
  );

  // Saldar una deuda: registra el movimiento de plata y elimina la deuda.
  // me-debe → ingreso (te pagaron) · le-debo → gasto (pagaste). No guarda historial.
  const confirmSaldar = (d: Deuda) => {
    const meDebe = d.tipo === 'me-debe';
    Alert.alert(
      meDebe ? 'Cobrar deuda' : 'Pagar deuda',
      meDebe
        ? `Se registra un ingreso de ${formatARS(d.monto)} y se elimina la deuda de ${d.nombre}.`
        : `Se registra un gasto de ${formatARS(d.monto)} y se elimina la deuda con ${d.nombre}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: meDebe ? 'Cobré' : 'Pagué',
          onPress: async () => {
            await add(
              meDebe ? `Cobro de deuda: ${d.nombre}` : `Pago de deuda: ${d.nombre}`,
              d.monto,
              meDebe ? 'ingreso' : 'gasto',
            );
            await deudas.remove(d.id);
          },
        },
      ],
    );
  };

  // --- Fila de deuda (swipe: pin / borrar · tap en el texto: editar) ---
  const renderDeudaRow = (d: Deuda) => {
    const meDebe = d.tipo === 'me-debe';
    const accent = meDebe ? Dayxo.green : Dayxo.coral;
    return (
      <SwipeableRow
        key={d.id}
        pinned={d.pinned}
        pinColor={Dayxo.purple}
        settleColor={accent}
        containerStyle={styles.rowSpacing}
        onPin={() => deudas.togglePin(d.id)}
        onSettle={() => confirmSaldar(d)}
        onDelete={() => deudas.remove(d.id)}
        deleteOnLeft
      >
        <View style={[styles.row, d.pinned && { borderWidth: 1.5, borderColor: accent }]}>
          <View style={[styles.rowIcon, { backgroundColor: accent + '66' }]}>
            <Ionicons name={meDebe ? 'arrow-down-outline' : 'arrow-up-outline'} size={18} color={accent} />
          </View>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.6} onPress={() => { setVerTodo(null); setEditDeuda(d); }}>
            <Text style={styles.rowDesc}>{d.nombre}</Text>
            <Text style={styles.metaFecha}>{fmtFecha(d.fecha)}</Text>
          </TouchableOpacity>
          <Text style={[styles.rowMonto, { color: accent }]}>
            {meDebe ? '+' : '−'} {formatARS(d.monto)}
          </Text>
        </View>
      </SwipeableRow>
    );
  };

  // Botón "Ver todos" (aparece si hay más de 3 ítems)
  const verTodoBtn = (tipo: 'gastos' | 'ingresos' | 'deudas', count: number, accent: string) => (
    <TouchableOpacity style={styles.verTodo} onPress={() => setVerTodo(tipo)} activeOpacity={0.7}>
      <Text style={[styles.verTodoText, { color: accent }]}>Ver todos ({count})</Text>
      <Ionicons name="chevron-forward" size={15} color={accent} />
    </TouchableOpacity>
  );

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
        <>
          {gastosList.slice(0, 3).map(renderGastoRow)}
          {gastosList.length > 3 && verTodoBtn('gastos', gastosList.length, Dayxo.coral)}
        </>
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
        <>
          {deudas.deudas.slice(0, 3).map(renderDeudaRow)}
          {deudas.deudas.length > 3 && verTodoBtn('deudas', deudas.deudas.length, Dayxo.purple)}
        </>
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
        <>
          {ingresosList.slice(0, 3).map(renderIngresoRow)}
          {ingresosList.length > 3 && verTodoBtn('ingresos', ingresosList.length, Dayxo.green)}
        </>
      )}
    </View>
  );

  // --- Burbuja: Ahorros (caja aparte, local) ---
  const renderAhorros = () => (
    <View style={[styles.bubble, styles.bubbleAhorros]}>
      <View style={styles.bubbleHead}>
        <Text style={[styles.bubbleTitle, { color: Dayxo.blue }]}>Ahorros</Text>
        <View style={styles.ahorrosHeadRight}>
          <TouchableOpacity onPress={hideAhorros} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="eye-off-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <Ionicons name="reorder-three" size={20} color={colors.textTertiary} />
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.7} onPress={() => setAhorroMode('set')} style={styles.ahorroTotal}>
        <Text style={styles.ahorroTotalLabel}>Total ahorrado</Text>
        <Text style={[styles.ahorroTotalValue, { color: Dayxo.blue }]}>{formatARS(ahorros.balance)}</Text>
        <Text style={styles.ahorroEditHint}>Tocá para editar el total</Text>
      </TouchableOpacity>

      <View style={styles.ahorroBtns}>
        <TouchableOpacity style={[styles.ahorroBtn, { backgroundColor: Dayxo.blue }]} onPress={() => setAhorroMode('depositar')}>
          <Ionicons name="arrow-down" size={18} color="#fff" />
          <Text style={styles.ahorroBtnText}>Guardar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.ahorroBtn, styles.ahorroBtnOutline, ahorros.balance <= 0 && { opacity: 0.4 }]}
          onPress={() => setAhorroMode('retirar')}
          disabled={ahorros.balance <= 0}
        >
          <Ionicons name="arrow-up" size={18} color={Dayxo.blue} />
          <Text style={[styles.ahorroBtnText, { color: Dayxo.blue }]}>Usar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderItem = ({ item, drag, isActive }: RenderItemParams<string>) => {
    const content = item === 'gastos' ? renderGastos()
      : item === 'deudas' ? renderDeudas()
      : item === 'ingresos' ? renderIngresos()
      : renderAhorros();
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

      {/* Entrada a Gastos compartidos (estilo Tricount) */}
      <TouchableOpacity style={styles.compartidosCard} activeOpacity={0.85} onPress={() => setCompartidosOpen(true)}>
        <View style={styles.compartidosIcon}><Ionicons name="people" size={20} color="#fff" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.compartidosTitle}>Gastos compartidos</Text>
          <Text style={styles.compartidosSub}>
            {compartidos.groups.length > 0
              ? `${compartidos.groups.length} ${compartidos.groups.length === 1 ? 'grupo' : 'grupos'} · dividí con tu gente`
              : 'Dividí gastos con amigos, viajes, asados...'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>

      <View style={styles.hintRow}>
        <Text style={styles.dragHint}>Mantené apretada una sección para reordenarla</Text>
        {!ahorrosVisible && (
          <TouchableOpacity style={styles.activarAhorros} onPress={showAhorros} activeOpacity={0.8}>
            <Ionicons name="add" size={15} color={Dayxo.blue} />
            <Text style={styles.activarAhorrosText}>Mostrar ahorros</Text>
          </TouchableOpacity>
        )}
      </View>
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
        // El tipo del ref difiere (FlatList de gesture-handler vs react-native)
        // pero en runtime es el mismo FlatList: el cast es seguro.
        ref={listRef as any}
        // Deja pasar los swipes horizontales al pager (Home↔Plata↔Stats): sin esto,
        // la lista captura todo movimiento y el deslizamiento entre tabs no anda.
        // El reordenar (long-press + arrastrar) sigue funcionando igual.
        activationDistance={20}
        data={visibleOrder}
        keyExtractor={(k) => k}
        renderItem={renderItem}
        onDragEnd={onDragEnd}
        ListHeaderComponent={Header}
        ListFooterComponent={Footer}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        onScrollOffsetChange={handleScrollOffset}
      />

      {/* Menú lateral (incluye Misiones adentro) */}
      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onOpenSocial={() => setSocialVisible(true)}
      />

      {/* Social (amigos y grupos) — accesible desde el menú lateral */}
      <SocialModal visible={socialVisible} onClose={() => setSocialVisible(false)} />

      {/* Guardar / usar / editar ahorros */}
      <AddAhorroModal
        visible={ahorroMode !== null}
        mode={ahorroMode ?? 'depositar'}
        balance={ahorros.balance}
        onClose={() => setAhorroMode(null)}
        onConfirm={handleAhorroConfirm}
      />

      {/* Gastos compartidos (ventana tipo sheet, estilo Tricount) */}
      <SharedExpensesScreen
        visible={compartidosOpen}
        compartidos={compartidos}
        onClose={() => setCompartidosOpen(false)}
      />

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
        visible={addDeuda || !!editDeuda}
        editing={editDeuda}
        onClose={() => { setAddDeuda(false); setEditDeuda(null); }}
        onAdd={(nombre, monto, tipo, fecha) => deudas.add(nombre, monto, tipo, fecha)}
        onUpdate={(id, nombre, monto, tipo, fecha) => deudas.update(id, nombre, monto, tipo, fecha)}
      />

      {/* Ver todos: lista completa de la sección elegida */}
      <Modal
        visible={!!verTodo}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVerTodo(null)}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaView style={styles.modalSafe} edges={['top']}>
            <View style={styles.modalHandleWrap}><View style={styles.modalHandle} /></View>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {verTodo === 'gastos' ? 'Todos los gastos' : verTodo === 'ingresos' ? 'Todos los ingresos' : 'Todas las deudas'}
              </Text>
              <TouchableOpacity onPress={() => setVerTodo(null)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              {verTodo === 'gastos' && gastosList.map(renderGastoRow)}
              {verTodo === 'ingresos' && ingresosList.map(renderIngresoRow)}
              {verTodo === 'deudas' && deudas.deudas.map(renderDeudaRow)}
            </ScrollView>
          </SafeAreaView>
        </GestureHandlerRootView>
      </Modal>
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
  hintRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 10, paddingHorizontal: 14, marginTop: 14, marginBottom: -6,
  },
  dragHint: {
    flex: 1, fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textTertiary,
  },
  activarAhorros: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999,
    backgroundColor: Dayxo.blue + '14', borderWidth: 1, borderColor: Dayxo.blue + '33',
  },
  activarAhorrosText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: Dayxo.blue },

  compartidosCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 14, marginTop: 14,
    backgroundColor: colors.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  compartidosIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Dayxo.blue, alignItems: 'center', justifyContent: 'center' },
  compartidosTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  compartidosSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2 },

  bubble: {
    marginHorizontal: 14, marginTop: 18,
    borderRadius: 18, padding: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 2,
  },
  bubbleGastos: { backgroundColor: colors.pinkLight, borderColor: Dayxo.coral + '40', shadowColor: Dayxo.coral },
  bubbleDeudas: { backgroundColor: colors.violetLight, borderColor: Dayxo.purple + '40', shadowColor: Dayxo.purple },
  bubbleIngresos: { backgroundColor: colors.greenLight, borderColor: Dayxo.green + '40', shadowColor: Dayxo.green },
  bubbleAhorros: { backgroundColor: colors.blueLight, borderColor: Dayxo.blue + '40', shadowColor: Dayxo.blue },
  bubbleHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bubbleTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  bubbleTotal: { fontSize: 17, fontFamily: 'Inter_800ExtraBold', color: colors.textPrimary },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, textAlign: 'center', paddingVertical: 16 },
  rowSpacing: { marginBottom: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.card, borderRadius: 12, padding: 12,
  },
  verTodo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 10, marginTop: 2,
  },
  verTodoText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  modalSafe: { flex: 1, backgroundColor: colors.bg },
  modalHandleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  modalBody: { padding: 14, paddingBottom: 40 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowDesc: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' },
  metaFecha: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2 },
  miniBadge: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  miniBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  rowMonto: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 14, paddingVertical: 13, marginTop: 8, marginBottom: 12,
  },
  addBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },

  // --- Ahorros ---
  ahorrosHeadRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ahorroTotal: {
    backgroundColor: colors.card, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 4, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  ahorroTotalLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  ahorroTotalValue: { fontSize: 26, fontFamily: 'Inter_800ExtraBold', marginTop: 4 },
  ahorroEditHint: { fontSize: 10.5, fontFamily: 'Inter_400Regular', color: colors.textTertiary, marginTop: 6 },
  ahorroBtns: { flexDirection: 'row', gap: 10 },
  ahorroBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 14, paddingVertical: 13,
  },
  ahorroBtnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Dayxo.blue },
  ahorroBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },

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
