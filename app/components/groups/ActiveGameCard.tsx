import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { ActiveGroupGame } from './types';

interface Props {
  game: ActiveGroupGame | null;
  isAdmin: boolean;
  onChooseGame: () => void;
  onChangeGame?: () => void;
}

export function ActiveGameCard({ game, isAdmin, onChooseGame, onChangeGame }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!game) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>No hay juegos activos — el admin puede iniciar uno</Text>
        {isAdmin && (
          <TouchableOpacity style={styles.chooseBtn} onPress={onChooseGame} activeOpacity={0.85}>
            <Ionicons name="game-controller" size={16} color="#fff" />
            <Text style={styles.chooseText}>Elegir juego</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.emoji}>{game.emoji}</Text>
          <Text style={styles.title} numberOfLines={1}>{game.title}</Text>
        </View>
        <Text style={styles.time}>{game.timeRemaining}</Text>
      </View>
      <Text style={styles.desc}>{game.description}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(Math.max(game.progress, 0), 100)}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{game.progressLabel}</Text>
      {isAdmin && onChangeGame && (
        <TouchableOpacity style={styles.changeBtn} onPress={onChangeGame} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Text style={styles.changeText}>Cambiar juego</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    marginTop: 16, borderRadius: 16, padding: 16,
    backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  emoji: { fontSize: 18 },
  title: { flex: 1, fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  time: { fontSize: 12, fontFamily: 'Inter_700Bold', color: Dayxo.purple },
  desc: { fontSize: 11.5, fontFamily: 'Inter_400Regular', color: colors.textSecondary, lineHeight: 16 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.grayLight, marginTop: 12, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: Dayxo.purple },
  progressLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textTertiary, marginTop: 6, textAlign: 'right' },
  changeBtn: { alignSelf: 'flex-start', marginTop: 10 },
  changeText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: Dayxo.purple },

  emptyCard: {
    marginTop: 16, borderRadius: 16, padding: 18, alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
  },
  emptyText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textSecondary, textAlign: 'center' },
  chooseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Dayxo.purple, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
  },
  chooseText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
});
