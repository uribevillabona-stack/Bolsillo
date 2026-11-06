/**
 * Registro rápido de gastos hormiga.
 *
 * Flujo de 1 toque: tocar un atajo ("Tinto $ 2.500") llena el monto, y
 * "Guardar" lo registra. Para montos libres, el teclado propio.
 *
 * Fase 1: interfaz y teclado. La persistencia en SQLite, la categoría, la
 * nota, la fecha y el "deshacer" llegan en la Fase 2 (`onSave` es el punto de
 * conexión).
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { AmountText, Button, Chip, NumericKeypad, Sheet, Text } from '@/components';
import { haptics } from '@/lib/haptics';
import { digitsToAmount } from '@/lib/money';
import { space } from '@/theme';

import { DEFAULT_SHORTCUTS } from './default-shortcuts';

export interface QuickAddDraft {
  amount: number;
  shortcutId: string | null;
}

export interface QuickAddSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (draft: QuickAddDraft) => void;
}

export function QuickAddSheet({ visible, onClose, onSave }: QuickAddSheetProps) {
  const [digits, setDigits] = useState('');
  const [shortcutId, setShortcutId] = useState<string | null>(null);
  const amount = digitsToAmount(digits);

  // Se limpia al ABRIR (estado derivado en render), no al cerrar: así el
  // sheet no se ve vacío ("$ 0") mientras baja en la animación de salida.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setDigits('');
      setShortcutId(null);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Registrar gasto" hideTitle>
      <View style={styles.header}>
        <Text variant="overline" tone="inkMuted">
          {shortcutId
            ? (DEFAULT_SHORTCUTS.find((s) => s.id === shortcutId)?.label ?? 'Gasto')
            : 'Nuevo gasto'}
        </Text>
        <AmountText
          amount={amount}
          size="hero"
          tone={amount === 0 ? 'inkMuted' : 'ink'}
          testID="quick-add-amount"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shortcuts}
        style={styles.shortcutsScroll}>
        {DEFAULT_SHORTCUTS.map((s) => (
          <Chip
            key={s.id}
            label={s.label}
            icon={s.icon}
            amount={s.amount}
            selected={shortcutId === s.id}
            onPress={() => {
              haptics.tick();
              setShortcutId(s.id);
              setDigits(String(s.amount));
            }}
          />
        ))}
      </ScrollView>

      <NumericKeypad
        value={digits}
        onChange={(next) => {
          setDigits(next);
          // Si el usuario edita el monto a mano, el atajo deja de aplicar.
          if (shortcutId) setShortcutId(null);
        }}
      />

      <View style={styles.footer}>
        <Button
          label="Guardar"
          variant="accent"
          size="lg"
          block
          disabled={amount === 0}
          testID="quick-add-save"
          onPress={() => {
            haptics.confirm();
            onSave({ amount, shortcutId });
          }}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: space[1],
    marginBottom: space[4],
  },
  shortcutsScroll: {
    marginHorizontal: -space[5],
    marginBottom: space[3],
    flexGrow: 0,
  },
  shortcuts: {
    gap: space[2],
    paddingHorizontal: space[5],
  },
  footer: {
    marginTop: space[3],
  },
});
