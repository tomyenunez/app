import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

export interface DonutSlice {
  value: number;
  color: string;
  label: string;
}

interface Props {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSub?: string;
}

export function DonutChart({ data, size = 180, strokeWidth = 30, centerLabel, centerSub }: Props) {
  const { colors } = useTheme();
  const fade = useRef(new Animated.Value(0)).current;

  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [data]);

  // Sin datos: anillo gris
  if (total === 0) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={r} stroke={colors.grayLight} strokeWidth={strokeWidth} fill="none" />
        </Svg>
        <View style={StyleSheet.absoluteFill as any}>
          <View style={styles.center}>
            <Text style={[styles.centerLabel, { color: colors.textSecondary, fontSize: 14 }]}>Sin datos</Text>
          </View>
        </View>
      </View>
    );
  }

  // Cada slice: círculo completo con dash visible = su fracción, rotado a su inicio
  let acc = 0;
  const arcs = data.map((d, i) => {
    const fraction = d.value / total;
    const gap = data.length > 1 ? 2 : 0;
    const dashLen = Math.max(0, circ * fraction - gap);
    const rotation = acc * 360;
    acc += fraction;
    return { color: d.color, dashLen, rotation, key: i };
  });

  return (
    <Animated.View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', opacity: fade }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${cx}, ${cy}`}>
          {arcs.map((a) => (
            <Circle
              key={a.key}
              cx={cx}
              cy={cy}
              r={r}
              stroke={a.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${a.dashLen} ${circ - a.dashLen}`}
              strokeLinecap="butt"
              rotation={a.rotation}
              origin={`${cx}, ${cy}`}
            />
          ))}
        </G>
      </Svg>
      {(centerLabel || centerSub) && (
        <View style={StyleSheet.absoluteFill as any}>
          <View style={styles.center}>
            {centerLabel && <Text style={[styles.centerLabel, { color: colors.textPrimary }]}>{centerLabel}</Text>}
            {centerSub && <Text style={[styles.centerSub, { color: colors.textSecondary }]}>{centerSub}</Text>}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerLabel: { fontSize: 20, fontFamily: 'Inter_800ExtraBold' },
  centerSub: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 2 },
});
