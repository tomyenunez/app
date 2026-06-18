import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';

interface Props {
  value: Date;
  onChange: (d: Date) => void;
  accent?: string;
}

// Selector de fecha inline (sin dependencias nativas): botón + mini-calendario desplegable.
export function DateField({ value, onChange, accent }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tint = accent ?? colors.violet;
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(value);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const pick = (d: Date) => { onChange(d); setOpen(false); };

  return (
    <View>
      <TouchableOpacity style={styles.btn} onPress={() => { Keyboard.dismiss(); setMonth(value); setOpen((o) => !o); }}>
        <Ionicons name="calendar-outline" size={18} color={tint} />
        <Text style={styles.btnText}>{format(value, "d 'de' MMMM", { locale: es })}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      {open && (
        <View style={styles.calBox}>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => setMonth(subMonths(month, 1))} style={styles.monthBtn}>
              <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{format(month, 'MMMM yyyy', { locale: es })}</Text>
            <TouchableOpacity onPress={() => setMonth(addMonths(month, 1))} style={styles.monthBtn}>
              <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.grid}>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => <Text key={d} style={styles.dh}>{d}</Text>)}
          </View>
          <View style={styles.grid}>
            {days.map((day, i) => {
              const inMonth = isSameMonth(day, month);
              const sel = isSameDay(day, value);
              const today = isSameDay(day, new Date());
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => pick(day)}
                  style={[styles.cell, sel && { backgroundColor: tint }, today && !sel && styles.cellToday]}
                >
                  <Text style={[styles.num, !inMonth && styles.numOther, sel && styles.numSel]}>{day.getDate()}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.inputBg,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  btnText: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  calBox: { marginTop: 10, padding: 8, backgroundColor: colors.grayVeryLight, borderRadius: 12 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  monthBtn: { padding: 4 },
  monthLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary, textTransform: 'capitalize' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dh: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.textSecondary, paddingVertical: 4 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  cellToday: { backgroundColor: colors.violetLight },
  num: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  numOther: { color: colors.textTertiary },
  numSel: { color: '#fff', fontFamily: 'Inter_700Bold' },
});
