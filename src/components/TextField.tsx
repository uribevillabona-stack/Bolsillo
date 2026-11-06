/**
 * Campo de texto del design system: etiqueta visible arriba (no solo
 * placeholder, que desaparece al escribir), borde de 1px que se marca con
 * tinta al enfocar, y mensaje de error accesible.
 */
import { useState, type ComponentRef, type Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { hairline, minTouchTarget, radius, space, textStyles, useTheme } from '@/theme';

import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
  error?: string | null;
  hint?: string;
}

// React 19: `ref` llega como prop normal (sin forwardRef).
export function TextField({ label, error, hint, onFocus, onBlur, ref, ...rest }: TextFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.accentText : focused ? colors.lineStrong : colors.line;

  return (
    <View style={styles.wrap}>
      <Text variant="label" tone="inkMuted">
        {label}
      </Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={hint}
        placeholderTextColor={colors.inkMuted}
        selectionColor={colors.primary}
        cursorColor={colors.ink}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          textStyles.body,
          styles.input,
          { color: colors.ink, borderColor, backgroundColor: colors.surface },
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" tone="accentText" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="inkMuted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space[1],
  },
  input: {
    minHeight: minTouchTarget + 4,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderWidth: hairline,
    borderRadius: radius.sm,
  },
});
