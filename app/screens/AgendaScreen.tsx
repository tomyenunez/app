import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, ScrollView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay as dfnIsSameDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Colors } from '../constants/colors';
import { useAgenda } from '../hooks/useAgenda';
import { EmptyState } from '../components/shared/EmptyState';
import { Evento } from '../types';
import { formatDateLabel, isSameDay, isPast } from '../utils/dateUtils';

const TIPO_COLORS: Record<Evento['tipo'], { bg: string; border: string; badge: string }> = {
  personal: { bg: Colors.violetLight, border: Colors.violet, badge: 'PERSONAL' },
  grupo: { bg: Colors.blueLight, border: Colors.blue, badge: 'GRUPAL' },
  uni: { bg: Colors.pinkLight, border: Colors.pink, badge: 'UNI / PARCIAL' },
};

function EventCard({ evento, onRemove }: { evento: Evento; onRemove: () => void }) {
  const c = TIPO_COLORS[evento.tipo];
  return (
    <View style={[styles.eventCard, { backgroundColor: c.bg, borderLeftColor: c.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.eventTitle}>{evento.titulo}</Text>
        {evento.hora ? (
          <View style={styles.eventHoraRow}>
            <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.eventHora}>{evento.hora}</Text>
          </View>
        ) : null}
        <View style={[styles.eventBadge, { backgroundColor: c.border + '22' }]}>
          <Text style={[styles.eventBadgeText, { color: c.border }]}>{c.badge}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
        <Ionicons name="close" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

function CalendarModal({ visible, onClose, eventos, onAdd, onRemove, hasEvents, eventosForDay }: {
  visible: boolean;
  onClose: () => void;
  eventos: Evento[];
  onAdd: (titulo: string, fecha: Date, tipo: Evento['tipo'], hora: string) => void;
  onRemove: (id: string) => void;
  hasEvents: (date: Date) => boolean;
  eventosForDay: (date: Date) => Evento[];
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<Evento['tipo']>('personal');
  const [hora, setHora] = useState('');

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const dayEventos = eventosForDay(selectedDay);

  const handleAdd = () => {
    if (!titulo.trim()) return;
    onAdd(titulo.trim(), selectedDay, tipo, hora.trim());
    setTitulo(''); setHora('');
  };

  const today = new Date();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Handle */}
          <View style={styles.handleWrap}><View style={styles.handle} /></View>

          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Calendario</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Month nav */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))} style={styles.monthBtn}>
              <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </Text>
            <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} style={styles.monthBtn}>
              <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={styles.calGrid}>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
              <Text key={d} style={styles.calDayHeader}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
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
                  style={[styles.calCell, isSelected && styles.calCellSelected]}
                >
                  {dayHasEvents && !isSelected && <View style={styles.eventDot} />}
                  {dayHasEvents && isSelected && <View style={styles.eventDotWhite} />}
                  <Text style={[
                    styles.calDayNum,
                    !inMonth && styles.calDayOtherMonth,
                    isToday && !isSelected && styles.calDayToday,
                    isSelected && styles.calDaySelected,
                  ]}>
                    {day.getDate()}
                  </Text>
                  {isToday && !isSelected && <View style={styles.todayDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Day events */}
          <View style={styles.dayPanel}>
            <Text style={styles.dayPanelTitle}>
              {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
            </Text>
            {dayEventos.length === 0
              ? <Text style={styles.noEvents}>Sin eventos este día</Text>
              : dayEventos.map((e) => (
                  <View key={e.id} style={styles.dayEventRow}>
                    <View style={[styles.dayEventDot, { backgroundColor: TIPO_COLORS[e.tipo].border }]} />
                    <Text style={styles.dayEventTitle}>{e.titulo}</Text>
                    {e.hora ? <Text style={styles.dayEventHora}>{e.hora}</Text> : null}
                    <TouchableOpacity onPress={() => onRemove(e.id)}>
                      <Ionicons name="close" size={14} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))
            }
          </View>

          {/* Add form */}
          <View style={styles.addForm}>
            <TextInput
              style={styles.modalInput}
              placeholder="Título del evento"
              placeholderTextColor={Colors.textSecondary}
              value={titulo}
              onChangeText={setTitulo}
            />
            <View style={styles.tipoRow}>
              {(['personal', 'grupo', 'uni'] as Evento['tipo'][]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTipo(t)}
                  style={[
                    styles.tipoChip,
                    tipo === t && { backgroundColor: TIPO_COLORS[t].border },
                  ]}
                >
                  <Text style={[styles.tipoChipText, tipo === t && { color: '#fff' }]}>
                    {t === 'personal' ? 'Personal' : t === 'grupo' ? 'Grupal' : 'Uni'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Hora (opcional, ej: 14:30)"
              placeholderTextColor={Colors.textSecondary}
              value={hora}
              onChangeText={setHora}
            />
            <TouchableOpacity onPress={handleAdd} style={styles.addEventBtn}>
              <Text style={styles.addEventBtnText}>Agregar evento</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export function AgendaScreen() {
  const { upcomingEventos, pastEventos, add, remove, hasEvents, eventosForDay } = useAgenda();
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
          <Ionicons name="calendar-outline" size={22} color={Colors.pink} />
        </View>
        <View>
          <Text style={styles.title}>Agenda</Text>
          <Text style={styles.sub}>{upcomingEventos.length} próximos</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.calBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="calendar-outline" size={16} color={Colors.pink} />
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
              <EventCard key={e.id} evento={e} onRemove={() => remove(e.id)} />
            ))}
          </View>
        ))}

        {pastEventos.length > 0 && (
          <>
            <Text style={[styles.groupLabel, { marginHorizontal: 16 }]}>PASADOS</Text>
            {pastEventos.map((e) => (
              <EventCard key={e.id} evento={e} onRemove={() => remove(e.id)} />
            ))}
          </>
        )}
      </ScrollView>

      <CalendarModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        eventos={[...upcomingEventos, ...pastEventos]}
        onAdd={add}
        onRemove={remove}
        hasEvents={hasEvents}
        eventosForDay={eventosForDay}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.pinkLight,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.pink },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10, margin: 14 },
  calBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.grayVeryLight, borderRadius: 10, paddingVertical: 11,
    borderWidth: 1, borderColor: Colors.border,
  },
  calBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  newBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.pink, borderRadius: 10, paddingVertical: 11,
  },
  newBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  group: { marginBottom: 8 },
  groupLabel: {
    fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.textSecondary,
    letterSpacing: 0.8, marginHorizontal: 16, marginBottom: 6, marginTop: 8,
  },
  eventCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginHorizontal: 14, marginBottom: 8,
    borderRadius: 12, padding: 12,
    borderLeftWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  eventTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  eventHoraRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  eventHora: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  eventBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 6 },
  eventBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  removeBtn: { padding: 4 },
  // Modal
  modalSafe: { flex: 1, backgroundColor: Colors.card },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  monthBtn: { padding: 6 },
  monthLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, textTransform: 'capitalize' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  calDayHeader: {
    width: `${100 / 7}%`, textAlign: 'center',
    fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.textSecondary,
    paddingVertical: 6,
  },
  calCell: {
    width: `${100 / 7}%`, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, position: 'relative',
  },
  calCellSelected: { backgroundColor: Colors.violet },
  calDayNum: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  calDayOtherMonth: { color: '#CCC' },
  calDayToday: { color: Colors.violet, fontFamily: 'Inter_700Bold' },
  calDaySelected: { color: '#fff', fontFamily: 'Inter_700Bold' },
  todayDot: {
    position: 'absolute', bottom: 4,
    width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.violet,
  },
  eventDot: {
    position: 'absolute', top: 4, right: 4,
    width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.blue,
  },
  eventDotWhite: {
    position: 'absolute', top: 4, right: 4,
    width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff',
  },
  dayPanel: { margin: 14, padding: 14, backgroundColor: Colors.grayVeryLight, borderRadius: 12 },
  dayPanelTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 10, textTransform: 'capitalize' },
  noEvents: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  dayEventRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  dayEventDot: { width: 8, height: 8, borderRadius: 4 },
  dayEventTitle: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  dayEventHora: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  addForm: { margin: 14, gap: 10 },
  modalInput: {
    backgroundColor: Colors.grayVeryLight,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },
  tipoRow: { flexDirection: 'row', gap: 8 },
  tipoChip: {
    flex: 1, borderRadius: 20, paddingVertical: 8, alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  tipoChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  addEventBtn: {
    backgroundColor: Colors.pink, borderRadius: 10,
    paddingVertical: 13, alignItems: 'center',
  },
  addEventBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
