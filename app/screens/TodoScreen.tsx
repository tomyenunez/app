import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { useTodos } from '../hooks/useTodos';
import { EmptyState } from '../components/shared/EmptyState';
import { Todo } from '../types';

const TAGS: { key: Todo['tag']; label: string; bg: string; color: string }[] = [
  { key: 'personal', label: 'Personal', bg: Colors.violetLight, color: Colors.violet },
  { key: 'uni', label: 'Uni', bg: Colors.greenLight, color: '#00864A' },
  { key: 'trabajo', label: 'Trabajo', bg: Colors.orangeLight, color: '#B85C2A' },
  { key: 'otro', label: 'Otro', bg: '#F0F0F0', color: '#666' },
];

function TagBadge({ tag }: { tag: Todo['tag'] }) {
  const t = TAGS.find((x) => x.key === tag)!;
  return (
    <View style={[styles.tag, { backgroundColor: t.bg }]}>
      <Text style={[styles.tagText, { color: t.color }]}>{t.label}</Text>
    </View>
  );
}

function TodoItem({ item, onToggle, onRemove }: { item: Todo; onToggle: () => void; onRemove: () => void }) {
  return (
    <View style={styles.item}>
      <TouchableOpacity onPress={onToggle} style={[styles.checkbox, item.done && styles.checkboxDone]}>
        {item.done && <Ionicons name="checkmark" size={14} color="#fff" />}
      </TouchableOpacity>
      <Text style={[styles.itemText, item.done && styles.itemTextDone]} numberOfLines={2}>
        {item.text}
      </Text>
      <TagBadge tag={item.tag} />
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
        <Ionicons name="close" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

export function TodoScreen() {
  const { todos, pending, done, add, toggle, remove } = useTodos();
  const [text, setText] = useState('');
  const [selectedTag, setSelectedTag] = useState<Todo['tag']>('personal');
  const inputRef = useRef<TextInput>(null);

  const handleAdd = async () => {
    if (!text.trim()) return;
    await add(text.trim(), selectedTag);
    setText('');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleToggle = async (id: string) => {
    await toggle(id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const allItems = [...pending, ...done];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle-outline" size={22} color={Colors.violet} />
          </View>
          <View>
            <Text style={styles.title}>Pendientes</Text>
            <Text style={styles.sub}>{pending.length} pendientes · {done.length} listos</Text>
          </View>
        </View>

        {/* Add form */}
        <View style={styles.form}>
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Nueva tarea..."
              placeholderTextColor={Colors.textSecondary}
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
            {TAGS.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setSelectedTag(t.key)}
                style={[
                  styles.tagChip,
                  { backgroundColor: t.bg },
                  selectedTag === t.key && styles.tagChipSelected,
                ]}
              >
                <Text style={[styles.tagChipText, { color: t.color }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* List */}
        {allItems.length === 0 ? (
          <EmptyState icon="checkmark-circle-outline" text="Sin tareas todavía" />
        ) : (
          <FlatList
            data={allItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TodoItem
                item={item}
                onToggle={() => handleToggle(item.id)}
                onRemove={() => remove(item.id)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </KeyboardAvoidingView>
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
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.violetLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.violet },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  form: {
    backgroundColor: Colors.card,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: Colors.grayVeryLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addBtn: {
    backgroundColor: Colors.violet,
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
  tagChipSelected: { borderColor: Colors.violet },
  tagChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  list: { padding: 14, gap: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
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
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: Colors.violet, borderColor: Colors.violet },
  itemText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
  },
  itemTextDone: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  tag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  removeBtn: { padding: 4 },
});
