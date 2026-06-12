import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useDeudas } from '../hooks/useDeudas';
import { EmptyState } from '../components/shared/EmptyState';
import { formatARS } from '../utils/formatters';
import { Deuda } from '../types';
import { initials } from '../utils/formatters';

function SummaryGrid({ totalMeDeben, totalLeDebo, balance, meDebenCount, leDeboCount }: {
  totalMeDeben: number; totalLeDebo: number; balance: number;
  meDebenCount: number; leDeboCount: number;
}) {
  return (
    <View style={styles.summaryGrid}>
      <View style={[styles.summaryCard, { backgroundColor: Colors.greenLight }]}>
        <Text style={styles.summaryLabel}>ME DEBEN</Text>
        <Text style={[styles.summaryValue, { color: Colors.green }]}>{formatARS(totalMeDeben)}</Text>
        <Text style={styles.summarySub}>{meDebenCount} personas</Text>
      </View>
      <View style={[styles.summaryCard, { backgroundColor: Colors.pinkLight }]}>
        <Text style={styles.summaryLabel}>LE DEBO</Text>
        <Text style={[styles.summaryValue, { color: Colors.pink }]}>{formatARS(totalLeDebo)}</Text>
        <Text style={styles.summarySub}>{leDeboCount} personas</Text>
      </View>
      <View style={[styles.summaryCard, { backgroundColor: '#F0F0F0' }]}>
        <Text style={styles.summaryLabel}>BALANCE</Text>
        <Text style={[styles.summaryValue, { color: balance >= 0 ? Colors.green : Colors.pink }]}>
          {balance >= 0 ? '+' : '-'}{formatARS(Math.abs(balance))}
        </Text>
        <Text style={styles.summarySub}>neto</Text>
      </View>
    </View>
  );
}

function DeudaItem({ item, onRemove }: { item: Deuda; onRemove: () => void }) {
  const isMeDebe = item.tipo === 'me-debe';
  const avatarBg = isMeDebe ? Colors.greenLight : Colors.pinkLight;
  const avatarColor = isMeDebe ? Colors.green : Colors.pink;
  const badgeBg = isMeDebe ? Colors.greenLight : Colors.pinkLight;
  const badgeColor = isMeDebe ? Colors.green : Colors.pink;
  const badgeLabel = isMeDebe ? 'ME DEBE' : 'LE DEBO';

  return (
    <View style={styles.deudaItem}>
      <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
        <Text style={[styles.avatarText, { color: avatarColor }]}>{initials(item.nombre)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.deudaNombre}>{item.nombre}</Text>
        {item.desc ? <Text style={styles.deudaDesc}>{item.desc}</Text> : null}
      </View>
      <View style={styles.deudaRight}>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
        </View>
        <Text style={[styles.deudaMonto, { color: isMeDebe ? Colors.green : Colors.pink }]}>
          {formatARS(item.monto)}
        </Text>
        <TouchableOpacity onPress={onRemove} style={styles.saldarBtn}>
          <Text style={styles.saldarText}>✓ saldar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function DeudasScreen() {
  const { deudas, meDeben, leDebo, totalMeDeben, totalLeDebo, balance, add, remove } = useDeudas();
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [desc, setDesc] = useState('');
  const [tipo, setTipo] = useState<Deuda['tipo']>('me-debe');

  const handleAdd = async () => {
    if (!nombre.trim() || !monto.trim()) return;
    await add(nombre.trim(), parseFloat(monto), desc.trim(), tipo);
    setNombre(''); setMonto(''); setDesc('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={deudas}
          keyExtractor={(d) => d.id}
          ListHeaderComponent={
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconWrap}>
                  <Ionicons name="cash-outline" size={22} color={Colors.green} />
                </View>
                <View>
                  <Text style={styles.title}>Entre amigos</Text>
                  <Text style={styles.sub}>quién debe qué</Text>
                </View>
              </View>
              <SummaryGrid
                totalMeDeben={totalMeDeben}
                totalLeDebo={totalLeDebo}
                balance={balance}
                meDebenCount={meDeben.length}
                leDeboCount={leDebo.length}
              />
              {/* Form */}
              <View style={styles.form}>
                <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor={Colors.textSecondary} value={nombre} onChangeText={setNombre} />
                <TextInput style={styles.input} placeholder="Monto" placeholderTextColor={Colors.textSecondary} value={monto} onChangeText={setMonto} keyboardType="numeric" />
                <TextInput style={styles.input} placeholder="Motivo (opcional)" placeholderTextColor={Colors.textSecondary} value={desc} onChangeText={setDesc} />
                <View style={styles.tipoRow}>
                  <TouchableOpacity
                    onPress={() => setTipo('me-debe')}
                    style={[styles.tipoBtn, tipo === 'me-debe' && { backgroundColor: Colors.greenLight }]}
                  >
                    <Text style={[styles.tipoBtnText, tipo === 'me-debe' && { color: Colors.green }]}>Me debe</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setTipo('le-debo')}
                    style={[styles.tipoBtn, tipo === 'le-debo' && { backgroundColor: Colors.pinkLight }]}
                  >
                    <Text style={[styles.tipoBtnText, tipo === 'le-debo' && { color: Colors.pink }]}>Le debo</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={handleAdd} style={styles.addBtn}>
                  <Text style={styles.addBtnText}>Agregar</Text>
                </TouchableOpacity>
              </View>
            </>
          }
          ListEmptyComponent={<EmptyState icon="cash-outline" text="Sin deudas registradas" />}
          renderItem={({ item }) => <DeudaItem item={item} onRemove={() => remove(item.id)} />}
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
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.green },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  summaryGrid: { flexDirection: 'row', gap: 8, margin: 14 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 12 },
  summaryLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.textSecondary, letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  summarySub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
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
  tipoRow: { flexDirection: 'row', gap: 8 },
  tipoBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipoBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  addBtn: {
    backgroundColor: Colors.green,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  deudaItem: {
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
  avatar: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  deudaNombre: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  deudaDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  deudaRight: { alignItems: 'flex-end', gap: 4 },
  badge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  deudaMonto: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  saldarBtn: {
    backgroundColor: Colors.grayVeryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saldarText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
});
