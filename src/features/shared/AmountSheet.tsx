/**
 * Sheet genérico para pedir un monto con el teclado propio (ingreso de
 * referencia, monto de un atajo). Reutiliza el mismo patrón del registro.
 */
import { useState, type ReactNode } from 'react';
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
  /** Tope permitido (p. ej. no retirar más de lo que hay). */
  maxAmount?: number;
  /** Qué decir si se pasa del tope. */
  maxMessage?: string;
  onConfirm: (amount: number) => void;
  onClose: () => void;
  /** Opciones extra bajo el monto (p. ej. "Ya la tenía ahorrada"). */
  children?: ReactNode;
}

export function AmountSheet({
  visible,
  title,
  hint,
  initialAmount,
  confirmLabel = 'Guardar',
  maxAmount,
  maxMessage,
  onConfirm,
  onClose,
  children,
}: AmountSheetProps) {
  const [digits, setDigits] = useState(initialAmount > 0 ? String(initialAmount) : '');
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDigits(initialAmount > 0 ? String(initialAmount) : '');
  }
  const amount = digitsToAmount(digits);
  const tooMuch = maxAmount !== undefined && amount > maxAmount;

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {hint ? (
        <Text variant="caption" tone="inkMuted" style={styles.hint}>
          {hint}
        </Text>
      ) : null}
      <AmountText
        amount={amount}
        size="hero"
        tone={tooMuch ? 'accentText' : amount === 0 ? 'inkMuted' : 'ink'}
        accessibilityLiveRegion="polite"
      />
      {tooMuch && maxMessage ? (
        <Text variant="caption" tone="accentText" accessibilityLiveRegion="polite">
          {maxMessage}
        </Text>
      ) : null}
      {children}
      <View style={styles.keypad}>
        <NumericKeypad value={digits} onChange={setDigits} />
      </View>
      <Button
        label={confirmLabel}
        size="lg"
        block
        disabled={amount === 0 || tooMuch}
        onPress={() => onConfirm(amount)}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  hint: {
    marginBottom: space[2],
  },
  keypad: {
    marginVertical: space[3],
  },
});
