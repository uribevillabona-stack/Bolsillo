/**
 * Sheet genérico para pedir un monto con el teclado propio (ingreso de
 * referencia, monto de un atajo). Reutiliza el mismo patrón del registro.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AmountText, Button, NumericKeypad, Sheet, Text } from '@/components';
import { digitsToAmount } from '@/lib/money';
import { space } from '@/theme';

export interface AmountSheetProps {
  visible: boolean;
  title: string;
  hint?: string;
  initialAmount: number;
  confirmLabel?: string;
  onConfirm: (amount: number) => void;
  onClose: () => void;
}

export function AmountSheet({
  visible,
  title,
  hint,
  initialAmount,
  confirmLabel = 'Guardar',
  onConfirm,
  onClose,
}: AmountSheetProps) {
  const [digits, setDigits] = useState(initialAmount > 0 ? String(initialAmount) : '');
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDigits(initialAmount > 0 ? String(initialAmount) : '');
  }
  const amount = digitsToAmount(digits);

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {hint ? (
        <Text variant="caption" tone="inkMuted" style={styles.hint}>
          {hint}
        </Text>
      ) : null}
      <AmountText amount={amount} size="hero" tone={amount === 0 ? 'inkMuted' : 'ink'} />
      <View style={styles.keypad}>
        <NumericKeypad value={digits} onChange={setDigits} />
      </View>
      <Button
        label={confirmLabel}
        size="lg"
        block
        disabled={amount === 0}
        onPress={() => onConfirm(amount)}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  hint: {
    marginTop: -space[2],
    marginBottom: space[2],
  },
  keypad: {
    marginVertical: space[3],
  },
});
