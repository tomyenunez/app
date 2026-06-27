import React, { createContext, useContext, useRef, useCallback } from 'react';
import { Animated, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

// Controla la visibilidad de la barra flotante según el scroll:
// al deslizar el dedo hacia arriba (scrolleando hacia abajo) la barra se esconde;
// al deslizar hacia abajo (subiendo) vuelve a aparecer. Un único Animated.Value
// compartido entre la barra (que lo aplica como translateY) y las pantallas
// (que reportan su scroll con `handleScroll`).
interface TabBarCtx {
  translateY: Animated.Value;
  handleScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  // Para listas (DraggableFlatList) que exponen el offset directo en vez del evento.
  handleScrollOffset: (y: number) => void;
  show: () => void;
}

const Ctx = createContext<TabBarCtx | null>(null);

const HIDDEN_OFFSET = 130; // cuánto baja la barra para ocultarse del todo
const THRESHOLD = 6;       // px mínimos de scroll para reaccionar

export function TabBarProvider({ children }: { children: React.ReactNode }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const lastY = useRef(0);
  const shown = useRef(true);
  // Tras cambiar de pantalla, el primer scroll solo calibra (evita un salto de
  // dirección espurio si la pantalla nueva ya venía scrolleada).
  const calibrating = useRef(false);

  const animateTo = useCallback((toValue: number) => {
    Animated.timing(translateY, { toValue, duration: 200, useNativeDriver: true }).start();
  }, [translateY]);

  const show = useCallback(() => {
    shown.current = true;
    calibrating.current = true;
    animateTo(0);
  }, [animateTo]);

  const handleScrollOffset = useCallback((y: number) => {
    if (calibrating.current) {
      calibrating.current = false;
      lastY.current = y;
      return;
    }
    const dy = y - lastY.current;

    // Cerca del tope: siempre visible.
    if (y <= 0) {
      if (!shown.current) { shown.current = true; animateTo(0); }
      lastY.current = y;
      return;
    }
    if (dy > THRESHOLD && shown.current) {        // scrolleando hacia abajo → ocultar
      shown.current = false; animateTo(HIDDEN_OFFSET);
    } else if (dy < -THRESHOLD && !shown.current) { // scrolleando hacia arriba → mostrar
      shown.current = true; animateTo(0);
    }
    lastY.current = y;
  }, [animateTo]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    handleScrollOffset(e.nativeEvent.contentOffset.y);
  }, [handleScrollOffset]);

  return (
    <Ctx.Provider value={{ translateY, handleScroll, handleScrollOffset, show }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTabBar() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTabBar debe usarse dentro de TabBarProvider');
  return ctx;
}
