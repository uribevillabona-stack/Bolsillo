/**
 * Onboarding 2/4: primer Apartado (opcional).
 */
import { router } from 'expo-router';
import { useState } from 'react';

import { Button, TextField } from '@/components';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import {
  GOAL_NAME_MAX,
  parseTypedAmount,
  validateGoalDraft,
} from '@/features/onboarding/onboarding-data';
import { useOnboardingStore } from '@/features/onboarding/onboarding-store';
import { formatCOP } from '@/lib/money';

export default function MetaStep() {
  const { goal, set } = useOnboardingStore();
  const [touched, setTouched] = useState(false);
  const error = touched ? validateGoalDraft(goal) : null;
  const amount = parseTypedAmount(goal.amountText);

  return (
    <OnboardingStep
      step={2}
      title="¿Para qué quieres ahorrar?"
      lead="Un Apartado es plata separada para algo concreto: el portátil, el viaje, la matrícula. Es opcional."
      footer={
        <>
          <Button
            label="Continuar"
            size="lg"
            block
            onPress={() => {
              setTouched(true);
              if (validateGoalDraft(goal) === null) router.push('/diagnostico');
            }}
          />
          <Button
            label="Ahora no"
            variant="quiet"
            block
            onPress={() => {
              set({ goal: { name: '', amountText: '' } });
              router.push('/diagnostico');
            }}
          />
        </>
      }>
      <TextField
        label="Nombre del Apartado"
        value={goal.name}
        onChangeText={(name) => set({ goal: { ...goal, name } })}
        placeholder="Portátil nuevo"
        maxLength={GOAL_NAME_MAX}
        autoCapitalize="sentences"
      />
      <TextField
        label="¿Cuánto necesitas?"
        value={amount ? formatCOP(amount) : goal.amountText}
        onChangeText={(text) => set({ goal: { ...goal, amountText: text.replace(/\D/g, '') } })}
        keyboardType="number-pad"
        placeholder="$ 0"
        error={error}
      />
    </OnboardingStep>
  );
}
