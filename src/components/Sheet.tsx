/**
 * Bottom sheet del design system: registro rápido de gastos, editar un
 * pendiente, aportar a un Apartado.
 *
 * - Se cierra arrastrando hacia abajo, tocando el velo o con "atrás".
 * - El arrastre solo se activa con movimiento vertical hacia abajo, así los
 *   toques en el teclado y el scroll horizontal de chips no lo disparan.
 * - Se mantiene montado mientras corre la animación de salida.
 * - Respeta "reducir movimiento" del sistema.
 * - `error` (de `useSheetError`) se muestra fijo bajo el título: un snackbar
 *   quedaría detrás del Modal mientras el sheet está abierto.
 */
import { useEffect, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
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

import type { SheetError } from './sheet-error';
import { Text } from './Text';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  /** Título visible y etiqueta para el lector de pantalla. */
  title: string;
  /** Oculta el título visualmente (sigue disponible para accesibilidad). */
  hideTitle?: boolean;
  /** Error de la última acción (guardar, eliminar). Ver `useSheetError`. */
  error?: SheetError | null;
  children: ReactNode;
}

/** Distancia (px) o velocidad (px/s) de arrastre que cierran el sheet. */
const CLOSE_DISTANCE = 120;
const CLOSE_VELOCITY = 900;

export function Sheet({
  visible,
  onClose,
  title,
  hideTitle = false,
  error = null,
  children,
}: SheetProps) {
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

  // Con el teclado abierto, el sheet sube por encima de él (el Modal de
  // Android no se ajusta solo cuando es edge-to-edge).
  const keyboardHeight = useKeyboardHeight(visible);

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

  // El lector de pantalla oye el error aunque el foco esté en "Guardar".
  useEffect(() => {
    if (error) AccessibilityInfo.announceForAccessibility(error.message);
  }, [error]);

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
                paddingBottom:
                  keyboardHeight > 0 ? keyboardHeight + space[3] : insets.bottom + space[4],
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
            {error ? (
              <View style={styles.error} testID="sheet-error">
                <View style={[styles.errorMark, { backgroundColor: colors.accent }]} />
                <Text variant="body" tone="accentText" style={styles.errorText}>
                  {error.message}
                </Text>
              </View>
            ) : null}
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

/** Alto del teclado en pantalla (0 si está cerrado). Solo escucha con el sheet abierto. */
function useKeyboardHeight(active: boolean): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (!active) return;
    const show = Keyboard.addListener('keyboardDidShow', (e) => setHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
      setHeight(0);
    };
  }, [active]);
  return height;
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
  error: {
    flexDirection: 'row',
    gap: space[2],
    marginBottom: space[4],
    marginHorizontal: screenGutter,
  },
  errorMark: {
    width: 3,
    borderRadius: 2,
  },
  errorText: {
    flex: 1,
  },
});
