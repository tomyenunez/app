import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { useDeudas } from '../hooks/useDeudas';
import { EmptyState } from '../components/shared/EmptyState';
import { formatARS, formatMontoInput, parseMontoInput, initials } from '../utils/formatters';
import { Deuda } from '../types';

export function DeudasScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { deudas, meDeben, leDebo, totalMeDeben, totalLeDebo, balance, add, remove } = useDeudas();
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [desc, setDesc] = useState('');
  const [tipo, setTipo] = useState<Deuda['tipo']>('me-debe');

  const handleAdd = async () => {
    const parsed = parseMontoInput(monto);
    if (!nombre.trim() || parsed <= 0) return;
    await add(nombre.trim(), parsed, desc.trim(), tipo);
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
                  <Ionicons name="cash-outline" size={22} color={colors.green} />
                </View>
                <View>
                  <Text style={styles.title}>Entre amigos</Text>
                  <Text style={styles.sub}>quién debe qué</Text>
                </View>
              </View>

              {/* Summary grid */}
              <View style={styles.summaryGrid}>
                <View style={[styles.summaryCard, { backgroundColor: colors.greenLight }]}>
                  <Text style={styles.summaryLabel}>ME DEBEN</Text>
                  <Text style={[styles.summaryValue, { color: colors.green }]}>{formatARS(totalMeDeben)}</Text>
                  <Text style={styles.summarySub}>{meDeben.length} personas</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: colors.pinkLight }]}>
                  <Text style={styles.summaryLabel}>LE DEBO</Text>
                  <Text style={[styles.summaryValue, { color: colors.pink }]}>{formatARS(totalLeDebo)}</Text>
                  <Text style={styles.summarySub}>{leDebo.length} personas</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: colors.grayVeryLight }]}>
                  <Text style={styles.summaryLabel}>BALANCE</Text>
                  <Text style={[styles.summaryValue, { color: balance >= 0 ? colors.green : colors.pink }]}>
                    {balance >= 0 ? '+' : '-'}{formatARS(Math.abs(balance))}
                  </Text>
                  <Text style={styles.summarySub}>neto</Text>
                </View>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor={colors.textSecondary} value={nombre} onChangeText={setNombre} />
                <TextInput style={styles.input} placeholder="Monto" placeholderTextColor={colors.textSecondary} value={monto} onChangeText={(t) => setMonto(formatMontoInput(t))} keyboardType="numeric" />
                <TextInput style={styles.input} placeholder="Motivo (opcional)" placeholderTextColor={colors.textSecondary} value={desc} onChangeText={setDesc} />
                <View style={styles.tipoRow}>
                  <TouchableOpacity
                    onPress={() => setTipo('me-debe')}
                    style={[styles.tipoBtn, tipo === 'me-debe' && { backgroundColor: colors.greenLight }]}
                  >
                    <Text style={[styles.tipoBtnText, tipo === 'me-debe' && { color: colors.green }]}>Me debe</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setTipo('le-debo')}
                    style={[styles.tipoBtn, tipo === 'le-debo' && { backgroundColor: colors.pinkLight }]}
                  >
                    <Text style={[styles.tipoBtnText, tipo === 'le-debo' && { color: colors.pink }]}>Le debo</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={handleAdd} style={styles.addBtn}>
                  <Text style={styles.addBtnText}>Agregar</Text>
                </TouchableOpacity>
              </View>
            </>
          }
          ListEmptyComponent={<EmptyState icon="cash-outline" text="Sin deudas registradas" />}
          renderItem={({ item }) => {
            const isMeDebe = item.tipo === 'me-debe';
            return (
              <View style={styles.deudaItem}>
                <View style={[styles.avatar, { backgroundColor: isMeDebe ? colors.greenLight : colors.pinkLight }]}>
                  <Text style={[styles.avatarText, { color: isMeDebe ? colors.green : colors.pink }]}>
                    {initials(item.nombre)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.deudaNombre}>{item.nombre}</Text>
                  {item.desc ? <Text style={styles.deudaDesc}>{item.desc}</Text> : null}
                </View>
                <View style={styles.deudaRight}>
                  <View style={[styles.badge, { backgroundColor: isMeDebe ? colors.greenLight : colors.pinkLight }]}>
                    <Text style={[styles.badgeText, { color: isMeDebe ? colors.green : colors.pink }]}>
                      {isMeDebe ? 'ME DEBE' : 'LE DEBO'}
                    </Text>
                  </View>
                  <Text style={[styles.deudaMonto, { color: isMeDebe ? colors.green : colors.pink }]}>
                    {formatARS(item.monto)}
                  </Text>
                  <TouchableOpacity onPress={() => remove(item.id)} style={styles.saldarBtn}>
                    <Text style={styles.saldarText}>✓ saldar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
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
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.green },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2 },
  summaryGrid: { flexDirection: 'row', gap: 8, margin: 14 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 12 },
  summaryLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  summarySub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2 },
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
  tipoRow: { flexDirection: 'row', gap: 8 },
  tipoBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.grayVeryLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipoBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },
  addBtn: {
    backgroundColor: colors.green,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  deudaItem: {
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
  avatar: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  deudaNombre: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  deudaDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2 },
  deudaRight: { alignItems: 'flex-end', gap: 4 },
  badge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  deudaMonto: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  saldarBtn: {
    backgroundColor: colors.grayVeryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saldarText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
});
