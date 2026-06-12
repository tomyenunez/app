import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { HomeScreen } from '../screens/HomeScreen';
import { TodoScreen } from '../screens/TodoScreen';
import { HabitosScreen } from '../screens/HabitosScreen';
import { PresupuestoScreen } from '../screens/PresupuestoScreen';
import { AgendaScreen } from '../screens/AgendaScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { DeudasScreen } from '../screens/DeudasScreen';

const Tab = createBottomTabNavigator();

const TAB_CONFIG = [
  { name: 'Home', icon: 'home-outline', activeColor: Colors.violet, Screen: HomeScreen },
  { name: 'Todo', icon: 'checkmark-circle-outline', activeColor: Colors.violet, Screen: TodoScreen },
  { name: 'Habitos', icon: 'flame-outline', activeColor: Colors.orange, Screen: HabitosScreen },
  { name: 'Plata', icon: 'wallet-outline', activeColor: Colors.blue, Screen: PresupuestoScreen },
  { name: 'Agenda', icon: 'calendar-outline', activeColor: Colors.pink, Screen: AgendaScreen },
  { name: 'Stats', icon: 'bar-chart-outline', activeColor: Colors.violet, Screen: StatsScreen },
  { name: 'Deudas', icon: 'cash-outline', activeColor: Colors.green, Screen: DeudasScreen },
] as const;

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const config = TAB_CONFIG.find((t) => t.name === route.name);
        const activeColor = config?.activeColor ?? Colors.violet;

        return {
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          // Deudas se accede desde la card "Entre amigos" del Home — no ocupa lugar en la barra
          tabBarItemStyle: route.name === 'Deudas' ? { display: 'none' } : undefined,
          tabBarIcon: ({ focused }) => {
            const iconName = config?.icon ?? 'home-outline';
            return (
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={iconName as any}
                  size={26}
                  color={focused ? activeColor : Colors.textPrimary}
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
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1.5,
    borderTopColor: '#E8E8E8',
    height: 60,
    paddingBottom: 0,
    paddingTop: 6,
  },
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
