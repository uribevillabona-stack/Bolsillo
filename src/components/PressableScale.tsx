/**
 * Primitiva interna: un Pressable que se encoge levemente al presionarlo y,
 * opcionalmente, cambia su fondo. Lo usan Button, Chip, ListRow y las teclas
 * del teclado para que todos respondan al toque con la misma física.
 * En pantallas se usa solo para filas o bloques tocables a la medida (una
 * fila de presupuesto, la tarjeta de un Apartado); para lo demás, Button,
 * Chip o ListRow.
 */
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { duration, pressScale, spring } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Escala al presionar. Por defecto, `pressScale` del tema. */
  scaleTo?: number;
  /** Si se define, el fondo pasa de transparente a este color al presionar. */
  pressedColor?: string;
}

export function PressableScale({
  style,
  scaleTo = pressScale,
  pressedColor,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const transform = [{ scale: scale.get() }];
    if (!pressedColor) return { transform };
    return {
      transform,
      backgroundColor: interpolateColor(pressed.get(), [0, 1], ['rgba(0,0,0,0)', pressedColor]),
    };
  });

  // `.set()` / `.get()` en vez de `.value`: es la forma compatible con el
  // React Compiler (activado en app.json).
  return (
    <AnimatedPressable
      onPressIn={(e) => {
        if (!reduceMotion) scale.set(withSpring(scaleTo, spring.press));
        pressed.set(withTiming(1, { duration: duration.tap }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSpring(1, spring.press));
        pressed.set(withTiming(0, { duration: duration.quick }));
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
      {...rest}
    />
  );
}
