import React, { useState, useMemo, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { Familia, Todo } from '../../types';
import { AddTodoModal } from './AddTodoModal';
import { TodoHistoryModal } from '../todo/TodoHistoryModal';
import { SwipeableRow } from '../shared/SwipeableRow';

// LayoutAnimation en Android necesita este flag para animar el cierre del hueco
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  todos: Todo[];
  familias: Familia[];
  getFamilia: (id: string) => Familia;
  onAdd: (text: string, tag: Todo['tag'], fecha?: Date, hora?: string, descripcion?: string) => Promise<void> | void;
  onUpdate: (id: string, text: string, tag: Todo['tag'], fecha?: Date, hora?: string, descripcion?: string) => Promise<void> | void;
  onToggle: (id: string) => Promise<void> | void;
  onRemove: (id: string) => Promise<void> | void;
  onTogglePin: (id: string) => Promise<void> | void;
}

export function PendientesSection({ todos, familias, getFamilia, onAdd, onUpdate, onToggle, onRemove, onTogglePin }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTodo, setEditTodo] = useState<Todo | null>(null);
  const [historyVisible, setHistoryVisible] = useState(false);

  // Solo pendientes (al marcar como hecho se tacha y se desvanece); fijados arriba
  const ordered = useMemo(
    () => todos.filter((t) => !t.done).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
    [todos]
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleWrap}>
          <Ionicons name="checkmark-circle-outline" size={18} color={Dayxo.purple} />
          <Text style={styles.sectionTitle}>Pendientes</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => setHistoryVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="time-outline" size={18} color={Dayxo.purple} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addPill} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addPillText}>Agregar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {ordered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Sin pendientes — agregá el primero ✦</Text>
        </View>
      ) : (
        ordered.map((item) => {
          const fam = getFamilia(item.tag);
          return (
            <PendienteItem
              key={item.id}
              item={item}
              fam={fam}
              pal={colors.familia[fam.color]}
              styles={styles}
              colors={colors}
              onToggle={onToggle}
              onRemove={onRemove}
              onEdit={() => setEditTodo(item)}
              onPin={() => onTogglePin(item.id)}
            />
          );
        })
      )}

      <AddTodoModal
        visible={modalVisible || !!editTodo}
        onClose={() => { setModalVisible(false); setEditTodo(null); }}
        familias={familias}
        onAdd={onAdd}
        editing={editTodo}
        onSave={onUpdate}
      />

      <TodoHistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        todos={todos}
        getFamilia={getFamilia}
        onUndo={onToggle}
      />
    </View>
  );
}

type Styles = ReturnType<typeof createStyles>;

interface ItemProps {
  item: Todo;
  fam: Familia;
  pal: { bg: string; fg: string };
  styles: Styles;
  colors: AppColors;
  onToggle: (id: string) => Promise<void> | void;
  onRemove: (id: string) => Promise<void> | void;
  onEdit: () => void;
  onPin: () => void;
}

// Fila de pendiente: al tildar se marca + tacha al instante, queda ~1.6s y se
// desvanece deslizándose; recién ahí dispara onToggle (que lo saca de la lista).
function PendienteItem({ item, fam, pal, styles, colors, onToggle, onRemove, onEdit, onPin }: ItemProps) {
  const [completing, setCompleting] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const tx = useRef(new Animated.Value(0)).current;

  // Vencida = fecha + hora ya pasaron (y sigue pendiente, que es el único estado acá)
  const isOverdue = useMemo(() => {
    if (!item.fecha || !item.hora) return false;
    const dt = new Date(item.fecha);
    const [h, m] = item.hora.split(':').map(Number);
    dt.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
    return dt.getTime() < Date.now();
  }, [item.fecha, item.hora]);

  const check = () => {
    if (completing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCompleting(true);
    Animated.sequence([
      Animated.delay(1600),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 450, useNativeDriver: true }),
        Animated.timing(tx, { toValue: 60, duration: 450, useNativeDriver: true }),
      ]),
    ]).start(({ finished }) => {
      if (finished) {
        LayoutAnimation.configureNext(
          LayoutAnimation.create(260, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
        );
        onToggle(item.id);
      }
    });
  };

  return (
    <SwipeableRow
      pinned={item.pinned}
      pinColor={Dayxo.purple}
      containerStyle={styles.itemSpacing}
      onPin={onPin}
      onDelete={() => onRemove(item.id)}
    >
      <Animated.View style={[styles.item, item.pinned && styles.itemPinned, { opacity, transform: [{ translateX: tx }] }]}>
        <TouchableOpacity onPress={check} style={[styles.checkbox, completing && styles.checkboxDone]}>
          {completing && <Ionicons name="checkmark" size={14} color="#fff" />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.itemBody} activeOpacity={0.6} onPress={onEdit}>
          <Text style={[styles.itemText, completing && styles.itemTextDone]} numberOfLines={2}>
            {item.text}
          </Text>
          {!!item.descripcion && (
            <Text style={styles.descText} numberOfLines={2}>{item.descripcion}</Text>
          )}
          {item.fecha && (
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={11} color={colors.textSecondary} />
              <Text style={styles.dateText}>{format(new Date(item.fecha), 'd MMM', { locale: es })}</Text>
              {item.hora && (
                <>
                  <Text style={styles.dateDot}>·</Text>
                  <Ionicons name="time-outline" size={11} color={isOverdue ? Dayxo.coral : colors.textSecondary} />
                  <Text style={[styles.dateText, isOverdue && { color: Dayxo.coral }]}>{item.hora}</Text>
                </>
              )}
            </View>
          )}
        </TouchableOpacity>
        <View style={[styles.tag, { backgroundColor: pal.bg }]}>
          <Text style={[styles.tagText, { color: pal.fg }]}>{fam.nombre}</Text>
        </View>
      </Animated.View>
    </SwipeableRow>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  section: {
    marginTop: 18,
    marginHorizontal: 14,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: Dayxo.purple },
  addPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Dayxo.purple,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  addPillText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.violetLight,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyBox: {
    backgroundColor: colors.card, borderRadius: 12,
    paddingVertical: 22, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
  },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary },
  itemSpacing: { marginBottom: 8 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 12,
    padding: 12, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  itemPinned: { borderWidth: 1.5, borderColor: Dayxo.purple },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: Dayxo.purple, borderColor: Dayxo.purple },
  itemBody: { flex: 1 },
  itemText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.textPrimary },
  itemTextDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
  descText: { fontSize: 12.5, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  dateText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  dateDot: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginHorizontal: 1 },
  tag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  iconBtn: { padding: 4 },
});
