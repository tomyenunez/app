import React, { useState, useMemo, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { Familia, Todo } from '../../types';
import { TimeField } from '../shared/TimeField';

interface Props {
  visible: boolean;
  onClose: () => void;
  familias: Familia[];
  onAdd: (text: string, tag: Todo['tag'], fecha?: Date, hora?: string) => Promise<void> | void;
  editing?: Todo | null;
  onSave?: (id: string, text: string, tag: Todo['tag'], fecha?: Date, hora?: string) => Promise<void> | void;
}

export function AddTodoModal({ visible, onClose, familias, onAdd, editing, onSave }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [text, setText] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('personal');
  const [fecha, setFecha] = useState<Date | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());

  // Al abrir: precarga si es edición, o arranca limpio si es nuevo
  useEffect(() => {
    if (visible) {
      setText(editing?.text ?? '');
      setSelectedTag(editing?.tag ?? familias[0]?.id ?? 'personal');
      setFecha(editing?.fecha ? new Date(editing.fecha) : null);
      setHora(editing?.hora ?? null);
      setShowCal(false);
      setCalMonth(editing?.fecha ? new Date(editing.fecha) : new Date());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const effectiveTag = familias.some((f) => f.id === selectedTag)
    ? selectedTag
    : familias[0]?.id ?? 'personal';

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(calMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [calMonth]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    const horaArg = fecha && hora ? hora : undefined; // la hora solo viaja si hay fecha
    if (editing && onSave) {
      await onSave(editing.id, text.trim(), effectiveTag as Todo['tag'], fecha ?? undefined, horaArg);
    } else {
      await onAdd(text.trim(), effectiveTag as Todo['tag'], fecha ?? undefined, horaArg);
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.handleWrap}><View style={styles.handle} /></View>
          <View style={styles.header}>
            <View style={styles.headerSide} />
            <View style={styles.titleWrap}>
              <LinearGradient
                colors={[Dayxo.orange, Dayxo.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.titlePill}
              >
                <Text style={styles.title}>{editing ? 'Editar pendiente' : 'Nuevo pendiente'}</Text>
              </LinearGradient>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.headerSide} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>TAREA</Text>
            <TextInput
              style={styles.input}
              placeholder="¿Qué tenés que hacer?"
              placeholderTextColor={colors.textSecondary}
              value={text}
              onChangeText={setText}
              returnKeyType="done"
              autoFocus
            />

            <Text style={[styles.label, { marginTop: 16 }]}>CATEGORÍA</Text>
            <View style={styles.tagWrap}>
              {familias.map((f) => {
                const pal = colors.familia[f.color];
                const active = effectiveTag === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => { Keyboard.dismiss(); setSelectedTag(f.id); }}
                    style={[
                      styles.tagChip,
                      { backgroundColor: pal.bg },
                      active && { borderColor: pal.fg },
                    ]}
                  >
                    <Text style={[styles.tagChipText, { color: pal.fg }]}>{f.nombre}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>FECHA (OPCIONAL)</Text>
            <View style={styles.fechaRow}>
              <TouchableOpacity style={styles.fechaBtn} onPress={() => { Keyboard.dismiss(); setShowCal((s) => !s); }}>
                <Ionicons name="calendar-outline" size={18} color={colors.violet} />
                <Text style={styles.fechaBtnText}>
                  {fecha ? format(fecha, "d 'de' MMMM", { locale: es }) : 'Sin fecha'}
                </Text>
              </TouchableOpacity>
              {fecha && (
                <TouchableOpacity style={styles.fechaClear} onPress={() => { setFecha(null); setShowCal(false); setHora(null); }}>
                  <Ionicons name="close" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {showCal && (
              <View style={styles.calBox}>
                <View style={styles.monthNav}>
                  <TouchableOpacity onPress={() => setCalMonth(subMonths(calMonth, 1))} style={styles.monthBtn}>
                    <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.monthLabel}>{format(calMonth, 'MMMM yyyy', { locale: es })}</Text>
                  <TouchableOpacity onPress={() => setCalMonth(addMonths(calMonth, 1))} style={styles.monthBtn}>
                    <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.calGrid}>
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                    <Text key={d} style={styles.calDayHeader}>{d}</Text>
                  ))}
                </View>
                <View style={styles.calGrid}>
                  {calendarDays.map((day, i) => {
                    const inMonth = isSameMonth(day, calMonth);
                    const isSel = fecha ? isSameDay(day, fecha) : false;
                    const isToday = isSameDay(day, new Date());
                    return (
                      <TouchableOpacity
                        key={i}
                        onPress={() => { setFecha(day); setShowCal(false); }}
                        style={[styles.calCell, isSel && styles.calCellSelected, isToday && !isSel && styles.calCellToday]}
                      >
                        <Text style={[
                          styles.calDayNum,
                          !inMonth && styles.calDayOther,
                          isSel && styles.calDaySelected,
                        ]}>
                          {day.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* La hora solo tiene sentido junto con una fecha */}
            {fecha && (
              <>
                <Text style={[styles.label, { marginTop: 16 }]}>HORA (OPCIONAL)</Text>
                {hora === null ? (
                  <TouchableOpacity style={styles.horaAddBtn} onPress={() => { Keyboard.dismiss(); setHora('09:00'); }}>
                    <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                    <Text style={styles.horaAddText}>Agregar hora</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.horaRow}>
                    <View style={{ flex: 1 }}>
                      <TimeField value={hora} onChange={setHora} accent={colors.violet} />
                    </View>
                    <TouchableOpacity style={styles.fechaClear} onPress={() => setHora(null)}>
                      <Ionicons name="close" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.submitInline, !text.trim() && { opacity: 0.5 }]}
              disabled={!text.trim()}
            >
              <Text style={styles.addBtnText}>{editing ? 'Guardar cambios' : 'Agregar pendiente'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.card },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12,
  },
  headerSide: { width: 28, alignItems: 'flex-end', justifyContent: 'center' },
  titleWrap: { flex: 1, alignItems: 'center' },
  titlePill: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 15, overflow: 'hidden' },
  title: { fontSize: 19, fontFamily: 'Inter_800ExtraBold', color: '#fff', textAlign: 'center' },
  body: { padding: 16 },
  label: {
    fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary,
    letterSpacing: 0.5, marginBottom: 8,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.border,
  },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 2, borderColor: 'transparent',
  },
  tagChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  fechaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fechaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  fechaBtnText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  fechaClear: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.grayVeryLight,
  },
  horaAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.inputBg,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
  },
  horaAddText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  horaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calBox: {
    marginTop: 10, padding: 8,
    backgroundColor: colors.grayVeryLight, borderRadius: 12,
  },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  monthBtn: { padding: 4 },
  monthLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary, textTransform: 'capitalize' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayHeader: {
    width: `${100 / 7}%`, textAlign: 'center',
    fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.textSecondary, paddingVertical: 4,
  },
  calCell: {
    width: `${100 / 7}%`, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center', borderRadius: 999,
  },
  calCellToday: { backgroundColor: colors.violetLight },
  calCellSelected: { backgroundColor: colors.violet },
  calDayNum: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  calDayOther: { color: colors.textTertiary },
  calDaySelected: { color: '#fff', fontFamily: 'Inter_700Bold' },
  submitInline: {
    backgroundColor: colors.violet, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 24,
  },
  addBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
