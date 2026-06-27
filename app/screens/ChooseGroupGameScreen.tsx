import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { AppText as Text } from '../components/shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { Dayxo } from '../constants/dayxo';
import { GameOptionCard } from '../components/groups/GameOptionCard';
import { DurationSelector } from '../components/groups/DurationSelector';
import { GAME_OPTIONS, GAME_DURATIONS, GroupGameType } from '../constants/gameOptions';

// Pantalla "Elegir juego grupal" (solo admin). Solo 1 juego activo a la vez.
export function ChooseGroupGameScreen({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [selected, setSelected] = useState<GroupGameType | null>(null);
  const [durationIndex, setDurationIndex] = useState(0);

  const selectedOption = GAME_OPTIONS.find((o) => o.type === selected) ?? null;
  const durations = selected ? GAME_DURATIONS[selected] : [];

  const handleSelect = (type: GroupGameType) => {
    setSelected(type);
    setDurationIndex(0);
  };

  const confirm = () => {
    Alert.alert(
      'Juego grupal',
      `"${selectedOption?.title}" se va a activar cuando esté el backend de grupos 🚧`,
      [{ text: 'Listo', onPress: onBack }],
    );
  };

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.cover]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Elegir juego</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        <Text style={styles.subtitle}>Solo puede haber un juego activo a la vez. La racha grupal corre siempre en paralelo.</Text>

        {GAME_OPTIONS.map((opt) => (
          <GameOptionCard
            key={opt.type}
            option={opt}
            selected={selected === opt.type}
            onSelect={() => handleSelect(opt.type)}
          />
        ))}

        {selectedOption && (
          <DurationSelector options={durations} selectedIndex={durationIndex} onSelect={setDurationIndex} />
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Botón de confirmación (dinámico) */}
      {selectedOption && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.confirmBtn} onPress={confirm} activeOpacity={0.85}>
            <Text style={styles.confirmText}>Activar {selectedOption.title.toLowerCase()} →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  cover: { backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  body: { padding: 16 },
  subtitle: { fontSize: 12.5, fontFamily: 'Inter_400Regular', color: colors.textSecondary, lineHeight: 18, marginBottom: 16 },
  footer: {
    padding: 16, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg,
  },
  confirmBtn: { backgroundColor: Dayxo.purple, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  confirmText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
});
