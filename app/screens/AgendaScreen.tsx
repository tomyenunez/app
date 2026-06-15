import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Modal, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay as dfnIsSameDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { useAgenda } from '../hooks/useAgenda';
import { useFamilias } from '../hooks/useFamilias';
import { EmptyState } from '../components/shared/EmptyState';
import { Evento, Familia } from '../types';
import { formatDateLabel } from '../utils/dateUtils';

function EventCard({ evento, familia, onRemove, styles, colors }: {
  evento: Evento; familia: Familia; onRemove: () => void; styles: Styles; colors: AppColors;
}) {
  const pal = colors.familia[familia.color];
  return (
    <View style={[styles.eventCard, { backgroundColor: pal.bg, borderLeftColor: pal.fg }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.eventTitle}>{evento.titulo}</Text>
        {evento.hora ? (
          <View style={styles.eventHoraRow}>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.eventHora}>{evento.hora}</Text>
          </View>
        ) : null}
        <View style={[styles.eventBadge, { backgroundColor: pal.fg + '22' }]}>
          <Text style={[styles.eventBadgeText, { color: pal.fg }]}>
            {familia.nombre.toUpperCase()}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
        <Ionicons name="close" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

function CalendarModal({ visible, onClose, familias, getFamilia, onAdd, onRemove, hasEvents, eventosForDay, styles, colors }: {
  visible: boolean;
  onClose: () => void;
  familias: Familia[];
  getFamilia: (id: string) => Familia;
  onAdd: (titulo: string, fecha: Date, tipo: string, hora: string) => void;
  onRemove: (id: string) => void;
  hasEvents: (date: Date) => boolean;
  eventosForDay: (date: Date) => Evento[];
  styles: Styles;
  colors: AppColors;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('personal');
  const [hora, setHora] = useState('');
  const [justAdded, setJustAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (addedTimer.current) clearTimeout(addedTimer.current);
  }, []);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const dayEventos = eventosForDay(selectedDay);

  const effectiveTipo = familias.some((f) => f.id === tipo)
    ? tipo
    : familias[0]?.id ?? 'personal';

  const handleAdd = async () => {
    if (!titulo.trim()) return;
    onAdd(titulo.trim(), selectedDay, effectiveTipo, hora.trim());
    setTitulo(''); setHora('');
    setJustAdded(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setJustAdded(false), 1800);
  };

  const today = new Date();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.handleWrap}><View style={styles.handle} /></View>

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Calendario</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))} style={styles.monthBtn}>
              <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </Text>
            <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} style={styles.monthBtn}>
              <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.calGrid}>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
              <Text key={d} style={styles.calDayHeader}>{d}</Text>
            ))}
          </View>

          <View style={styles.calGrid}>
            {calendarDays.map((day, i) => {
              const inMonth = isSameMonth(day, currentMonth);
              const isToday = dfnIsSameDay(day, today);
              const isSelected = dfnIsSameDay(day, selectedDay);
              const dayHasEvents = hasEvents(day);

              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => setSelectedDay(day)}
                  style={[
                    styles.calCell,
                    isToday && !isSelected && styles.calCellToday,
                    isSelected && styles.calCellSelected,
                  ]}
                >
                  {dayHasEvents && !isSelected && <View style={styles.eventDot} />}
                  {dayHasEvents && isSelected && <View style={styles.eventDotWhite} />}
                  <Text style={[
                    styles.calDayNum,
                    !inMonth && styles.calDayOtherMonth,
                    isToday && styles.calDayToday,
                    isSelected && styles.calDaySelected,
                  ]}>
                    {day.getDate()}
                  </Text>
                  {isToday && !isSelected && <Text style={styles.todayLabel}>HOY</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.dayPanel}>
            <Text style={styles.dayPanelTitle}>
              {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
            </Text>
            {dayEventos.length === 0
              ? <Text style={styles.noEvents}>Sin eventos este día</Text>
              : dayEventos.map((e) => {
                  const fam = getFamilia(e.tipo);
                  return (
                    <View key={e.id} style={styles.dayEventRow}>
                      <View style={[styles.dayEventDot, { backgroundColor: colors.familia[fam.color].fg }]} />
                      <Text style={styles.dayEventTitle}>{e.titulo}</Text>
                      {e.hora ? <Text style={styles.dayEventHora}>{e.hora}</Text> : null}
                      <TouchableOpacity onPress={() => onRemove(e.id)}>
                        <Ionicons name="close" size={14} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  );
                })
            }
          </View>

          <View style={styles.addForm}>
            <TextInput
              style={styles.modalInput}
              placeholder="Título del evento"
              placeholderTextColor={colors.textSecondary}
              value={titulo}
              onChangeText={setTitulo}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tipoRow}>
                {familias.map((f) => {
                  const pal = colors.familia[f.color];
                  const active = effectiveTipo === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => setTipo(f.id)}
                      style={[styles.tipoChip, { backgroundColor: active ? pal.fg : pal.bg }]}
                    >
                      <Text style={[styles.tipoChipText, { color: active ? '#fff' : pal.fg }]}>
                        {f.nombre}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <TextInput
              style={styles.modalInput}
              placeholder="Hora (opcional, ej: 14:30)"
              placeholderTextColor={colors.textSecondary}
              value={hora}
              onChangeText={setHora}
            />
            <TouchableOpacity
              onPress={handleAdd}
              style={[styles.addEventBtn, justAdded && styles.addEventBtnSuccess]}
              disabled={justAdded}
            >
              <Text style={styles.addEventBtnText}>
                {justAdded ? '✓ ¡Evento agregado!' : 'Agregar evento'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export function AgendaScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { upcomingEventos, pastEventos, add, remove, hasEvents, eventosForDay } = useAgenda();
  const { familias, getFamilia } = useFamilias();
  const [modalVisible, setModalVisible] = useState(false);

  const groupedUpcoming = useMemo(() => {
    const groups: { date: string; eventos: Evento[] }[] = [];
    const map = new Map<string, Evento[]>();
    upcomingEventos.forEach((e) => {
      const key = e.fecha.split('T')[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    map.forEach((evts, key) => groups.push({ date: key, eventos: evts }));
    return groups.sort((a, b) => a.date.localeCompare(b.date));
  }, [upcomingEventos]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="calendar-outline" size={22} color={colors.pink} />
        </View>
        <View>
          <Text style={styles.title}>Agenda</Text>
          <Text style={styles.sub}>{upcomingEventos.length} próximos</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.calBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="calendar-outline" size={16} color={colors.pink} />
          <Text style={styles.calBtnText}>Ver calendario</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.newBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.newBtnText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {groupedUpcoming.length === 0 && pastEventos.length === 0 && (
          <EmptyState icon="calendar-outline" text="Sin eventos próximos" />
        )}
        {groupedUpcoming.map(({ date, eventos }) => (
          <View key={date} style={styles.group}>
            <Text style={styles.groupLabel}>
              {formatDateLabel(new Date(date + 'T12:00:00'))}
            </Text>
            {eventos.map((e) => (
              <EventCard key={e.id} evento={e} familia={getFamilia(e.tipo)} onRemove={() => remove(e.id)} styles={styles} colors={colors} />
            ))}
          </View>
        ))}

        {pastEventos.length > 0 && (
          <>
            <Text style={[styles.groupLabel, { marginHorizontal: 16 }]}>PASADOS</Text>
            {pastEventos.map((e) => (
              <EventCard key={e.id} evento={e} familia={getFamilia(e.tipo)} onRemove={() => remove(e.id)} styles={styles} colors={colors} />
            ))}
          </>
        )}
      </ScrollView>

      <CalendarModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        familias={familias}
        getFamilia={getFamilia}
        onAdd={add}
        onRemove={remove}
        hasEvents={hasEvents}
        eventosForDay={eventosForDay}
        styles={styles}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.pinkLight,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.pink },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10, margin: 14 },
  calBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.grayVeryLight, borderRadius: 10, paddingVertical: 11,
    borderWidth: 1, borderColor: colors.border,
  },
  calBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  newBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.pink, borderRadius: 10, paddingVertical: 11,
  },
  newBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  group: { marginBottom: 8 },
  groupLabel: {
    fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary,
    letterSpacing: 0.8, marginHorizontal: 16, marginBottom: 6, marginTop: 8,
  },
  eventCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginHorizontal: 14, marginBottom: 8,
    borderRadius: 12, padding: 12,
    borderLeftWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  eventTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  eventHoraRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  eventHora: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary },
  eventBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 6 },
  eventBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  removeBtn: { padding: 4 },
  modalSafe: { flex: 1, backgroundColor: colors.card },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  monthBtn: { padding: 6 },
  monthLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary, textTransform: 'capitalize' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  calDayHeader: {
    width: `${100 / 7}%`, textAlign: 'center',
    fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary,
    paddingVertical: 6,
  },
  calCell: {
    width: `${100 / 7}%`, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 999, position: 'relative',
  },
  calCellToday: { backgroundColor: colors.violetLight },
  calCellSelected: { backgroundColor: colors.violet },
  calDayNum: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  calDayOtherMonth: { color: colors.textTertiary },
  calDayToday: { color: colors.violet, fontFamily: 'Inter_800ExtraBold', fontSize: 18 },
  calDaySelected: { color: '#fff', fontFamily: 'Inter_700Bold' },
  todayLabel: {
    position: 'absolute', bottom: 3,
    fontSize: 7, fontFamily: 'Inter_800ExtraBold', color: colors.violet, letterSpacing: 0.5,
  },
  eventDot: {
    position: 'absolute', top: 4, right: 4,
    width: 5, height: 5, borderRadius: 3, backgroundColor: colors.blue,
  },
  eventDotWhite: {
    position: 'absolute', top: 4, right: 4,
    width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff',
  },
  dayPanel: { margin: 14, padding: 14, backgroundColor: colors.grayVeryLight, borderRadius: 12 },
  dayPanelTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary, marginBottom: 10, textTransform: 'capitalize' },
  noEvents: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary },
  dayEventRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  dayEventDot: { width: 8, height: 8, borderRadius: 4 },
  dayEventTitle: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  dayEventHora: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary },
  addForm: { margin: 14, gap: 10 },
  modalInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.border,
  },
  tipoRow: { flexDirection: 'row', gap: 8 },
  tipoChip: {
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center',
  },
  tipoChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  addEventBtn: {
    backgroundColor: colors.pink, borderRadius: 10,
    paddingVertical: 13, alignItems: 'center',
  },
  addEventBtnSuccess: { backgroundColor: colors.green },
  addEventBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});

type Styles = ReturnType<typeof createStyles>;
