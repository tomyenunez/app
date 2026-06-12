import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { usePresupuesto } from '../hooks/usePresupuesto';
import { EmptyState } from '../components/shared/EmptyState';
import { formatARS, formatARSWithSign } from '../utils/formatters';
import { Transaction } from '../types';

function TransactionItem({ item, onRemove }: { item: Transaction; onRemove: () => void }) {
  const isGasto = item.tipo === 'gasto';
  return (
    <View style={styles.txItem}>
      <View style={[styles.txIcon, { backgroundColor: isGasto ? Colors.pinkLight : Colors.greenLight }]}>
        <Ionicons
          name={isGasto ? 'arrow-up-outline' : 'arrow-down-outline'}
          size={18}
          color={isGasto ? Colors.pink : Colors.green}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txDesc}>{item.desc}</Text>
        <Text style={styles.txFecha}>{item.fechaStr}</Text>
      </View>
      <Text style={[styles.txMonto, { color: isGasto ? Colors.pink : Colors.green }]}>
        {isGasto ? '-' : '+'}{formatARS(item.monto)}
      </Text>
      <TouchableOpacity onPress={onRemove} style={{ padding: 4 }}>
        <Ionicons name="close" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

export function PresupuestoScreen() {
  const { txs, ingresos, gastos, saldo, add, remove } = usePresupuesto();
  const [desc, setDesc] = useState('');
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState<Transaction['tipo']>('gasto');

  const handleAdd = async () => {
    if (!desc.trim() || !monto.trim()) return;
    await add(desc.trim(), parseFloat(monto), tipo);
    setDesc(''); setMonto('');
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
                  <Ionicons name="wallet-outline" size={22} color={Colors.blue} />
                </View>
                <View>
                  <Text style={styles.title}>Mi Plata</Text>
                  <Text style={styles.sub}>control de gastos</Text>
                </View>
              </View>

              {/* Summary */}
              <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: Colors.greenLight }]}>
                  <Text style={styles.summaryLabel}>ENTRADAS</Text>
                  <Text style={[styles.summaryValue, { color: Colors.green }]}>{formatARS(ingresos)}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: Colors.pinkLight }]}>
                  <Text style={styles.summaryLabel}>GASTOS</Text>
                  <Text style={[styles.summaryValue, { color: Colors.pink }]}>{formatARS(gastos)}</Text>
                </View>
              </View>
              <View style={styles.saldoRow}>
                <Text style={styles.saldoLabel}>Saldo disponible</Text>
                <Text style={[styles.saldoValue, { color: saldo >= 0 ? Colors.blue : Colors.pink }]}>
                  {formatARSWithSign(saldo)}
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <View style={styles.tipoToggle}>
                  <TouchableOpacity
                    onPress={() => setTipo('gasto')}
                    style={[styles.tipoBtn, tipo === 'gasto' && { backgroundColor: Colors.pinkLight }]}
                  >
                    <Text style={[styles.tipoBtnText, tipo === 'gasto' && { color: Colors.negative }]}>Gasto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setTipo('ingreso')}
                    style={[styles.tipoBtn, tipo === 'ingreso' && { backgroundColor: Colors.greenLight }]}
                  >
                    <Text style={[styles.tipoBtnText, tipo === 'ingreso' && { color: Colors.positive }]}>Ingreso</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 2 }]}
                    placeholder="Descripción"
                    placeholderTextColor={Colors.textSecondary}
                    value={desc}
                    onChangeText={setDesc}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Monto"
                    placeholderTextColor={Colors.textSecondary}
                    value={monto}
                    onChangeText={setMonto}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity onPress={handleAdd} style={styles.addBtn}>
                    <Ionicons name="add" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          }
          ListEmptyComponent={<EmptyState icon="wallet-outline" text="Sin movimientos todavía" />}
          renderItem={({ item }) => <TransactionItem item={item} onRemove={() => remove(item.id)} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.blue },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 10, margin: 14, marginBottom: 8 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 14 },
  summaryLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.textSecondary, letterSpacing: 0.5 },
  summaryValue: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 4 },
  saldoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.grayVeryLight,
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 11,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  saldoLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  saldoValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  form: {
    backgroundColor: Colors.card,
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
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 4,
  },
  tipoBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tipoBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    backgroundColor: Colors.grayVeryLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addBtn: {
    backgroundColor: Colors.blue,
    borderRadius: 10,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
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
  txDesc: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  txFecha: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  txMonto: { fontSize: 16, fontFamily: 'Inter_700Bold' },
});
