import React from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTabBar } from '../context/TabBarContext';
import { AppColors } from '../constants/colors';
import { HomeScreen } from '../screens/HomeScreen';
import { TodoScreen } from '../screens/TodoScreen';
import { HabitosScreen } from '../screens/HabitosScreen';
import { PresupuestoScreen } from '../screens/PresupuestoScreen';
import { AgendaScreen } from '../screens/AgendaScreen';
import { StatsScreen } from '../screens/StatsScreen';

// Arquitectura de navegación:
//  - Raíz: bottom tabs con la barra flotante. Rutas: Main (el pager) + las
//    pantallas ocultas (Todo, Habitos, Agenda) que se abren desde el Home.
//  - Main: pager deslizable estilo Instagram (Material Top Tabs sin barra):
//    Home | Plata | Stats lado a lado. La vista sigue al dedo; al soltar,
//    pasa de página si cruzaste ~la mitad o hubo velocidad suficiente.
const RootTab = createBottomTabNavigator();
const Pager = createMaterialTopTabNavigator();

// Botones visibles de la barra flotante: controlan la página del pager.
const BAR_BUTTONS = [
  { name: 'Home', icon: 'home-outline', accent: 'violet' },
  { name: 'Plata', icon: 'wallet-outline', accent: 'blue' },
  { name: 'Stats', icon: 'bar-chart-outline', accent: 'violet' },
] as const;

function MainPager() {
  return (
    <Pager.Navigator
      tabBar={() => null}
      screenOptions={{ swipeEnabled: true, lazy: false, animationEnabled: true }}
    >
      <Pager.Screen name="Home" component={HomeScreen} />
      <Pager.Screen name="Plata" component={PresupuestoScreen} />
      <Pager.Screen name="Stats" component={StatsScreen} />
    </Pager.Navigator>
  );
}

// Barra flotante translúcida (vidrio esmerilado): flota por encima del contenido.
// Muestra los 3 botones del pager; tocar el botón de la página activa scrollea
// arriba de todo (registro en TabBarContext).
function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';
  const { translateY, show, scrollToTop } = useTabBar();

  // Página interna enfocada del pager (solo si la ruta raíz enfocada es Main).
  const focusedRoot = state.routes[state.index];
  const innerState = focusedRoot.name === 'Main' ? (focusedRoot.state as any) : null;
  const innerName: string | null =
    focusedRoot.name === 'Main'
      ? innerState?.routes?.[innerState.index ?? 0]?.name ?? 'Home'
      : null;

  // Al cambiar de pantalla o de página, la barra siempre se muestra.
  React.useEffect(() => { show(); }, [state.index, innerName, show]);

  const onPress = (name: string) => {
    if (innerName === name) {
      // Ya estás en esa página → arriba de todo
      scrollToTop(name);
    } else {
      navigation.navigate('Main', { screen: name });
    }
  };

  return (
    <Animated.View style={[styles.wrap, { bottom: Math.max(insets.bottom, 10), transform: [{ translateY }] }]}>
      <BlurView intensity={55} tint={isDark ? 'dark' : 'light'} style={[styles.pill, { borderColor }]}>
        {BAR_BUTTONS.map(({ name, icon, accent }) => {
          const focused = innerName === name;
          const color = colors[accent];
          return (
            <TouchableOpacity key={name} style={styles.item} onPress={() => onPress(name)} activeOpacity={0.7}>
              <View style={[styles.iconWrap, focused && { backgroundColor: color + '22' }]}>
                <Ionicons name={icon as any} size={24} color={focused ? color : colors.navIcon} />
              </View>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </Animated.View>
  );
}

export function AppNavigator() {
  return (
    <RootTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <RootTab.Screen name="Main" component={MainPager} />
      <RootTab.Screen name="Todo" component={TodoScreen} />
      <RootTab.Screen name="Habitos" component={HabitosScreen} />
      <RootTab.Screen name="Agenda" component={AgendaScreen} />
    </RootTab.Navigator>
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
