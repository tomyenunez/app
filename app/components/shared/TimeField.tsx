import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';

interface Props {
  value: string; // "HH:MM" en 24h
  onChange: (v: string) => void;
  accent?: string;
}

// Selector de hora con steppers (sin dependencias nativas). Minutos de a 5.
export function TimeField({ value, onChange, accent }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const ac = accent ?? colors.orange;

  const [hStr, mStr] = (value || '09:00').split(':');
  const h = Number.isFinite(parseInt(hStr, 10)) ? parseInt(hStr, 10) : 9;
  const m = Number.isFinite(parseInt(mStr, 10)) ? parseInt(mStr, 10) : 0;

  const set = (nh: number, nm: number) => {
    const hh = ((nh % 24) + 24) % 24;
    const mm = ((nm % 60) + 60) % 60;
    onChange(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <View style={styles.wrap}>
      <Stepper value={pad(h)} label="hora" accent={ac} styles={styles}
        onUp={() => set(h + 1, m)} onDown={() => set(h - 1, m)} />
      <Text style={styles.colon}>:</Text>
      <Stepper value={pad(m)} label="min" accent={ac} styles={styles}
        onUp={() => set(h, m + 5)} onDown={() => set(h, m - 5)} />
    </View>
  );
}

function Stepper({ value, label, accent, styles, onUp, onDown }: {
  value: string; label: string; accent: string; styles: Styles; onUp: () => void; onDown: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity onPress={onUp} style={styles.arrowBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="chevron-up" size={20} color={accent} />
      </TouchableOpacity>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.unit}>{label}</Text>
      <TouchableOpacity onPress={onDown} style={styles.arrowBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="chevron-down" size={20} color={accent} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.inputBg, borderRadius: 12, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  stepper: { alignItems: 'center', minWidth: 64 },
  arrowBtn: { padding: 2 },
  value: { fontSize: 32, fontFamily: 'Inter_800ExtraBold', lineHeight: 38 },
  unit: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary, marginTop: -2, marginBottom: 2 },
  colon: { fontSize: 30, fontFamily: 'Inter_800ExtraBold', color: colors.textSecondary, marginBottom: 14 },
});

type Styles = ReturnType<typeof createStyles>;
