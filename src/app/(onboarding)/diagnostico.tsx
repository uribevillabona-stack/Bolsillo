/**
 * Onboarding 3/4: mini diagnóstico de 5 preguntas, una a la vez.
 * Al tocar una respuesta pasa sola a la siguiente (sin botón "Siguiente").
 */
import { router } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { DIAGNOSTIC_QUESTIONS } from '@/features/onboarding/onboarding-data';
import { useOnboardingStore } from '@/features/onboarding/onboarding-store';
import { haptics } from '@/lib/haptics';
import { space } from '@/theme';

export default function DiagnosticoStep() {
  const { diagnostic, answer } = useOnboardingStore();
  const [index, setIndex] = useState(0);
  const question = DIAGNOSTIC_QUESTIONS[index]!;
  const isLast = index === DIAGNOSTIC_QUESTIONS.length - 1;

  // Al pasar de pregunta, se anuncia la nueva (el botón que tenía el foco desaparece).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    AccessibilityInfo.announceForAccessibility(
      `Pregunta ${index + 1} de ${DIAGNOSTIC_QUESTIONS.length}. ${question.question}`,
    );
  }, [index, question.question]);

  return (
    <OnboardingStep
      step={3}
      title="Cinco preguntas rápidas"
      lead="Sin respuestas buenas ni malas. Nos sirven para recomendarte qué aprender primero."
      footer={
        <View style={styles.footerRow}>
          <Button
            label="Atrás"
            variant="quiet"
            disabled={index === 0}
            onPress={() => setIndex((i) => Math.max(0, i - 1))}
          />
          <Button
            label="Saltar"
            variant="quiet"
            onPress={() => router.push('/deteccion')}
            accessibilityHint="Salta el resto del diagnóstico"
          />
        </View>
      }>
      <View style={styles.question}>
        <Text variant="overline" tone="inkMuted">
          Pregunta {index + 1} de {DIAGNOSTIC_QUESTIONS.length}
        </Text>
        <Text variant="title" accessibilityRole="header">
          {question.question}
        </Text>
      </View>
      <View style={styles.options} accessibilityRole="radiogroup">
        {question.options.map((o) => (
          <Button
            key={o.id}
            label={o.label}
            variant={diagnostic[question.id] === o.id ? 'primary' : 'outline'}
            selected={diagnostic[question.id] === o.id}
            block
            onPress={() => {
              haptics.tick();
              answer(question.id, o.id);
              if (isLast) router.push('/deteccion');
              else setIndex(index + 1);
            }}
          />
        ))}
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  question: {
    gap: space[2],
  },
  options: {
    gap: space[2],
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
