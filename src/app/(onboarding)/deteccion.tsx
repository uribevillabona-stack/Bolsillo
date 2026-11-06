/**
 * Onboarding 4/4: consentimiento para la detección automática.
 *
 * Opcional y explicado en lenguaje simple. El permiso real del sistema se
 * pide en la Fase 3, cuando el módulo nativo exista; aquí solo se guarda la
 * decisión del usuario. Decir que no es igual de fácil que decir que sí.
 */
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ShieldCheckIcon, Text } from '@/components';
import { db } from '@/db/client';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { completeOnboarding, useOnboardingStore } from '@/features/onboarding/onboarding-store';
import { haptics } from '@/lib/haptics';
import { space, useTheme } from '@/theme';

const PROMISES = [
  'Solo leemos las notificaciones de tus apps del banco: Nequi, Daviplata, Bancolombia y otras.',
  'Todo se procesa en tu teléfono. El texto de tus notificaciones nunca sale de aquí.',
  'Nunca leemos tus SMS ni tus chats.',
  'Cada movimiento lo confirmas tú antes de que se guarde.',
  'La apagas cuando quieras en Ajustes.',
];

export default function DeteccionStep() {
  const { colors } = useTheme();
  // Candado contra doble toque: la pantalla sigue montada unos frames después
  // de guardar, y un segundo toque guardaría el borrador ya vacío.
  const finishing = useRef(false);

  const finish = (consent: boolean) => {
    if (finishing.current) return;
    finishing.current = true;
    const draft = useOnboardingStore.getState();
    completeOnboarding(db, draft, consent);
    haptics.success();
    useOnboardingStore.getState().reset();
    // El layout raíz cambia de grupo solo (Stack.Protected) al ver onboardingDone.
  };

  return (
    <OnboardingStep
      step={4}
      title="¿Anotamos tus movimientos por ti?"
      lead="Cuando tu app del banco te avisa de una compra o transferencia, BOLSILLO puede proponerte el movimiento ya llenado."
      footer={
        <>
          <Button label="Sí, quiero activarla" size="lg" block onPress={() => finish(true)} />
          <Button label="Ahora no" variant="quiet" block onPress={() => finish(false)} />
        </>
      }>
      <View style={styles.list}>
        {PROMISES.map((p) => (
          <View key={p} style={styles.item}>
            <ShieldCheckIcon size={22} color={colors.primary} />
            <Text variant="body" style={styles.itemText}>
              {p}
            </Text>
          </View>
        ))}
      </View>
      <Text variant="caption" tone="inkMuted">
        Si dices que sí, te pediremos el permiso de Android en cuanto la función esté lista. Solo
        funciona en Android: iOS no lo permite.
      </Text>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: space[4],
  },
  item: {
    flexDirection: 'row',
    gap: space[3],
    alignItems: 'flex-start',
  },
  itemText: {
    flex: 1,
  },
});
