import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { HomeScreen } from '../screens/HomeScreen';
import { TodoScreen } from '../screens/TodoScreen';
import { HabitosScreen } from '../screens/HabitosScreen';
import { PresupuestoScreen } from '../screens/PresupuestoScreen';
import { AgendaScreen } from '../screens/AgendaScreen';
import { StatsScreen } from '../screens/StatsScreen';

const Tab = createBottomTabNavigator();

// Todo, Habitos y Agenda están ocultos de la barra; se accede desde el Home.
const TAB_CONFIG = [
  { name: 'Home', icon: 'home-outline', accent: 'violet', Screen: HomeScreen },
  { name: 'Todo', icon: 'checkmark-circle-outline', accent: 'violet', Screen: TodoScreen },
  { name: 'Habitos', icon: 'flame-outline', accent: 'orange', Screen: HabitosScreen },
  { name: 'Plata', icon: 'wallet-outline', accent: 'blue', Screen: PresupuestoScreen },
  { name: 'Agenda', icon: 'calendar-outline', accent: 'pink', Screen: AgendaScreen },
  { name: 'Stats', icon: 'bar-chart-outline', accent: 'violet', Screen: StatsScreen },
] as const;

const HIDDEN_TABS = ['Todo', 'Habitos', 'Agenda'];

// Barra flotante translúcida (vidrio esmerilado, estilo Instagram): flota por encima
// del contenido y deja ver el fondo borroso a través de ella.
function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) }]}>
      <BlurView intensity={55} tint={isDark ? 'dark' : 'light'} style={[styles.pill, { borderColor }]}>
        {state.routes.map((route) => {
          if (HIDDEN_TABS.includes(route.name)) return null;
          const index = state.routes.findIndex((r) => r.key === route.key);
          const focused = state.index === index;
          const config = TAB_CONFIG.find((t) => t.name === route.name);
          const accent = colors[config?.accent ?? 'violet'];

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity key={route.key} style={styles.item} onPress={onPress} activeOpacity={0.7}>
              <View style={[styles.iconWrap, focused && { backgroundColor: accent + '22' }]}>
                <Ionicons
                  name={(config?.icon ?? 'home-outline') as any}
                  size={24}
                  color={focused ? accent : colors.navIcon}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      {TAB_CONFIG.map(({ name, Screen }) => (
        <Tab.Screen key={name} name={name} component={Screen} />
      ))}
    </Tab.Navigator>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  pill: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 34,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
  },
  item: { flex: 1, alignItems: 'center' },
  iconWrap: {
    width: 54,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
