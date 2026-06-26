import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';

// Input + botón para unirse a un grupo por código (mismo patrón que "Agregar amigo").
export function JoinGroupRow({ onJoin }: { onJoin: (code: string) => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [code, setCode] = useState('');

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>UNIRME A UN GRUPO</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Código del grupo"
          placeholderTextColor={colors.textTertiary}
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={12}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => onJoin(code.trim())}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrap: { marginTop: 24 },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1, backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
    letterSpacing: 2,
  },
  searchBtn: { width: 50, borderRadius: 10, backgroundColor: Dayxo.purple, alignItems: 'center', justifyContent: 'center' },
});
