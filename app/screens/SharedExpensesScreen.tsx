import React, { useMemo, useState, useEffect } from 'react';
import { Modal, View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../components/shared/AppText';
import { ModalHeader } from '../components/shared/ModalHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { Dayxo } from '../constants/dayxo';
import { formatARS } from '../utils/formatters';
import { computeBalances, groupTotal } from '../utils/splitUtils';
import { CreateSharedGroupModal } from '../components/finance/CreateSharedGroupModal';
import { SharedGroupDetailScreen } from './SharedGroupDetailScreen';
import { useGastosCompartidos } from '../hooks/useGastosCompartidos';

interface Props {
  compartidos: ReturnType<typeof useGastosCompartidos>;
  visible: boolean;
  onClose: () => void;
}

export function SharedExpensesScreen({ compartidos, visible, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');

  // Al cerrar, reseteo el estado interno (no quedar en un detalle al reabrir).
  useEffect(() => { if (!visible) { setCreateOpen(false); setDetailId(null); setJoinCode(''); } }, [visible]);

  const { groups, loading, refresh, createGroup, joinByCode, deleteGroup, removeMember, addExpense, removeExpense } = compartidos;
  const detailGroup = detailId ? groups.find((g) => g.id === detailId) ?? null : null;

  // Refrescar desde la nube cada vez que se abre (otros pueden haber cargado gastos)
  useEffect(() => { if (visible) refresh(); }, [visible, refresh]);

  const handleJoin = async () => {
    const code = joinCode.trim();
    if (code.length < 4) { Alert.alert('Gastos compartidos', 'Ingresá un código válido.'); return; }
    const res = await joinByCode(code);
    if (res.error) Alert.alert('Gastos compartidos', res.error);
    else { setJoinCode(''); Alert.alert('Gastos compartidos', '¡Te uniste al grupo! 🎉'); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>
        <ModalHeader
          title="Gastos compartidos"
          subtitle={`${groups.length} ${groups.length === 1 ? 'grupo' : 'grupos'}`}
          onClose={onClose}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {groups.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}><Ionicons name="people" size={34} color={Dayxo.blue} /></View>
            <Text style={styles.emptyTitle}>Dividí gastos con tu gente</Text>
            <Text style={styles.emptyText}>
              Creá un grupo (un asado, un viaje, el depto), cargá los gastos y Dayxo calcula quién le debe a quién.
            </Text>
          </View>
        ) : (
          groups.map((g) => {
            const total = groupTotal(g);
            const yo = computeBalances(g).find((b) => b.member.isYou);
            const saldo = yo?.balance ?? 0;
            const saldoTxt = saldo > 0 ? `Te deben ${formatARS(saldo)}` : saldo < 0 ? `Debés ${formatARS(-saldo)}` : 'Estás a mano';
            const saldoColor = saldo > 0 ? Dayxo.green : saldo < 0 ? Dayxo.coral : colors.textSecondary;
            return (
              <TouchableOpacity key={g.id} style={styles.card} activeOpacity={0.85} onPress={() => setDetailId(g.id)}>
                <LinearGradient colors={g.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardIcon}>
                  <Text style={{ fontSize: 24 }}>{g.emoji}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName} numberOfLines={1}>{g.nombre}</Text>
                  <Text style={styles.cardMeta}>{g.members.length} integrantes · {formatARS(total)}</Text>
                  <Text style={[styles.cardSaldo, { color: saldoColor }]}>{saldoTxt}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            );
          })
        )}

        {loading && groups.length === 0 && <ActivityIndicator color={Dayxo.blue} style={{ marginVertical: 12 }} />}

        <TouchableOpacity style={styles.createBtn} onPress={() => setCreateOpen(true)} activeOpacity={0.9}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createTxt}>Crear grupo</Text>
        </TouchableOpacity>

        {/* Unirse con el código que te pasaron */}
        <Text style={styles.joinLabel}>UNIRME CON CÓDIGO</Text>
        <View style={styles.joinRow}>
          <TextInput
            style={styles.joinInput}
            placeholder="Código del grupo"
            placeholderTextColor={colors.textTertiary}
            value={joinCode}
            onChangeText={(t) => setJoinCode(t.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
          />
          <TouchableOpacity style={styles.joinBtn} onPress={handleJoin}>
            <Ionicons name="enter-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        </ScrollView>
      </SafeAreaView>

      <CreateSharedGroupModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (data) => { const id = await createGroup(data); if (id) setDetailId(id); }}
      />

      {detailGroup && (
        <SharedGroupDetailScreen
          group={detailGroup}
          onBack={() => setDetailId(null)}
          onAddExpense={addExpense}
          onRemoveExpense={removeExpense}
          onDeleteGroup={deleteGroup}
          onLeaveGroup={(groupId, memberId) => { removeMember(groupId, memberId); setDetailId(null); }}
        />
      )}
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  body: { padding: 16, paddingBottom: 110 },

  emptyWrap: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Dayxo.blue + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: colors.textPrimary, textAlign: 'center' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  cardIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  cardMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2 },
  cardSaldo: { fontSize: 13, fontFamily: 'Inter_700Bold', marginTop: 4 },

  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Dayxo.blue, borderRadius: 14, paddingVertical: 15, marginTop: 8 },
  createTxt: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },

  joinLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5, marginTop: 24, marginBottom: 10 },
  joinRow: { flexDirection: 'row', gap: 8 },
  joinInput: {
    flex: 1, backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.border, letterSpacing: 2,
  },
  joinBtn: { width: 50, borderRadius: 10, backgroundColor: Dayxo.blue, alignItems: 'center', justifyContent: 'center' },
});
