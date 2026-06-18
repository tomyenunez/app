import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { useGame } from '../../context/GameContext';

export function XPBar({ onPress }: { onPress?: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { xpTotal, level } = useGame();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: level.progress, duration: 500, useNativeDriver: false }).start();
  }, [level.progress]);

  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.levelInfo}>
          <Text style={styles.levelIcon}>{level.icon}</Text>
          <Text style={styles.levelName}>Rango {level.level} · {level.name}</Text>
        </View>
        <Text style={styles.xpTotal}>{Math.round(xpTotal).toLocaleString('es-AR')} XP</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width, backgroundColor: level.color }]} />
      </View>
      {level.xpToNext > 0 && (
        <Text style={styles.toNext}>{Math.ceil(level.xpToNext).toLocaleString('es-AR')} XP para el próximo rango</Text>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrap: {
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  levelInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  levelIcon: { fontSize: 16 },
  levelName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  xpTotal: { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.textSecondary },
  track: { height: 8, backgroundColor: colors.grayLight, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  toNext: { fontSize: 10, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 4 },
});
