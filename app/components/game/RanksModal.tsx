import React, { useMemo, useRef, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { useGame } from '../../context/GameContext';
import { RANKS } from '../../constants/ranks';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function RanksModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { xpTotal, level } = useGame();
  const xp = Math.round(xpTotal);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>
        <View style={styles.header}>
          <Text style={styles.title}>Rangos</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          {/* Hero del rango actual */}
          <LinearGradient
            colors={[Dayxo.orange, Dayxo.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={[styles.heroGem, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
              <Text style={styles.heroGemIcon}>{level.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroSmall}>TU RANGO</Text>
              <Text style={styles.heroName}>{level.name}</Text>
              <Text style={styles.heroXp}>{xp.toLocaleString('es-AR')} XP</Text>
            </View>
          </LinearGradient>

          {/* Barra de progreso al próximo rango */}
          {level.xpToNext > 0 ? (
            <View style={styles.progressBox}>
              <View style={styles.progressHead}>
                <Text style={styles.progressLabel}>Próximo rango</Text>
                <Text style={[styles.progressPct, { color: level.color }]}>{level.progress}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${level.progress}%`, backgroundColor: level.color }]} />
              </View>
              <Text style={styles.progressSub}>
                Faltan {Math.ceil(level.xpToNext).toLocaleString('es-AR')} XP
              </Text>
            </View>
          ) : (
            <View style={styles.progressBox}>
              <Text style={[styles.progressSub, { textAlign: 'center' }]}>🏆 Llegaste al rango máximo</Text>
            </View>
          )}

          {/* Escalera de rangos */}
          <Text style={styles.sectionLabel}>LOS 10 RANGOS</Text>
          <View style={styles.ladder}>
            {[...RANKS].reverse().map((r, i, arr) => {
              const unlocked = xp >= r.minXP;
              const isCurrent = r.level === level.level;
              const faltan = r.minXP - xp;
              const last = i === arr.length - 1;
              return (
                <View key={r.level} style={styles.rankRow}>
                  {/* Columna izquierda: gema + línea conectora */}
                  <View style={styles.gemCol}>
                    <RankGem rank={r} unlocked={unlocked} isCurrent={isCurrent} />
                    {!last && <View style={[styles.connector, unlocked && { backgroundColor: r.color }]} />}
                  </View>

                  {/* Card del rango */}
                  <View
                    style={[
                      styles.rankCard,
                      { opacity: unlocked ? 1 : 0.55 },
                      isCurrent && { borderColor: r.color, borderWidth: 2, shadowColor: r.color, shadowOpacity: 0.35 },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.rankNameRow}>
                        <Text style={[styles.rankName, { color: unlocked ? r.color : colors.textSecondary }]}>{r.name}</Text>
                        {r.isExclusive && (
                          <View style={styles.exclTag}>
                            <Text style={styles.exclText}>★ Exclusivo</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.rankXp}>Desde {r.minXP.toLocaleString('es-AR')} XP</Text>
                    </View>

                    {/* Estado a la derecha */}
                    {isCurrent ? (
                      <View style={[styles.statePill, { backgroundColor: r.color }]}>
                        <Text style={styles.statePillText}>Actual</Text>
                      </View>
                    ) : unlocked ? (
                      <Ionicons name="checkmark-circle" size={22} color={Dayxo.green} />
                    ) : (
                      <View style={styles.lockedState}>
                        <Ionicons name="lock-closed" size={13} color={colors.textSecondary} />
                        <Text style={styles.lockedText}>{faltan.toLocaleString('es-AR')}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// Gema circular. Si es el rango actual, late suavemente.
function RankGem({ rank, unlocked, isCurrent }: {
  rank: typeof RANKS[number]; unlocked: boolean; isCurrent: boolean;
}) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isCurrent) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isCurrent]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <Animated.View
      style={[
        gemStyles.gem,
        {
          backgroundColor: rank.bgColor,
          borderColor: unlocked ? rank.color : '#C9C9CF',
          transform: [{ scale: isCurrent ? scale : 1 }],
        },
        isCurrent && { shadowColor: rank.color, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 },
      ]}
    >
      <Text style={[gemStyles.gemIcon, !unlocked && { opacity: 0.6 }]}>{rank.icon}</Text>
    </Animated.View>
  );
}

const gemStyles = StyleSheet.create({
  gem: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
  },
  gemIcon: { fontSize: 22 },
});

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  body: { padding: 16, paddingBottom: 32 },
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderRadius: 20, padding: 18,
  },
  heroGem: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  heroGemIcon: { fontSize: 34 },
  heroSmall: { fontSize: 11, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.85)', letterSpacing: 1.5 },
  heroName: { fontSize: 26, fontFamily: 'Inter_800ExtraBold', color: '#fff', marginTop: 2 },
  heroXp: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  progressBox: {
    backgroundColor: colors.card, borderRadius: 16, padding: 14, marginTop: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },
  progressPct: { fontSize: 14, fontFamily: 'Inter_800ExtraBold' },
  track: { height: 10, backgroundColor: colors.grayLight, borderRadius: 5, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  progressSub: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginTop: 8 },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary,
    letterSpacing: 1, marginTop: 22, marginBottom: 12, marginLeft: 4,
  },
  ladder: {},
  rankRow: { flexDirection: 'row', gap: 12 },
  gemCol: { alignItems: 'center', width: 46 },
  connector: { width: 3, flex: 1, backgroundColor: colors.border, marginVertical: 2, borderRadius: 2 },
  rankCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  rankNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankName: { fontSize: 16, fontFamily: 'Inter_800ExtraBold' },
  exclTag: { backgroundColor: colors.yellowLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  exclText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#B8860B' },
  rankXp: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginTop: 3 },
  statePill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  statePillText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },
  lockedState: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  lockedText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },
});
