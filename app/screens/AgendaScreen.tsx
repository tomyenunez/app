import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { useAgenda } from '../hooks/useAgenda';
import { useFamilias } from '../hooks/useFamilias';
import { EmptyState } from '../components/shared/EmptyState';
import { CalendarModal } from '../components/agenda/CalendarModal';
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
});

type Styles = ReturnType<typeof createStyles>;
