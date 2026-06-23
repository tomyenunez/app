import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { Dayxo } from '../constants/dayxo';
import { AuthPanel } from '../components/auth/AuthPanel';

// Pantalla de entrada (online-only): sin sesión, la app muestra esto.
export function AuthScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <Text style={styles.logo}>Dayxo</Text>
            <Text style={styles.tagline}>Ordená tus días, hábitos y plata.</Text>
          </View>
          <AuthPanel onDone={() => {}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flexGrow: 1, justifyContent: 'center', paddingVertical: 30 },
  brand: { alignItems: 'center', marginBottom: 22, paddingHorizontal: 18 },
  logo: { fontSize: 42, fontFamily: 'Inter_800ExtraBold', color: Dayxo.orange },
  tagline: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
});
