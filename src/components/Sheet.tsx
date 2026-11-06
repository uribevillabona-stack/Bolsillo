/**
 * Bottom sheet del design system: registro rápido de gastos, editar un
 * pendiente, aportar a un Apartado.
 *
 * - Se cierra arrastrando hacia abajo, tocando el velo o con "atrás".
 * - El arrastre solo se activa con movimiento vertical hacia abajo, así los
 *   toques en el teclado y el scroll horizontal de chips no lo disparan.
 * - Se mantiene montado mientras corre la animación de salida.
 * - Respeta "reducir movimiento" del sistema.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  ScrollView,
  usePanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { duration, hairline, radius, screenGutter, space, spring, useTheme } from '@/theme';

import { Text } from './Text';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  /** Título visible y etiqueta para el lector de pantalla. */
  title: string;
  /** Oculta el título visualmente (sigue disponible para accesibilidad). */
  hideTitle?: boolean;
  children: ReactNode;
}

/** Distancia (px) o velocidad (px/s) de arrastre que cierran el sheet. */
const CLOSE_DISTANCE = 120;
const CLOSE_VELOCITY = 900;

export function Sheet({ visible, onClose, title, hideTitle = false, children }: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  // El Modal sigue montado durante la animación de salida.
  // Montar al abrir se deriva en el render (no en un efecto) para evitar un
  // render en cascada; desmontar ocurre cuando termina la animación.
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);

  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const scrollable = contentHeight > viewportHeight + 1;

  const translateY = useSharedValue(screenHeight);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.set(
        reduceMotion ? withTiming(0, { duration: duration.quick }) : withSpring(0, spring.settle),
      );
      backdrop.set(withTiming(1, { duration: duration.base }));
    } else {
      backdrop.set(withTiming(0, { duration: duration.quick }));
      translateY.set(
        withTiming(screenHeight, { duration: duration.base }, (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [visible, reduceMotion, screenHeight, translateY, backdrop]);

  const pan = usePanGesture({
    activeOffsetY: 12,
    failOffsetX: [-24, 24],
    onUpdate: (e) => {
      'worklet';
      translateY.set(Math.max(0, e.translationY));
    },
    onDeactivate: (e) => {
      'worklet';
      if (e.translationY > CLOSE_DISTANCE || e.velocityY > CLOSE_VELOCITY) {
        scheduleOnRN(onClose);
      } else {
        translateY.set(withSpring(0, spring.settle));
      }
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.get() }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.get() }));

  if (!mounted) return null;

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      {/* Mientras se cierra (animación de salida) ya no recibe toques: evita
          que un doble toque en "Guardar" registre el gasto dos veces. */}
      <GestureHandlerRootView style={styles.root} pointerEvents={visible ? 'auto' : 'none'}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
          />
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View
            accessibilityViewIsModal
            accessibilityLabel={title}
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.line,
                paddingBottom: insets.bottom + space[4],
                maxHeight: screenHeight - insets.top - space[8],
              },
              sheetStyle,
            ]}>
            <View style={[styles.handle, { backgroundColor: colors.line }]} />
            {hideTitle ? null : (
              <Text variant="title" accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
            )}
            {/* Scroll solo si el contenido no cabe (p. ej. letra del sistema
                muy grande en un teléfono pequeño): así "Guardar" nunca queda
                fuera de alcance, y en el caso normal el arrastre cierra el sheet
                sin competir con un scroll. */}
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              scrollEnabled={scrollable}
              showsVerticalScrollIndicator={scrollable}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
              onContentSizeChange={(_, h) => setContentHeight(h)}>
              {children}
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    borderWidth: hairline,
    borderBottomWidth: 0,
    paddingTop: space[2],
  },
  body: {
    flexShrink: 1,
  },
  // El margen lateral va dentro del scroll (no en el sheet) para que el
  // contenido con scroll horizontal (atajos) pueda llegar hasta el borde.
  bodyContent: {
    paddingHorizontal: screenGutter,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: space[4],
  },
  title: {
    marginBottom: space[4],
    paddingHorizontal: screenGutter,
  },
});
