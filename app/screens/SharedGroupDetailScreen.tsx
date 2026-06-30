import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { AppText as Text } from '../components/shared/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { Dayxo } from '../constants/dayxo';
import { SharedGroup, SharedExpense } from '../types';
import { formatARS, initials } from '../utils/formatters';
import { computeBalances, computeSettlements, groupTotal } from '../utils/splitUtils';
import { AddSharedExpenseModal } from '../components/finance/AddSharedExpenseModal';

interface Props {
  group: SharedGroup;
  onBack: () => void;
  onAddExpense: (groupId: string, e: Omit<SharedExpense, 'id'>) => void;
  onRemoveExpense: (groupId: string, expenseId: string) => void;
  onDeleteGroup: (groupId: string) => void;
}

export function SharedGroupDetailScreen({ group, onBack, onAddExpense, onRemoveExpense, onDeleteGroup }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tab, setTab] = useState<'gastos' | 'balances'>('gastos');
  const [addOpen, setAddOpen] = useState(false);

  const total = groupTotal(group);
  const balances = useMemo(() => computeBalances(group), [group]);
  const settlements = useMemo(() => computeSettlements(balances), [balances]);
  const nameOf = (id: string) => group.members.find((m) => m.id === id)?.nombre ?? '—';
  const isYou = (id: string) => group.members.find((m) => m.id === id)?.isYou;

  const invitar = async () => {
    try {
      await Share.share({
        message: `Sumate a "${group.nombre}" para dividir los gastos en Dayxo 👉 https://dayxo.app/g/${group.inviteCode}`,
      });
    } catch { /* cancelado */ }
  };

  const confirmDeleteGroup = () => {
    Alert.alert('Eliminar grupo', `¿Seguro que querés eliminar "${group.nombre}"? Se borran todos sus gastos.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { onDeleteGroup(group.id); onBack(); } },
    ]);
  };

  const confirmDeleteExpense = (e: SharedExpense) => {
    Alert.alert('Borrar gasto', `¿Borrar "${e.desc}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => onRemoveExpense(group.id, e.id) },
    ]);
  };

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.cover]}>
      {/* Portada */}
      <LinearGradient colors={group.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coverHead}>
        <SafeAreaView edges={['top']}>
          <View style={styles.coverTop}>
            <TouchableOpacity onPress={onBack} style={styles.coverIconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmDeleteGroup} style={styles.coverIconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.coverEmoji}>{group.emoji}</Text>
          <Text style={styles.coverName} numberOfLines={1}>{group.nombre}</Text>
          <Text style={styles.coverTotal}>{formatARS(total)} en total</Text>

          <View style={styles.avatarsRow}>
            {group.members.slice(0, 6).map((m) => (
              <View key={m.id} style={[styles.avatarSm, { backgroundColor: m.color, borderColor: '#fff' }]}>
                <Text style={styles.avatarSmTxt}>{initials(m.nombre)}</Text>
              </View>
            ))}
            {group.members.length > 6 && <Text style={styles.moreMembers}>+{group.members.length - 6}</Text>}
            <TouchableOpacity style={styles.inviteBtn} onPress={invitar}>
              <Ionicons name="link" size={15} color="#fff" />
              <Text style={styles.inviteTxt}>Invitar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['gastos', 'balances'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>{t === 'gastos' ? 'Gastos' : 'Balances'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {tab === 'gastos' ? (
          group.expenses.length === 0 ? (
            <Text style={styles.empty}>Todavía no hay gastos. Agregá el primero 👇</Text>
          ) : (
            group.expenses.map((e) => (
              <TouchableOpacity key={e.id} style={styles.expRow} activeOpacity={0.7} onLongPress={() => confirmDeleteExpense(e)} delayLongPress={300}>
                <View style={styles.expIcon}><Text style={{ fontSize: 18 }}>{group.emoji}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.expDesc}>{e.desc}</Text>
                  <Text style={styles.expMeta}>
                    Pagó {isYou(e.paidBy) ? 'vos' : nameOf(e.paidBy)} · entre {e.splitBetween.length}
                  </Text>
                </View>
                <Text style={styles.expMonto}>{formatARS(e.monto)}</Text>
              </TouchableOpacity>
            ))
          )
        ) : (
          <>
            {/* Balance de cada uno */}
            {balances.map((b) => {
              const c = b.balance > 0 ? Dayxo.green : b.balance < 0 ? Dayxo.coral : colors.textSecondary;
              const txt = b.balance > 0 ? `le deben ${formatARS(b.balance)}`
                : b.balance < 0 ? `debe ${formatARS(-b.balance)}`
                : 'está a mano';
              return (
                <View key={b.member.id} style={styles.balRow}>
                  <View style={[styles.avatarSm, { backgroundColor: b.member.color, borderColor: colors.card }]}>
                    <Text style={styles.avatarSmTxt}>{initials(b.member.nombre)}</Text>
                  </View>
                  <Text style={styles.balName}>{b.member.isYou ? 'Vos' : b.member.nombre}</Text>
                  <Text style={[styles.balValue, { color: c }]}>{txt}</Text>
                </View>
              );
            })}

            {/* Cómo saldar */}
            <Text style={styles.sectionTitle}>Cómo saldar</Text>
            {settlements.length === 0 ? (
              <Text style={styles.empty}>¡Están todos a mano! 🎉</Text>
            ) : (
              settlements.map((s, i) => (
                <View key={i} style={styles.settleRow}>
                  <Text style={styles.settleTxt}>
                    <Text style={styles.settleName}>{s.from.isYou ? 'Vos' : s.from.nombre}</Text>
                    {'  →  '}
                    <Text style={styles.settleName}>{s.to.isYou ? 'vos' : s.to.nombre}</Text>
                  </Text>
                  <Text style={styles.settleMonto}>{formatARS(s.monto)}</Text>
                </View>
              ))
            )}
          </>
        )}
        <View style={{ height: 150 }} />
      </ScrollView>

      {/* CTA agregar gasto */}
      <TouchableOpacity style={styles.fab} onPress={() => setAddOpen(true)} activeOpacity={0.9}>
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.fabTxt}>Agregar gasto</Text>
      </TouchableOpacity>

      <AddSharedExpenseModal
        visible={addOpen}
        group={group}
        onClose={() => setAddOpen(false)}
        onAdd={(e) => onAddExpense(group.id, e)}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  cover: { backgroundColor: colors.bg },
  coverHead: { paddingHorizontal: 16, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  coverTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  coverIconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  coverEmoji: { fontSize: 40, textAlign: 'center', marginTop: 6 },
  coverName: { fontSize: 22, fontFamily: 'Inter_800ExtraBold', color: '#fff', textAlign: 'center', marginTop: 4 },
  coverTotal: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 2 },
  avatarsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 },
  avatarSm: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  avatarSmTxt: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff' },
  moreMembers: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff', marginLeft: 2 },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginLeft: 6 },
  inviteTxt: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },

  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 14 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: Dayxo.blue, borderColor: Dayxo.blue },
  tabTxt: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.textSecondary },
  tabTxtActive: { color: '#fff' },

  body: { padding: 16 },
  empty: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, textAlign: 'center', paddingVertical: 24, lineHeight: 19 },

  expRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  expIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  expDesc: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  expMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2 },
  expMonto: { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: colors.textPrimary },

  balRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  balName: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  balValue: { fontSize: 14, fontFamily: 'Inter_700Bold' },

  sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5, marginTop: 22, marginBottom: 10 },
  settleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  settleTxt: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  settleName: { fontFamily: 'Inter_800ExtraBold', color: colors.textPrimary },
  settleMonto: { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: Dayxo.blue },

  fab: { position: 'absolute', bottom: 96, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Dayxo.blue, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
  fabTxt: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
});
