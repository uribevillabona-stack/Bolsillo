/**
 * Onboarding 1/4: nombre y de dónde sale la plata.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Chip, Text, TextField } from '@/components';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { INCOME_RANGES, INCOME_TYPES } from '@/features/onboarding/onboarding-data';
import { useOnboardingStore } from '@/features/onboarding/onboarding-store';
import { haptics } from '@/lib/haptics';
import { space } from '@/theme';

export default function PerfilStep() {
  const { name, incomeType, incomeRange, set } = useOnboardingStore();
  const canContinue = name.trim().length > 0 && incomeType !== null && incomeRange !== null;

  return (
    <OnboardingStep
      step={1}
      title="Hola. ¿Cómo te llamamos?"
      lead="BOLSILLO vive en tu teléfono. Nada de esto sale de aquí."
      footer={
        <Button
          label="Continuar"
          size="lg"
          block
          disabled={!canContinue}
          onPress={() => router.push('/meta')}
        />
      }>
      <TextField
        label="Tu nombre o apodo"
        value={name}
        onChangeText={(text) => set({ name: text })}
        autoCapitalize="words"
        autoComplete="given-name"
        maxLength={40}
        returnKeyType="done"
        placeholder="Como te dicen"
      />

      <View style={styles.group}>
        <Text variant="label" tone="inkMuted">
          ¿De dónde sale tu plata?
        </Text>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {INCOME_TYPES.map((t) => (
            <Chip
              role="radio"
              key={t.id}
              label={t.label}
              selected={incomeType === t.id}
              onPress={() => {
                haptics.tick();
                set({ incomeType: t.id });
              }}
            />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text variant="label" tone="inkMuted">
          ¿Cuánto te entra al mes, más o menos?
        </Text>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {INCOME_RANGES.map((r) => (
            <Chip
              role="radio"
              key={r.id}
              label={r.label}
              selected={incomeRange === r.id}
              onPress={() => {
                haptics.tick();
                set({ incomeRange: r.id });
              }}
            />
          ))}
        </View>
        <Text variant="caption" tone="inkMuted">
          Lo usamos para calcular cuánto te queda disponible. Lo cambias cuando quieras.
        </Text>
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: space[3],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
  },
});
