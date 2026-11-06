/**
 * Estructura común de cada paso del onboarding: indicador "1 de 4", título
 * grande, contenido con scroll y acciones fijas abajo (alcanzables con el
 * pulgar). Evita el teclado: Android 15+ es edge-to-edge y la ventana ya no
 * se redimensiona sola al abrirlo.
 */
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components';
import { hairline, screenGutter, space, useTheme } from '@/theme';

export const ONBOARDING_STEPS = 4;

export interface OnboardingStepProps {
  step: number;
  title: string;
  lead?: string;
  children: ReactNode;
  footer: ReactNode;
}

export function OnboardingStep({ step, title, lead, children, footer }: OnboardingStepProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space[6] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View
          style={styles.progress}
          accessible
          accessibilityLabel={`Paso ${step} de ${ONBOARDING_STEPS}`}>
          {Array.from({ length: ONBOARDING_STEPS }, (_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i < step ? colors.ink : colors.line }]}
            />
          ))}
        </View>
        <Text variant="display" accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {lead ? (
          <Text variant="body" tone="inkMuted" style={styles.lead}>
            {lead}
          </Text>
        ) : null}
        <View style={styles.body}>{children}</View>
      </ScrollView>
      <View
        style={[
          styles.footer,
          { borderTopColor: colors.line, paddingBottom: insets.bottom + space[4] },
        ]}>
        {footer}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: screenGutter,
    paddingBottom: space[8],
  },
  progress: {
    flexDirection: 'row',
    gap: space[1],
    marginBottom: space[8],
  },
  dot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  title: {
    maxWidth: 320,
  },
  lead: {
    marginTop: space[3],
    maxWidth: 340,
  },
  body: {
    marginTop: space[8],
    gap: space[6],
  },
  footer: {
    borderTopWidth: hairline,
    paddingHorizontal: screenGutter,
    paddingTop: space[4],
    gap: space[2],
  },
});
