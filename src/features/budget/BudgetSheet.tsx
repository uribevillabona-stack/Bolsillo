/**
 * Poner, cambiar o quitar el tope de una categoría.
 *
 * Nuevo: primero la categoría, luego el monto (sugerido con lo que gastó el
 * mes pasado, para no arrancar de cero). Editar: directo al monto.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AmountText,
  Button,
  Chip,
  NumericKeypad,
  Sheet,
  showSnackbar,
  Text,
  TrashIcon,
} from '@/components';
import { db } from '@/db/client';
import { useCategories } from '@/db/hooks';
import { iconFor } from '@/features/categories/category-icons';
import { haptics } from '@/lib/haptics';
import { digitsToAmount, formatCOP } from '@/lib/money';
import { space } from '@/theme';

import { suggestedLimit, type BudgetLine } from './budget-logic';
import { removeBudget, restoreBudget, setBudget } from './budget-repo';

export type BudgetSheetTarget = { mode: 'new' } | { mode: 'edit'; line: BudgetLine } | null;

export interface BudgetSheetProps {
  target: BudgetSheetTarget;
  onClose: () => void;
  /** Categorías que ya tienen tope (no se ofrecen al crear). */
  takenCategoryIds: ReadonlySet<number>;
  spentThisMonth: ReadonlyMap<number, number>;
  spentLastMonth: ReadonlyMap<number, number>;
}

export function BudgetSheet({
  target,
  onClose,
  takenCategoryIds,
  spentThisMonth,
  spentLastMonth,
}: BudgetSheetProps) {
  const categories = useCategories('expense');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [digits, setDigits] = useState('');

  // Lo último que se abrió: el título no cambia mientras el sheet baja.
  const [shown, setShown] = useState<BudgetSheetTarget>(target);
  const current = target ?? shown;

  const [loadedFor, setLoadedFor] = useState<BudgetSheetTarget>(null);
  if (target !== loadedFor) {
    setLoadedFor(target);
    if (target !== null) setShown(target);
    if (target?.mode === 'edit') {
      setCategoryId(target.line.categoryId);
      setDigits(String(target.line.limitAmount));
    } else if (target?.mode === 'new') {
      setCategoryId(null);
      setDigits('');
    }
  }

  const editing = current?.mode === 'edit' ? current.line : null;
  const category = categories.find((c) => c.id === categoryId) ?? null;
  const available = categories.filter((c) => !takenCategoryIds.has(c.id));
  const amount = digitsToAmount(digits);
  const lastMonth = categoryId !== null ? (spentLastMonth.get(categoryId) ?? 0) : 0;
  const thisMonth = categoryId !== null ? (spentThisMonth.get(categoryId) ?? 0) : 0;

  const choose = (id: number) => {
    haptics.tick();
    setCategoryId(id);
    const suggestion = suggestedLimit(spentLastMonth.get(id) ?? 0);
    setDigits(suggestion > 0 ? String(suggestion) : '');
  };

  const save = () => {
    if (categoryId === null || amount === 0) return;
    try {
      setBudget(db, categoryId, amount, new Date());
    } catch {
      haptics.reject();
      showSnackbar('No se pudo guardar. Intenta de nuevo.');
      return;
    }
    haptics.confirm();
    onClose();
    showSnackbar(
      editing
        ? `Tope de ${category?.name ?? 'la categoría'}: ${formatCOP(amount)}`
        : `Listo: ${formatCOP(amount)} al mes para ${category?.name ?? 'la categoría'}`,
    );
  };

  const remove = () => {
    if (!editing) return;
    let removed: ReturnType<typeof removeBudget>;
    try {
      removed = removeBudget(db, editing.categoryId);
    } catch {
      haptics.reject();
      showSnackbar('No se pudo quitar el tope. Intenta de nuevo.');
      return;
    }
    haptics.confirm();
    onClose();
    if (removed) {
      showSnackbar(`Quitaste el tope de ${editing.categoryName}`, {
        label: 'Deshacer',
        onPress: () => restoreBudget(db, removed),
      });
    }
  };

  const picking = current?.mode === 'new' && categoryId === null;
  const title = editing
    ? `Tope de ${editing.categoryName}`
    : picking
      ? '¿A qué le pones tope?'
      : `Tope de ${category?.name ?? ''}`;

  return (
    <Sheet visible={target !== null} onClose={onClose} title={title}>
      {picking ? (
        available.length === 0 ? (
          <Text variant="body" tone="inkMuted">
            Todas tus categorías ya tienen tope.
          </Text>
        ) : (
          <View style={styles.chips} accessibilityRole="radiogroup">
            {available.map((c) => (
              <Chip
                role="radio"
                key={c.id}
                label={c.name}
                icon={iconFor(c.icon)}
                selected={false}
                onPress={() => choose(c.id)}
              />
            ))}
          </View>
        )
      ) : (
        <>
          <Text variant="caption" tone="inkMuted" style={styles.hint}>
            {hintFor(lastMonth, thisMonth)}
          </Text>
          <AmountText
            amount={amount}
            size="hero"
            tone={amount === 0 ? 'inkMuted' : 'ink'}
            accessibilityLiveRegion="polite"
          />
          <Text variant="caption" tone="inkMuted">
            al mes · te avisamos al 80 %
          </Text>
          <View style={styles.keypad}>
            <NumericKeypad value={digits} onChange={setDigits} />
          </View>
          <View style={styles.actions}>
            <Button
              label={editing ? 'Guardar tope' : 'Poner tope'}
              size="lg"
              block
              disabled={amount === 0}
              onPress={save}
            />
            {editing ? (
              <Button label="Quitar tope" variant="quiet" icon={TrashIcon} block onPress={remove} />
            ) : (
              <Button
                label="Cambiar categoría"
                variant="quiet"
                block
                onPress={() => setCategoryId(null)}
              />
            )}
          </View>
        </>
      )}
    </Sheet>
  );
}

function hintFor(lastMonth: number, thisMonth: number): string {
  const parts: string[] = [];
  if (lastMonth > 0) parts.push(`El mes pasado gastaste ${formatCOP(lastMonth)}.`);
  if (thisMonth > 0) parts.push(`Este mes vas en ${formatCOP(thisMonth)}.`);
  return parts.length > 0
    ? parts.join(' ')
    : 'Un número que puedas cumplir: lo cambias cuando quieras.';
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
  },
  hint: {
    marginBottom: space[2],
  },
  keypad: {
    marginVertical: space[3],
  },
  actions: {
    gap: space[1],
  },
});
