/**
 * Botón flotante de registro: el CTA principal de la app (coral).
 *
 * Flota a la derecha, encima de la barra de pestañas (composición
 * asimétrica). Se posiciona como hermano de las pestañas y no dentro de la
 * barra: en Android los toques fuera de los límites del padre no llegan.
 */
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptics } from '@/lib/haptics';
import { hairline, radius, screenGutter, space, useTheme } from '@/theme';

import { PlusIcon } from './icons';
import { PressableScale } from './PressableScale';
import { TAB_BAR_HEIGHT } from './TabBar';

const SIZE = 60;

export function QuickAddButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <PressableScale
      testID="fab-registrar"
      accessibilityRole="button"
      accessibilityLabel="Registrar gasto"
      accessibilityHint="Abre el teclado para anotar un gasto"
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={[
        styles.fab,
        {
          bottom: TAB_BAR_HEIGHT + insets.bottom + space[4],
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
      ]}>
      <PlusIcon size={28} color={colors.onAccent} weight="bold" />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: screenGutter,
    width: SIZE,
    height: SIZE,
    borderRadius: radius.md,
    borderWidth: hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
