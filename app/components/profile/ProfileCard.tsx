import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { useGame } from '../../context/GameContext';
import { initials } from '../../utils/formatters';

// Color por defecto de los estilos; el avatar/barra se tiñen con el color del
// rango actual de forma inline (ver JSX).
const RING = Dayxo.purple;

interface Props {
  onPress?: () => void; // abre el pop-up de editar perfil / ver rangos
}

export function ProfileCard({ onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, level, xpTotal, reload } = useGame();
  const maxed = level.xpToNext <= 0;

  // Refresca XP/nivel cada vez que se enfoca la pantalla (evita que el nivel quede viejo)
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  return (
    <View style={styles.card}>
      {/* Avatar con borde del rango + badge — tappable: abre editar perfil */}
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.avatarWrap}>
        <View style={[styles.avatarRing, { borderColor: level.color }]}>
          <View style={[styles.avatar, { backgroundColor: profile.avatarColor }]}>
            <Text style={styles.avatarText}>{initials(profile.username)}</Text>
          </View>
        </View>
        <View style={[styles.levelBadge, { backgroundColor: level.color }]}>
          <Text style={styles.levelBadgeText}>{level.icon}</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.name}>{profile.username}</Text>
      <Text style={styles.phrase}>{level.icon} {level.name}{level.isExclusive ? ' · exclusivo' : ''}</Text>

      <View style={styles.ptsRow}>
        <Text style={styles.star}>⭐</Text>
        <Text style={styles.ptsText}>
          {Math.round(xpTotal).toLocaleString('es-AR')} XP
        </Text>
      </View>

      {/* Barra de XP — muestra el rango actual y el progreso hacia el siguiente */}
      <View style={styles.xpHead}>
        <Text style={styles.xpLevel}>{maxed ? 'Rango máximo' : `Rango ${level.level} · ${level.name}`}</Text>
        <Text style={[styles.xpPct, { color: level.color }]}>{level.progress}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${level.progress}%`, backgroundColor: level.color }]} />
      </View>
      <Text style={styles.xpRemaining}>
        {maxed
          ? '¡Llegaste al rango máximo!'
          : `${Math.ceil(level.xpToNext).toLocaleString('es-AR')} XP para subir de rango`}
      </Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    marginHorizontal: 14,
    marginTop: 8,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrap: { width: 92, height: 92, marginBottom: 14 },
  avatarRing: {
    width: 92, height: 92, borderRadius: 46,
    borderWidth: 3, borderColor: RING,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
  levelBadge: {
    position: 'absolute', bottom: -2, right: -2,
    minWidth: 26, height: 26, borderRadius: 13, paddingHorizontal: 5,
    backgroundColor: RING, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.card,
  },
  levelBadgeText: { fontSize: 14 },
  name: { fontSize: 24, fontFamily: 'Inter_800ExtraBold', color: colors.textPrimary },
  phrase: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 4 },
  ptsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  star: { fontSize: 15 },
  ptsText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  xpHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 8 },
  xpLevel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },
  xpPct: { fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: RING },
  track: { height: 10, backgroundColor: colors.grayLight, borderRadius: 5, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5, backgroundColor: RING },
  xpRemaining: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 8 },
});
