import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { HomeScreen } from '../screens/HomeScreen';
import { TodoScreen } from '../screens/TodoScreen';
import { HabitosScreen } from '../screens/HabitosScreen';
import { PresupuestoScreen } from '../screens/PresupuestoScreen';
import { AgendaScreen } from '../screens/AgendaScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { DeudasScreen } from '../screens/DeudasScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

// activeColor se resuelve desde el tema en render (los acentos no cambian entre temas)
// Deudas y Profile están ocultos de la barra; se accede desde el Home.
const TAB_CONFIG = [
  { name: 'Home', icon: 'home-outline', accent: 'violet', Screen: HomeScreen },
  { name: 'Todo', icon: 'checkmark-circle-outline', accent: 'violet', Screen: TodoScreen },
  { name: 'Habitos', icon: 'flame-outline', accent: 'orange', Screen: HabitosScreen },
  { name: 'Plata', icon: 'wallet-outline', accent: 'blue', Screen: PresupuestoScreen },
  { name: 'Agenda', icon: 'calendar-outline', accent: 'pink', Screen: AgendaScreen },
  { name: 'Stats', icon: 'bar-chart-outline', accent: 'violet', Screen: StatsScreen },
  { name: 'Deudas', icon: 'cash-outline', accent: 'green', Screen: DeudasScreen },
  { name: 'Profile', icon: 'person-outline', accent: 'violet', Screen: ProfileScreen },
] as const;

const HIDDEN_TABS = ['Deudas', 'Profile'];

export function AppNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const config = TAB_CONFIG.find((t) => t.name === route.name);
        const activeColor = colors[config?.accent ?? 'violet'];

        return {
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: colors.navBg,
            borderTopWidth: 1.5,
            borderTopColor: colors.navBorder,
            height: 60,
            paddingBottom: 0,
            paddingTop: 6,
          },
          // Deudas y Profile se acceden desde el Home — no ocupan lugar en la barra
          tabBarItemStyle: HIDDEN_TABS.includes(route.name) ? { display: 'none' } : undefined,
          tabBarIcon: ({ focused }) => {
            const iconName = config?.icon ?? 'home-outline';
            return (
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={iconName as any}
                  size={26}
                  color={focused ? activeColor : colors.navIcon}
                />
                {focused && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
              </View>
            );
          },
        };
      }}
    >
      {TAB_CONFIG.map(({ name, Screen }) => (
        <Tab.Screen key={name} name={name} component={Screen} />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
