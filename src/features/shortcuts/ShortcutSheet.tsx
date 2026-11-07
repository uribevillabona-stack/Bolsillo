/**
 * Crear o editar un atajo: nombre, monto y categoría. El ícono sale de la
 * categoría (un atajo de "Transporte" muestra el bus), así nadie tiene que
 * escoger entre 1.500 íconos.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Chip, Sheet, showSnackbar, Text, TextField, TrashIcon } from '@/components';
import { db } from '@/db/client';
import { useCategories } from '@/db/hooks';
import type { Shortcut } from '@/db/schema';
import { iconFor } from '@/features/categories/category-icons';
import { parseTypedAmount } from '@/features/onboarding/onboarding-data';
import { haptics } from '@/lib/haptics';
import { formatCOP } from '@/lib/money';
import { space } from '@/theme';

import {
  createShortcut,
  deleteShortcut,
  restoreShortcut,
  SHORTCUT_LABEL_MAX,
  updateShortcut,
  validateShortcut,
} from './shortcuts-repo';

export interface ShortcutSheetProps {
  /** null = cerrado; 'new' = crear; un atajo = editarlo. */
  target: Shortcut | 'new' | null;
  onClose: () => void;
}

export function ShortcutSheet({ target, onClose }: ShortcutSheetProps) {
  const categories = useCategories('expense');
  const editing = target !== null && target !== 'new' ? target : null;

  const [label, setLabel] = useState('');
  const [amountText, setAmountText] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Carga los valores al abrir (estado derivado en render).
  const [loadedFor, setLoadedFor] = useState<typeof target>(null);
  if (target !== loadedFor) {
    setLoadedFor(target);
    if (target !== null) {
      setLabel(editing?.label ?? '');
      setAmountText(editing ? String(editing.amount) : '');
      setCategoryId(editing?.categoryId ?? null);
      setError(null);
    }
  }

  const amount = parseTypedAmount(amountText);
  const category = categories.find((c) => c.id === categoryId);

  const save = () => {
    const input = {
      label,
      amount: amount ?? 0,
      categoryId,
      icon: category?.icon ?? 'etiqueta',
    };
    const problem = validateShortcut(input);
    if (problem) {
      setError(problem);
      haptics.reject();
      return;
    }
    try {
      if (editing) updateShortcut(db, editing.id, input);
      else createShortcut(db, input);
    } catch {
      haptics.reject();
      showSnackbar('No se pudo guardar. Intenta de nuevo.');
      return;
    }
    haptics.confirm();
    onClose();
    showSnackbar(editing ? 'Atajo actualizado' : `Atajo "${label.trim()}" creado`);
  };

  const remove = () => {
    if (!editing) return;
    let removed: ReturnType<typeof deleteShortcut>;
    try {
      removed = deleteShortcut(db, editing.id);
    } catch {
      haptics.reject();
      showSnackbar('No se pudo eliminar. Intenta de nuevo.');
      return;
    }
    haptics.confirm();
    onClose();
    if (removed) {
      showSnackbar(`Atajo "${removed.label}" eliminado`, {
        label: 'Deshacer',
        onPress: () => restoreShortcut(db, removed),
      });
    }
  };

  return (
    <Sheet
      visible={target !== null}
      onClose={onClose}
      title={editing ? 'Editar atajo' : 'Nuevo atajo'}>
      <View style={styles.form}>
        <TextField
          label="Nombre"
          value={label}
          onChangeText={(t) => {
            setLabel(t);
            setError(null);
          }}
          placeholder="Arepa, Gaseosa, Fotocopias…"
          maxLength={SHORTCUT_LABEL_MAX}
          autoCapitalize="sentences"
        />
        <TextField
          label="Monto"
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
            Categoría
          </Text>
          <View style={styles.chips} accessibilityRole="radiogroup">
            {categories.map((c) => (
              <Chip
                role="radio"
                key={c.id}
                label={c.name}
                icon={iconFor(c.icon)}
                selected={categoryId === c.id}
                onPress={() => {
                  haptics.tick();
                  setCategoryId(c.id);
                }}
              />
            ))}
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <Button
          label={editing ? 'Guardar cambios' : 'Crear atajo'}
          size="lg"
          block
          onPress={save}
        />
        {editing ? (
          <Button label="Eliminar atajo" variant="quiet" icon={TrashIcon} block onPress={remove} />
        ) : null}
      </View>
    </Sheet>
  );
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
  actions: {
    marginTop: space[6],
    gap: space[1],
  },
});
