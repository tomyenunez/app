import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { GameOption } from '../../constants/gameOptions';

const REWARD_COLOR = '#FFD93D';

interface Props {
  option: GameOption;
  selected: boolean;
  onSelect: () => void;
}

// Card seleccionable (radio) de un tipo de juego grupal.
export function GameOptionCard({ option, selected, onSelect }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onSelect}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={[styles.iconBox, { backgroundColor: option.accentColor + '2E' }]}>
        <Text style={styles.emoji}>{option.emoji}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title}>{option.title}</Text>
        <Text style={styles.desc} numberOfLines={2}>{option.description}</Text>
        <View style={styles.tags}>
          <View style={[styles.tag, { backgroundColor: option.accentColor + '22' }]}>
            <Text style={[styles.tagText, { color: option.accentColor }]}>{option.durationTag}</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: 'rgba(255,217,61,0.15)' }]}>
            <Text style={[styles.tagText, { color: REWARD_COLOR }]}>{option.rewardTag}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1.5, borderColor: colors.border,
  },
  cardSelected: { borderColor: Dayxo.purple, backgroundColor: 'rgba(124,58,237,0.1)' },
  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22 },
  info: { flex: 1 },
  title: { fontSize: 13.5, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  desc: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2, lineHeight: 15 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 8 },
  tag: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  tagText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOn: { borderColor: Dayxo.purple, backgroundColor: Dayxo.purple },
  radioDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
});
