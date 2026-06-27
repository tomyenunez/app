import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import { AppNavigator } from './app/navigation/AppNavigator';
import { AuthScreen } from './app/screens/AuthScreen';
import { GameOverlay } from './app/components/game/GameOverlay';
import { ThemeProvider, useTheme } from './app/context/ThemeContext';
import { GameProvider } from './app/context/GameContext';
import { AuthProvider, useAuth } from './app/context/AuthContext';
import { AccessibilityProvider } from './app/context/AccessibilityContext';
import { TabBarProvider } from './app/context/TabBarContext';
import { runMigrationIfNeeded } from './app/services/migration';
import { syncAllHabitReminders } from './app/services/notificationService';
import { supabase } from './app/services/supabase';
import { Habito } from './app/types';

const navigationRef = createNavigationContainerRef();

function AppContent() {
  const { colors, isDark } = useTheme();
  const { session, loading: authLoading } = useAuth();
  const fade = useRef(new Animated.Value(1)).current;

  // Transición suave al cambiar de tema
  useEffect(() => {
    fade.setValue(0.7);
    Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [isDark]);

  // Resincronizar recordatorios de hábitos al loguear (desde la nube).
  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data } = await supabase.from('habitos').select('id, name, days, recordatorio');
      const habits = (data ?? []).map((r: any) => ({
        id: r.id, name: r.name, days: r.days ?? [], recordatorio: r.recordatorio ?? undefined,
      })) as Habito[];
      syncAllHabitReminders(habits).catch(() => {});
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Al tocar una notificación, navegar a la pantalla indicada en su data.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { screen?: string };
      if (data?.screen && navigationRef.isReady()) {
        navigationRef.navigate(data.screen as never);
      }
    });
    return () => sub.remove();
  }, []);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: colors.bg,
      card: colors.card,
      text: colors.textPrimary,
      primary: colors.violet,
      border: colors.border,
    },
  };

  return (
    <Animated.View style={{ flex: 1, opacity: fade, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {authLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.violet} />
        </View>
      ) : !session ? (
        // Online-only: sin sesión, mostramos el login
        <AuthScreen />
      ) : (
        <NavigationContainer ref={navigationRef} theme={navTheme}>
          <TabBarProvider>
            <AppNavigator />
            {/* Toasts de XP, badges y modal de subida de nivel */}
            <GameOverlay />
          </TabBarProvider>
        </NavigationContainer>
      )}
    </Animated.View>
  );
}

export default function App() {
  // Marca Dayxo: usamos Poppins en toda la app. Lo mapeamos sobre las claves
  // "Inter_*" que ya usan todos los estilos, para migrar la fuente sin tocar
  // cada componente. (Cuando se finalice la marca se pueden renombrar.)
  const [fontsLoaded] = useFonts({
    Inter_400Regular: Poppins_400Regular,
    Inter_500Medium: Poppins_500Medium,
    Inter_600SemiBold: Poppins_600SemiBold,
    Inter_700Bold: Poppins_700Bold,
    Inter_800ExtraBold: Poppins_800ExtraBold,
  });

  // Migración única @kitdeldia → @dayxo (preserva contenido, resetea XP).
  // Tiene que terminar antes de montar los providers que leen el storage.
  const [migrated, setMigrated] = useState(false);
  useEffect(() => {
    runMigrationIfNeeded().then(() => setMigrated(true));
  }, []);

  if (!fontsLoaded || !migrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AccessibilityProvider>
          <ThemeProvider>
            <AuthProvider>
              <GameProvider>
                <AppContent />
              </GameProvider>
            </AuthProvider>
          </ThemeProvider>
        </AccessibilityProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#F7F7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
