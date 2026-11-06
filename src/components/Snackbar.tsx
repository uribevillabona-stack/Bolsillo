/**
 * Snackbar: confirma una acción y ofrece deshacerla durante 5 segundos.
 * Tinta sobre fondo (invertido respecto a la pantalla) para que destaque sin
 * usar sombras. Se anuncia al lector de pantalla.
 */
import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptics } from '@/lib/haptics';
import { minTouchTarget, radius, screenGutter, space, useTheme } from '@/theme';

import { PressableScale } from './PressableScale';
import {
  showSnackbar,
  SNACKBAR_DURATION_MS,
  SNACKBAR_READER_DURATION_MS,
  useSnackbarStore,
} from './snackbar-store';
import { Text } from './Text';

export interface SnackbarProps {
  /** Distancia desde el borde inferior (p. ej. para quedar sobre la barra de pestañas). */
  bottomOffset?: number;
}

export function Snackbar({ bottomOffset = 0 }: SnackbarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const current = useSnackbarStore((s) => s.current);
  const dismiss = useSnackbarStore((s) => s.dismiss);

  useEffect(() => {
    if (!current) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = true;
    AccessibilityInfo.announceForAccessibility(
      current.action ? `${current.text}. ${current.action.label} disponible.` : current.text,
    );
    // Con lector de pantalla, 5 s no alcanzan para llegar al botón (WCAG 2.2.1).
    AccessibilityInfo.isScreenReaderEnabled().then((reader) => {
      if (!active) return;
      timer = setTimeout(dismiss, reader ? SNACKBAR_READER_DURATION_MS : SNACKBAR_DURATION_MS);
    });
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [current, dismiss]);

  if (!current) return null;

  const runAction = () => {
    haptics.tap();
    const action = current.action;
    dismiss();
    try {
      action?.onPress();
    } catch (e) {
      // Un "Deshacer" fallido nunca debe cerrar la app: se informa y ya.
      haptics.reject();
      showSnackbar(
        e instanceof Error ? `No se pudo deshacer: ${e.message}` : 'No se pudo deshacer.',
      );
    }
  };

  return (
    <Animated.View
      key={current.key}
      entering={FadeInDown.duration(180)}
      exiting={FadeOutDown.duration(150)}
      style={[
        styles.bar,
        { backgroundColor: colors.ink, bottom: insets.bottom + bottomOffset + space[3] },
      ]}>
      <Text variant="label" style={[styles.text, { color: colors.bg }]} numberOfLines={2}>
        {current.text}
      </Text>
      {current.action ? (
        <View>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={current.action.label}
            onPress={runAction}
            style={styles.action}>
            <Text variant="bodyStrong" style={{ color: colors.bg }}>
              {current.action.label}
            </Text>
          </PressableScale>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: screenGutter,
    right: screenGutter,
    minHeight: minTouchTarget + 8,
    paddingLeft: space[4],
    paddingRight: space[1],
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  text: {
    flex: 1,
    paddingVertical: space[3],
  },
  action: {
    minHeight: minTouchTarget,
    paddingHorizontal: space[3],
    justifyContent: 'center',
  },
});
