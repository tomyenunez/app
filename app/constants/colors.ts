import { FamiliaColor } from '../types';

export interface FamiliaTone {
  bg: string;
  fg: string;
}

// Paleta clara (la de siempre)
export const LightColors = {
  bg: '#F7F7F5',
  card: '#FFFFFF',
  inputBg: '#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#999999',
  textTertiary: '#BBBBBB',
  border: '#EBEBEB',
  borderStrong: '#D0D0D0',

  navBg: '#FFFFFF',
  navBorder: '#E8E8E8',
  navIcon: '#1A1A1A',

  violet: '#6C5CE7',
  green: '#00B894',
  orange: '#E17055',
  blue: '#0984E3',
  pink: '#E84393',

  violetLight: '#E8E4FF',
  greenLight: '#D4F5E9',
  orangeLight: '#FFE8D6',
  blueLight: '#D6EEFF',
  pinkLight: '#FFE0EF',
  yellowLight: '#FFF3CC',

  positive: '#00B894',
  negative: '#E84393',
  error: '#E05C5C',

  white: '#FFFFFF',
  gray: '#999999',
  grayLight: '#EBEBEB',
  grayVeryLight: '#F5F5F5',

  scoreBg: '#6C5CE7',
  chipDark: '#1A1A1A',
  chipDarkText: '#FFFFFF',
  lunaBubble: '#F0EEF8',

  // Acento fg / fondo suave bg para familias, categorías y métodos de pago
  familia: {
    violeta: { bg: '#E8E4FF', fg: '#6C5CE7' },
    verde: { bg: '#D4F5E9', fg: '#00864A' },
    naranja: { bg: '#FFE8D6', fg: '#B85C2A' },
    azul: { bg: '#D6EEFF', fg: '#0984E3' },
    rosa: { bg: '#FFE0EF', fg: '#E84393' },
    amarillo: { bg: '#FFF3CC', fg: '#B8860B' },
    gris: { bg: '#F0F0F0', fg: '#666666' },
  } as Record<FamiliaColor, FamiliaTone>,
};

export type AppColors = typeof LightColors;

// Paleta oscura: fondos y textos cambian, los acentos se mantienen
export const DarkColors: AppColors = {
  bg: '#0F0F12',
  card: '#1A1A22',
  inputBg: '#12121A',
  textPrimary: '#F0F0F0',
  textSecondary: '#888888',
  textTertiary: '#555555',
  border: '#2A2A35',
  borderStrong: '#3A3A48',

  navBg: '#1A1A22',
  navBorder: '#2A2A35',
  navIcon: '#F0F0F0',

  violet: '#6C5CE7',
  green: '#00B894',
  orange: '#E17055',
  blue: '#0984E3',
  pink: '#E84393',

  violetLight: '#1E1A3A',
  greenLight: '#0D2620',
  orangeLight: '#2A1A0D',
  blueLight: '#0D1A2A',
  pinkLight: '#2A0D1A',
  yellowLight: '#2A2208',

  positive: '#00B894',
  negative: '#E84393',
  error: '#E05C5C',

  white: '#FFFFFF',
  gray: '#888888',
  grayLight: '#2A2A35',
  grayVeryLight: '#22222C',

  scoreBg: '#5A4DD4',
  chipDark: '#F0F0F0',
  chipDarkText: '#1A1A1A',
  lunaBubble: '#22222C',

  familia: {
    violeta: { bg: '#1E1A3A', fg: '#8B7FF0' },
    verde: { bg: '#0D2620', fg: '#2ECC9A' },
    naranja: { bg: '#2A1A0D', fg: '#E17055' },
    azul: { bg: '#0D1A2A', fg: '#4AA3F0' },
    rosa: { bg: '#2A0D1A', fg: '#F06CAC' },
    amarillo: { bg: '#2A2208', fg: '#E5C558' },
    gris: { bg: '#26262E', fg: '#9A9AA5' },
  } as Record<FamiliaColor, FamiliaTone>,
};

export const FAMILIA_COLOR_KEYS: FamiliaColor[] = [
  'violeta', 'verde', 'naranja', 'azul', 'rosa', 'amarillo', 'gris',
];
