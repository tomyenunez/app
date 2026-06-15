import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { useTodos } from '../hooks/useTodos';
import { useFamilias } from '../hooks/useFamilias';
import { EmptyState } from '../components/shared/EmptyState';
import { FamiliasModal } from '../components/shared/FamiliasModal';
import { Todo, Familia } from '../types';

function TagBadge({ familia, styles, colors }: { familia: Familia; styles: Styles; colors: AppColors }) {
  const pal = colors.familia[familia.color];
  return (
    <View style={[styles.tag, { backgroundColor: pal.bg }]}>
      <Text style={[styles.tagText, { color: pal.fg }]}>{familia.nombre}</Text>
    </View>
  );
}

export function TodoScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { todos, pending, done, add, toggle, remove } = useTodos();
  const { familias, add: addFamilia, update: updateFamilia, remove: removeFamilia, getFamilia } = useFamilias();
  const [text, setText] = useState('');
  const [selectedTag, setSelectedTag] = useState('personal');
  const [filter, setFilter] = useState<string>('all');
  const [familiasVisible, setFamiliasVisible] = useState(false);

  const effectiveTag = familias.some((f) => f.id === selectedTag)
    ? selectedTag
    : familias[0]?.id ?? 'personal';

  const handleAdd = async () => {
    if (!text.trim()) return;
    await add(text.trim(), effectiveTag as Todo['tag']);
    setText('');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleToggle = async (id: string) => {
    await toggle(id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const filtered = useMemo(() => {
    const base = filter === 'all' ? todos : todos.filter((t) => t.tag === filter);
    return [...base.filter((t) => !t.done), ...base.filter((t) => t.done)];
  }, [todos, filter]);

  const pendingCount = filter === 'all' ? pending.length : filtered.filter((t) => !t.done).length;
  const doneCount = filter === 'all' ? done.length : filtered.filter((t) => t.done).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle-outline" size={22} color={colors.violet} />
          </View>
          <View>
            <Text style={styles.title}>Pendientes</Text>
            <Text style={styles.sub}>{pendingCount} pendientes · {doneCount} listos</Text>
          </View>
        </View>

        {/* Filtros por familia */}
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <TouchableOpacity
              onPress={() => setFilter('all')}
              style={[styles.filterChip, filter === 'all' && styles.filterChipAll]}
            >
              <Text style={[styles.filterChipText, filter === 'all' && { color: colors.chipDarkText }]}>Todas</Text>
            </TouchableOpacity>
            {familias.map((f) => {
              const pal = colors.familia[f.color];
              const active = filter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setFilter(active ? 'all' : f.id)}
                  style={[
                    styles.filterChip,
                    { backgroundColor: pal.bg },
                    active && { borderWidth: 2, borderColor: pal.fg },
                  ]}
                >
                  <Text style={[styles.filterChipText, { color: pal.fg }]}>{f.nombre}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity onPress={() => setFamiliasVisible(true)} style={styles.manageChip}>
              <Ionicons name="settings-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.manageChipText}>Editar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Add form */}
        <View style={styles.form}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Nueva tarea..."
              placeholderTextColor={colors.textSecondary}
              value={text}
              onChangeText={setText}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={handleAdd} style={styles.addBtn}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {familias.map((f) => {
              const pal = colors.familia[f.color];
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setSelectedTag(f.id)}
                  style={[
                    styles.tagChip,
                    { backgroundColor: pal.bg },
                    effectiveTag === f.id && { borderColor: pal.fg },
                  ]}
                >
                  <Text style={[styles.tagChipText, { color: pal.fg }]}>{f.nombre}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="checkmark-circle-outline"
            text={filter === 'all' ? 'Sin tareas todavía' : 'Sin tareas en esta familia'}
          />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <TouchableOpacity
                  onPress={() => handleToggle(item.id)}
                  style={[styles.checkbox, item.done && styles.checkboxDone]}
                >
                  {item.done && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
                <Text style={[styles.itemText, item.done && styles.itemTextDone]} numberOfLines={2}>
                  {item.text}
                </Text>
                <TagBadge familia={getFamilia(item.tag)} styles={styles} colors={colors} />
                <TouchableOpacity onPress={() => remove(item.id)} style={styles.removeBtn}>
                  <Ionicons name="close" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

        <FamiliasModal
          visible={familiasVisible}
          onClose={() => setFamiliasVisible(false)}
          familias={familias}
          onAdd={addFamilia}
          onUpdate={updateFamilia}
          onRemove={removeFamilia}
        />
      </KeyboardAvoidingView>
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
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.violetLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.violet },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2 },
  filterBar: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterRow: { paddingHorizontal: 14, paddingBottom: 10, gap: 8, alignItems: 'center' },
  filterChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.grayVeryLight,
  },
  filterChipAll: { backgroundColor: colors.chipDark },
  filterChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  manageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
  },
  manageChipText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  form: {
    backgroundColor: colors.card,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    backgroundColor: colors.violet,
    borderRadius: 10,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tagChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  list: { padding: 14, gap: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.violet, borderColor: colors.violet },
  itemText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
  itemTextDone: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  tag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  removeBtn: { padding: 4 },
});

type Styles = ReturnType<typeof createStyles>;
