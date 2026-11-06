/**
 * Teclado numérico propio para registrar montos en COP.
 *
 * ¿Por qué no el teclado del sistema? Porque tapa media pantalla, cambia
 * según la marca del teléfono y obliga a tocar el campo primero. Este está
 * siempre visible dentro del sheet, tiene la tecla "000" (en Colombia casi
 * todo termina en mil) y da vibración en cada tecla.
 *
 * Mantener presionado ⌫ borra todo.
 */
import { StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { radius, space, useTheme } from '@/theme';

import { BackspaceIcon } from './icons';
import { applyKey, KEYPAD_LAYOUT, type KeypadKey } from './keypad-logic';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export interface NumericKeypadProps {
  /** Cadena de dígitos actual, p. ej. "12500". */
  value: string;
  onChange: (next: string) => void;
}

const KEY_HEIGHT = 60;

export function NumericKeypad({ value, onChange }: NumericKeypadProps) {
  const { colors } = useTheme();

  const press = (key: KeypadKey) => {
    const next = applyKey(value, key);
    if (next === value) {
      haptics.reject();
      return;
    }
    haptics.tick();
    onChange(next);
  };

  return (
    <View style={styles.grid}>
      {KEYPAD_LAYOUT.map((key) => (
        <PressableScale
          key={key}
          testID={`keypad-${key}`}
          onPress={() => press(key)}
          onLongPress={
            key === 'back'
              ? () => {
                  if (value === '') return;
                  haptics.confirm();
                  onChange('');
                }
              : undefined
          }
          scaleTo={0.92}
          accessibilityRole="button"
          accessibilityLabel={key === 'back' ? 'Borrar' : key === '000' ? 'Tres ceros' : key}
          accessibilityHint={key === 'back' ? 'Mantén presionado para borrar todo' : undefined}
          pressedColor={colors.surfacePressed}
          style={styles.key}>
          {key === 'back' ? (
            <BackspaceIcon size={28} color={colors.ink} />
          ) : (
            <Text variant="amountMedium" style={styles.digit}>
              {key}
            </Text>
          )}
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: space[1],
  },
  key: {
    width: '33.333%',
    height: KEY_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  digit: {
    fontSize: 28,
    lineHeight: 34,
  },
});
