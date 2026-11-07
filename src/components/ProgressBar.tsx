/**
 * Barra de progreso horizontal: presupuesto usado por categoría.
 *
 * Verde mientras va bien; coral desde el 80 % (alerta de gasto, el único
 * uso del coral aparte del botón principal). La barra se anima hasta el
 * valor nuevo y respeta "reducir movimiento".
 */
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { duration, useTheme, type ColorTokens } from '@/theme';

export interface ProgressBarProps {
  /** 0 a 1; mayor a 1 se muestra llena. */
  progress: number;
  tone?: keyof Pick<ColorTokens, 'primary' | 'accent' | 'butter'>;
  /** Obligatorio: la barra sola no dice nada a un lector de pantalla. */
  accessibilityLabel: string;
  height?: number;
}

export function ProgressBar({
  progress,
  tone = 'primary',
  accessibilityLabel,
  height = 6,
}: ProgressBarProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(progress, 1));
  const animated = useSharedValue(reduceMotion ? clamped : 0);

  useEffect(() => {
    animated.set(reduceMotion ? clamped : withTiming(clamped, { duration: duration.base * 2 }));
  }, [animated, clamped, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${animated.get() * 100}%` }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: colors.line }]}>
      <Animated.View
        style={[
          styles.fill,
          { borderRadius: height / 2, backgroundColor: colors[tone] },
          fillStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
