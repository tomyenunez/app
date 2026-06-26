import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';

interface Props {
  isAdmin: boolean;
  rouletteUsed: boolean; // ya se usó esta semana
  onRoulette: () => void;
  onLeave: () => void;
}

export function GroupActionsRow({ isAdmin, rouletteUsed, onRoulette, onLeave }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {isAdmin && (
        <TouchableOpacity
          style={[styles.btn, styles.rouletteBtn, rouletteUsed && styles.disabled]}
          onPress={onRoulette}
          disabled={rouletteUsed}
          activeOpacity={0.85}
        >
          <Text style={styles.rouletteText}>{rouletteUsed ? '🎲 Disponible el lunes' : '🎲 Girar ruleta'}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={[styles.btn, styles.leaveBtn]} onPress={onLeave} activeOpacity={0.85}>
        <Text style={styles.leaveText}>🚪 Salir del grupo</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginTop: 24 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  rouletteBtn: { backgroundColor: Dayxo.purple },
  rouletteText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  disabled: { opacity: 0.45 },
  leaveBtn: { borderWidth: 1.5, borderColor: colors.error + '66' },
  leaveText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.error },
});
