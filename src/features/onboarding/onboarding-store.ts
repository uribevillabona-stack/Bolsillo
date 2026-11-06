/**
 * Borrador del onboarding mientras el usuario avanza por las 4 pantallas.
 * Solo se escribe en la base de datos al final (`completeOnboarding`): si
 * cierra la app a mitad de camino, empieza de nuevo sin datos a medias.
 */
import { create } from 'zustand';

import type { Db } from '@/db/client';
import { goals, profile } from '@/db/schema';
import { PROFILE_ID } from '@/features/profile/profile-repo';
import { and, eq } from 'drizzle-orm';

import { estimateForRange, parseTypedAmount, type GoalDraft } from './onboarding-data';

interface OnboardingDraft {
  name: string;
  incomeType: string | null;
  incomeRange: string | null;
  goal: GoalDraft;
  diagnostic: Record<string, string>;
}

interface OnboardingState extends OnboardingDraft {
  set: (patch: Partial<OnboardingDraft>) => void;
  answer: (questionId: string, optionId: string) => void;
  reset: () => void;
}

const initial: OnboardingDraft = {
  name: '',
  incomeType: null,
  incomeRange: null,
  goal: { name: '', amountText: '' },
  diagnostic: {},
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initial,
  set: (patch) => set(patch),
  answer: (questionId, optionId) =>
    set((s) => ({ diagnostic: { ...s.diagnostic, [questionId]: optionId } })),
  reset: () => set(initial),
}));

/** Guarda todo el onboarding en una sola transacción. */
export function completeOnboarding(
  db: Db,
  draft: OnboardingDraft,
  detectionConsent: boolean,
): void {
  const goalAmount = parseTypedAmount(draft.goal.amountText);
  const goalName = draft.goal.name.trim();

  db.transaction((tx) => {
    const { changes } = tx
      .update(profile)
      .set({
        name: draft.name.trim(),
        incomeType: draft.incomeType,
        incomeRange: draft.incomeRange,
        monthlyIncomeEstimate: estimateForRange(draft.incomeRange),
        diagnostic: draft.diagnostic,
        detectionConsent,
        onboardingDone: true,
      })
      // Solo si no estaba terminado: un segundo guardado nunca pisa el perfil.
      .where(and(eq(profile.id, PROFILE_ID), eq(profile.onboardingDone, false)))
      .run();
    if (changes === 0) return; // ya estaba terminado: no duplicar el Apartado

    if (goalName && goalAmount) {
      tx.insert(goals).values({ name: goalName, targetAmount: goalAmount }).run();
    }
  });
}
