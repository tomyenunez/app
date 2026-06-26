import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  currentStreak: number;
  membersOpenedToday: number;
  totalMembers: number;
}

// Banner de racha grupal (gradiente naranja). Si la racha es 0, invita a empezarla.
export function GroupStreakBanner({ currentStreak, membersOpenedToday, totalMembers }: Props) {
  const active = currentStreak > 0;
  return (
    <LinearGradient colors={['#FF6B00', '#FF8C42']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
      <Text style={styles.fire}>🔥</Text>
      <View style={{ flex: 1 }}>
        {active ? (
          <>
            <Text style={styles.days}>{currentStreak} días</Text>
            <Text style={styles.label}>Racha grupal activa</Text>
          </>
        ) : (
          <Text style={styles.empty}>Empezá la racha grupal hoy</Text>
        )}
      </View>
      {active && (
        <View style={styles.chip}>
          <Text style={styles.chipText}>{membersOpenedToday}/{totalMembers} hoy ✓</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 16, marginTop: 16 },
  fire: { fontSize: 30 },
  days: { fontSize: 24, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
  label: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.9)', marginTop: 1 },
  empty: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  chip: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { fontSize: 13, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
});
