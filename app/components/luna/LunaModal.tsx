import React, { useState, useMemo } from 'react';
import {
  Modal, View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { LunaMessage, ContextType } from '../../types/luna';
import { LunaMessageBubble } from './LunaMessage';
import { LunaTyping } from './LunaTyping';
import { ContextMenu } from './ContextMenu';

function subtitle(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Empecemos bien el día ☀️';
  if (hour < 19) return '¿Cómo va todo? ⚡';
  return 'Contame cómo fue 🌙';
}

interface Props {
  visible: boolean;
  onClose: () => void;
  messages: LunaMessage[];
  isTyping: boolean;
  onSend: (text: string) => void;
  onShareContext: (type: ContextType) => void;
}

export function LunaModal({ visible, onClose, messages, isTyping, onSend, onShareContext }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [input, setInput] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  const reversed = useMemo(() => [...messages].reverse(), [messages]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    onSend(input);
    setInput('');
    setMenuVisible(false);
  };

  const handleShare = (type: ContextType) => {
    setMenuVisible(false);
    onShareContext(type);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <View style={styles.handleWrap}><View style={styles.handle} /></View>

          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={['#6C5CE7', '#E84393']}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>L</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>Luna</Text>
              <Text style={styles.subtitle}>{subtitle()}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Mensajes */}
          <FlatList
            data={reversed}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <LunaMessageBubble message={item} />}
            inverted
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={isTyping ? <LunaTyping /> : null}
          />

          {/* Menú de contexto */}
          {menuVisible && <ContextMenu onSelect={handleShare} />}

          {/* Input */}
          <View style={styles.inputBar}>
            <TouchableOpacity
              onPress={() => setMenuVisible((v) => !v)}
              style={[styles.contextBtn, menuVisible && styles.contextBtnActive]}
            >
              <Ionicons name="stats-chart" size={18} color={menuVisible ? '#fff' : colors.violet} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Contale a Luna..."
              placeholderTextColor={colors.textSecondary}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              onPress={handleSend}
              style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
              disabled={!input.trim() || isTyping}
            >
              <Ionicons name="arrow-up" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.card },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 17, fontFamily: 'Inter_700Bold' },
  name: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 1 },
  list: { paddingHorizontal: 16, paddingVertical: 12 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  contextBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.violetLight,
    alignItems: 'center', justifyContent: 'center',
  },
  contextBtnActive: { backgroundColor: colors.violet },
  input: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: 19,
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 9,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.violet,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
