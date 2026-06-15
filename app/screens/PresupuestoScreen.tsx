import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { usePresupuesto } from '../hooks/usePresupuesto';
import { useCategoriasGasto, useMetodosPago } from '../hooks/useOpcionesGasto';
import { EmptyState } from '../components/shared/EmptyState';
import { OpcionesModal } from '../components/shared/OpcionesModal';
import { formatARS, formatARSWithSign, formatMontoInput, parseMontoInput } from '../utils/formatters';
import { Transaction, OpcionGasto } from '../types';

function ChipSelector({ items, selected, onSelect, onEdit, styles, colors }: {
  items: OpcionGasto[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  onEdit: () => void;
  styles: Styles;
  colors: AppColors;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.chipRow}>
        {items.map((item) => {
          const pal = colors.familia[item.color];
          const active = selected === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelect(active ? null : item.id)}
              style={[
                styles.chip,
                { backgroundColor: pal.bg },
                active && { borderWidth: 2, borderColor: pal.fg },
              ]}
            >
              <Text style={[styles.chipText, { color: pal.fg }]}>{item.nombre}</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity onPress={onEdit} style={styles.editChip}>
          <Ionicons name="settings-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.editChipText}>Editar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export function PresupuestoScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { txs, ingresos, gastos, saldo, add, remove } = usePresupuesto();
  const categorias = useCategoriasGasto();
  const metodos = useMetodosPago();
  const [desc, setDesc] = useState('');
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState<Transaction['tipo']>('gasto');
  const [selCategoria, setSelCategoria] = useState<string | null>(null);
  const [selMetodo, setSelMetodo] = useState<string | null>(null);
  const [modalCategorias, setModalCategorias] = useState(false);
  const [modalMetodos, setModalMetodos] = useState(false);

  const handleAdd = async () => {
    const parsed = parseMontoInput(monto);
    if (!desc.trim() || parsed <= 0) return;
    await add(
      desc.trim(),
      parsed,
      tipo,
      tipo === 'gasto' ? selCategoria ?? undefined : undefined,
      selMetodo ?? undefined,
    );
    setDesc(''); setMonto('');
    setSelCategoria(null); setSelMetodo(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={txs}
          keyExtractor={(t) => t.id}
          ListHeaderComponent={
            <>
              <View style={styles.header}>
                <View style={styles.iconWrap}>
                  <Ionicons name="wallet-outline" size={22} color={colors.blue} />
                </View>
                <View>
                  <Text style={styles.title}>Mi Plata</Text>
                  <Text style={styles.sub}>control de gastos</Text>
                </View>
              </View>

              {/* Summary */}
              <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: colors.greenLight }]}>
                  <Text style={styles.summaryLabel}>ENTRADAS</Text>
                  <Text style={[styles.summaryValue, { color: colors.green }]}>{formatARS(ingresos)}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: colors.pinkLight }]}>
                  <Text style={styles.summaryLabel}>GASTOS</Text>
                  <Text style={[styles.summaryValue, { color: colors.pink }]}>{formatARS(gastos)}</Text>
                </View>
              </View>
              <View style={styles.saldoRow}>
                <Text style={styles.saldoLabel}>Saldo disponible</Text>
                <Text style={[styles.saldoValue, { color: saldo >= 0 ? colors.blue : colors.pink }]}>
                  {formatARSWithSign(saldo)}
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <View style={styles.tipoToggle}>
                  <TouchableOpacity
                    onPress={() => setTipo('gasto')}
                    style={[styles.tipoBtn, tipo === 'gasto' && { backgroundColor: colors.pinkLight }]}
                  >
                    <Text style={[styles.tipoBtnText, tipo === 'gasto' && { color: colors.negative }]}>Gasto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setTipo('ingreso')}
                    style={[styles.tipoBtn, tipo === 'ingreso' && { backgroundColor: colors.greenLight }]}
                  >
                    <Text style={[styles.tipoBtnText, tipo === 'ingreso' && { color: colors.positive }]}>Ingreso</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 2 }]}
                    placeholder="Descripción"
                    placeholderTextColor={colors.textSecondary}
                    value={desc}
                    onChangeText={setDesc}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1.2 }]}
                    placeholder="Monto"
                    placeholderTextColor={colors.textSecondary}
                    value={monto}
                    onChangeText={(t) => setMonto(formatMontoInput(t))}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity onPress={handleAdd} style={styles.addBtn}>
                    <Ionicons name="add" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>

                {tipo === 'gasto' && (
                  <View style={styles.selectorBlock}>
                    <Text style={styles.selectorLabel}>MOTIVO (OPCIONAL)</Text>
                    <ChipSelector
                      items={categorias.items}
                      selected={selCategoria}
                      onSelect={setSelCategoria}
                      onEdit={() => setModalCategorias(true)}
                      styles={styles}
                      colors={colors}
                    />
                  </View>
                )}

                <View style={styles.selectorBlock}>
                  <Text style={styles.selectorLabel}>FORMA DE PAGO (OPCIONAL)</Text>
                  <ChipSelector
                    items={metodos.items}
                    selected={selMetodo}
                    onSelect={setSelMetodo}
                    onEdit={() => setModalMetodos(true)}
                    styles={styles}
                    colors={colors}
                  />
                </View>
              </View>
            </>
          }
          ListEmptyComponent={<EmptyState icon="wallet-outline" text="Sin movimientos todavía" />}
          renderItem={({ item }) => {
            const isGasto = item.tipo === 'gasto';
            const categoria = item.categoria ? categorias.getItem(item.categoria) : null;
            const metodo = item.metodo ? metodos.getItem(item.metodo) : null;
            return (
              <View style={styles.txItem}>
                <View style={[styles.txIcon, { backgroundColor: isGasto ? colors.pinkLight : colors.greenLight }]}>
                  <Ionicons
                    name={isGasto ? 'arrow-up-outline' : 'arrow-down-outline'}
                    size={18}
                    color={isGasto ? colors.pink : colors.green}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txDesc}>{item.desc}</Text>
                  <View style={styles.txMetaRow}>
                    <Text style={styles.txFecha}>{item.fechaStr}</Text>
                    {categoria && (
                      <View style={[styles.miniBadge, { backgroundColor: colors.familia[categoria.color].bg }]}>
                        <Text style={[styles.miniBadgeText, { color: colors.familia[categoria.color].fg }]}>
                          {categoria.nombre}
                        </Text>
                      </View>
                    )}
                    {metodo && (
                      <View style={[styles.miniBadge, { backgroundColor: colors.familia[metodo.color].bg }]}>
                        <Text style={[styles.miniBadgeText, { color: colors.familia[metodo.color].fg }]}>
                          {metodo.nombre}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={[styles.txMonto, { color: isGasto ? colors.pink : colors.green }]}>
                  {isGasto ? '-' : '+'}{formatARS(item.monto)}
                </Text>
                <TouchableOpacity onPress={() => remove(item.id)} style={{ padding: 4 }}>
                  <Ionicons name="close" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />

        <OpcionesModal
          visible={modalCategorias}
          onClose={() => setModalCategorias(false)}
          titulo="Motivos de gasto"
          placeholder="Ej: Salidas, Super, Gym..."
          items={categorias.items}
          onAdd={categorias.add}
          onUpdate={categorias.update}
          onRemove={categorias.remove}
        />
        <OpcionesModal
          visible={modalMetodos}
          onClose={() => setModalMetodos(false)}
          titulo="Formas de pago"
          placeholder="Ej: Débito, Crypto, Cuenta DNI..."
          items={metodos.items}
          onAdd={metodos.add}
          onUpdate={metodos.update}
          onRemove={metodos.remove}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.blue },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 10, margin: 14, marginBottom: 8 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 14 },
  summaryLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5 },
  summaryValue: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 4 },
  saldoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.grayVeryLight,
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 11,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  saldoLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  saldoValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  form: {
    backgroundColor: colors.card,
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tipoToggle: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.grayVeryLight,
    borderRadius: 10,
    padding: 4,
  },
  tipoBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tipoBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    backgroundColor: colors.blue,
    borderRadius: 10,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorBlock: { gap: 6 },
  selectorLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  chipRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  chip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
  },
  editChipText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txDesc: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  txMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' },
  txFecha: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary },
  txMonto: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  miniBadge: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  miniBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
});

type Styles = ReturnType<typeof createStyles>;
