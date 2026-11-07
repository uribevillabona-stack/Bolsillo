/**
 * Crear o editar un Apartado: nombre, monto y (opcional) para cuándo.
 *
 * La fecha se escoge por mes, no por día: "para junio" es como la gente
 * piensa una meta, y evita traer un selector de fechas como dependencia.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  CaretLeftIcon,
  CaretRightIcon,
  Chip,
  Sheet,
  showSnackbar,
  Text,
  TextField,
  TrashIcon,
} from '@/components';
import { PressableScale } from '@/components/PressableScale';
import { db } from '@/db/client';
import type { Goal } from '@/db/schema';
import { parseTypedAmount } from '@/features/onboarding/onboarding-data';
import { addMonths, endOfMonth, monthYearLabel, startOfMonth } from '@/lib/dates';
import { haptics } from '@/lib/haptics';
import { formatCOP } from '@/lib/money';
import { hairline, minTouchTarget, radius, space, useTheme } from '@/theme';

import { GOAL_NAME_MAX, validateGoal } from './goal-logic';
import { createGoal, deleteGoal, restoreGoal, updateGoal } from './goals-repo';

/** Atajos de plazo, en meses desde el actual. */
const QUICK_MONTHS = [3, 6, 12] as const;
/** Hasta dónde deja ir el selector (5 años). */
const MAX_MONTHS_AHEAD = 60;

export interface GoalSheetProps {
  /** null = cerrado; 'new' = crear; un Apartado = editarlo. */
  target: Goal | 'new' | null;
  onClose: () => void;
  /** Tras eliminar (p. ej. para salir del detalle). */
  onDeleted?: () => void;
}

export function GoalSheet({ target, onClose, onDeleted }: GoalSheetProps) {
  const { colors } = useTheme();
  // Lo último que se abrió: al cerrar, `target` pasa a null, pero el título
  // no debe cambiar mientras el sheet baja.
  const [shown, setShown] = useState(target);
  const current = target ?? shown;
  const editing = current !== null && current !== 'new' ? current : null;

  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [month, setMonth] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [loadedFor, setLoadedFor] = useState<typeof target>(null);
  if (target !== loadedFor) {
    setLoadedFor(target);
    if (target !== null) {
      setShown(target);
      setName(editing?.name ?? '');
      setAmountText(editing ? String(editing.targetAmount) : '');
      setMonth(editing?.targetDate ? startOfMonth(new Date(editing.targetDate)) : null);
      setError(null);
    }
  }

  const now = new Date();
  const thisMonth = startOfMonth(now);
  const amount = parseTypedAmount(amountText);
  const offset =
    month === null
      ? null
      : (month.getFullYear() - thisMonth.getFullYear()) * 12 +
        (month.getMonth() - thisMonth.getMonth());

  const step = (delta: number) => {
    const base = month ?? thisMonth;
    const next = addMonths(base, delta);
    const nextOffset =
      (next.getFullYear() - thisMonth.getFullYear()) * 12 +
      (next.getMonth() - thisMonth.getMonth());
    if (nextOffset > MAX_MONTHS_AHEAD) return;
    haptics.tick();
    // Un Apartado con fecha vencida arranca desde este mes al moverlo.
    setMonth(nextOffset < 0 ? thisMonth : next);
  };

  const save = () => {
    const input = {
      name,
      targetAmount: amount ?? 0,
      targetDate: month ? endOfMonth(month).getTime() : null,
    };
    const problem = validateGoal(input);
    if (problem) {
      setError(problem);
      haptics.reject();
      return;
    }
    try {
      if (editing) updateGoal(db, editing.id, input);
      else createGoal(db, input);
    } catch {
      haptics.reject();
      showSnackbar('No se pudo guardar. Intenta de nuevo.');
      return;
    }
    haptics.confirm();
    onClose();
    showSnackbar(editing ? 'Apartado actualizado' : `Apartado "${name.trim()}" creado`);
  };

  const remove = () => {
    if (!editing) return;
    let deleted: ReturnType<typeof deleteGoal>;
    try {
      deleted = deleteGoal(db, editing.id);
    } catch {
      haptics.reject();
      showSnackbar('No se pudo eliminar. Intenta de nuevo.');
      return;
    }
    haptics.confirm();
    onClose();
    onDeleted?.();
    if (deleted) {
      showSnackbar(`Eliminaste "${deleted.goal.name}"`, {
        label: 'Deshacer',
        onPress: () => restoreGoal(db, deleted),
      });
    }
  };

  return (
    <Sheet
      visible={target !== null}
      onClose={onClose}
      title={editing ? 'Editar Apartado' : 'Nuevo Apartado'}>
      <View style={styles.form}>
        <TextField
          label="¿Para qué es?"
          value={name}
          onChangeText={(t) => {
            setName(t);
            setError(null);
          }}
          placeholder="Viaje a Santa Marta, portátil, matrícula…"
          maxLength={GOAL_NAME_MAX}
          autoCapitalize="sentences"
        />
        <TextField
          label="¿Cuánto necesitas?"
          value={amount ? formatCOP(amount) : amountText}
          onChangeText={(t) => {
            setAmountText(t.replace(/\D/g, ''));
            setError(null);
          }}
          keyboardType="number-pad"
          placeholder="$ 0"
          error={error}
        />

        <View style={styles.group}>
          <Text variant="label" tone="inkMuted">
            ¿Para cuándo?
          </Text>
          <View style={styles.chips} accessibilityRole="radiogroup">
            <Chip
              role="radio"
              label="Sin fecha"
              selected={month === null}
              onPress={() => {
                haptics.tick();
                setMonth(null);
              }}
            />
            {QUICK_MONTHS.map((m) => (
              <Chip
                role="radio"
                key={m}
                label={m === 12 ? '1 año' : `${m} meses`}
                selected={offset === m - 1}
                onPress={() => {
                  haptics.tick();
                  setMonth(addMonths(thisMonth, m - 1));
                }}
              />
            ))}
          </View>

          {month ? (
            <View style={[styles.stepper, { borderColor: colors.line }]}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Un mes antes"
                disabled={offset === 0}
                onPress={() => step(-1)}
                style={styles.stepButton}>
                <CaretLeftIcon size={20} color={offset === 0 ? colors.line : colors.ink} />
              </PressableScale>
              <Text
                variant="bodyStrong"
                style={styles.stepLabel}
                accessibilityLiveRegion="polite"
                accessibilityLabel={`Meta para ${monthYearLabel(month, now)}`}>
                {capitalize(monthYearLabel(month, now))}
              </Text>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Un mes después"
                onPress={() => step(1)}
                style={styles.stepButton}>
                <CaretRightIcon size={20} color={colors.ink} />
              </PressableScale>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label={editing ? 'Guardar cambios' : 'Crear Apartado'}
          size="lg"
          block
          onPress={save}
        />
        {editing ? (
          <Button
            label="Eliminar Apartado"
            variant="quiet"
            icon={TrashIcon}
            block
            onPress={remove}
          />
        ) : null}
      </View>
    </Sheet>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const styles = StyleSheet.create({
  form: {
    gap: space[4],
  },
  group: {
    gap: space[2],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: hairline,
    borderRadius: radius.sm,
    marginTop: space[1],
  },
  stepButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    flex: 1,
    textAlign: 'center',
  },
  actions: {
    marginTop: space[6],
    gap: space[1],
  },
});
