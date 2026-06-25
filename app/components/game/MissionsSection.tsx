import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { useMissions } from '../../hooks/useMissions';
import { Mission } from '../../types/game';

function MissionCard({ mission, styles, colors }: { mission: Mission; styles: Styles; colors: AppColors }) {
  return (
    <View style={[styles.card, mission.completed && styles.cardDone]}>
      <View style={styles.row}>
        <View style={[styles.check, mission.completed && { backgroundColor: colors.green, borderColor: colors.green }]}>
          {mission.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
        </View>
        <Text style={[styles.text, mission.completed && styles.textDone]} numberOfLines={2}>
          {mission.text}
        </Text>
        <Text style={[styles.xp, mission.completed && { color: colors.green }]}>+{mission.xp}</Text>
      </View>
      {!mission.completed && (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${mission.progress}%` }]} />
        </View>
      )}
    </View>
  );
}

export function MissionsSection() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const missions = useMissions();

  if (missions.length === 0) return null;

  const daily = missions.filter((m) => m.type === 'daily');
  const weekly = missions.filter((m) => m.type === 'weekly');

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>🎯 Misiones de hoy</Text>
      {daily.map((m) => <MissionCard key={m.id} mission={m} styles={styles} colors={colors} />)}
      <Text style={[styles.heading, { marginTop: 14 }]}>📆 Esta semana</Text>
      {weekly.map((m) => <MissionCard key={m.id} mission={m} styles={styles} colors={colors} />)}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrap: { marginHorizontal: 14, marginTop: 18 },
  heading: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.textPrimary, marginBottom: 8 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardDone: { backgroundColor: colors.greenLight },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  check: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 2, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  text: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  textDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
  xp: { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.violet },
  track: { height: 5, backgroundColor: colors.grayVeryLight, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  fill: { height: 5, backgroundColor: colors.violet, borderRadius: 3 },
});

type Styles = ReturnType<typeof createStyles>;
