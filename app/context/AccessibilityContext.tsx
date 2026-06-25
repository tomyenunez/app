import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontSizeKey = 'small' | 'normal' | 'large' | 'xlarge';

// Multiplicador de tamaño por opción
export const FONT_SCALES: Record<FontSizeKey, number> = {
  small: 0.85,
  normal: 1,
  large: 1.15,
  xlarge: 1.3,
};

export const FONT_SIZE_OPTIONS: { key: FontSizeKey; label: string }[] = [
  { key: 'small', label: 'Pequeño' },
  { key: 'normal', label: 'Normal' },
  { key: 'large', label: 'Grande' },
  { key: 'xlarge', label: 'Muy grande' },
];

const SIZE_KEY = '@dayxo/a11y_font_size';
const BOLD_KEY = '@dayxo/a11y_bold';

interface AccessibilityContextType {
  fontSizeKey: FontSizeKey;
  fontScale: number;
  isBold: boolean;
  setFontSizeKey: (k: FontSizeKey) => void;
  setIsBold: (b: boolean) => void;
}

// Default seguro: si algún AppText se renderiza fuera del provider, usa escala 1.
const AccessibilityContext = createContext<AccessibilityContextType>({
  fontSizeKey: 'normal',
  fontScale: 1,
  isBold: false,
  setFontSizeKey: () => {},
  setIsBold: () => {},
});

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontSizeKey, setFontSizeKeyState] = useState<FontSizeKey>('normal');
  const [isBold, setIsBoldState] = useState(false);

  // Cargar preferencias guardadas
  useEffect(() => {
    AsyncStorage.multiGet([SIZE_KEY, BOLD_KEY]).then((entries) => {
      const map = Object.fromEntries(entries) as Record<string, string | null>;
      const s = map[SIZE_KEY];
      if (s === 'small' || s === 'normal' || s === 'large' || s === 'xlarge') {
        setFontSizeKeyState(s);
      }
      if (map[BOLD_KEY] === 'true') setIsBoldState(true);
    });
  }, []);

  const setFontSizeKey = useCallback((k: FontSizeKey) => {
    setFontSizeKeyState(k);
    AsyncStorage.setItem(SIZE_KEY, k);
  }, []);

  const setIsBold = useCallback((b: boolean) => {
    setIsBoldState(b);
    AsyncStorage.setItem(BOLD_KEY, b ? 'true' : 'false');
  }, []);

  const value = useMemo(
    () => ({ fontSizeKey, fontScale: FONT_SCALES[fontSizeKey], isBold, setFontSizeKey, setIsBold }),
    [fontSizeKey, isBold, setFontSizeKey, setIsBold]
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export const useAccessibility = () => useContext(AccessibilityContext);
