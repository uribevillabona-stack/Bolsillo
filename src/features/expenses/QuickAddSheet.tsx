/**
 * Registro rápido de gastos hormiga.
 *
 * Flujo de 1 toque: tocar un atajo ("Tinto $ 2.500") llena monto y
 * categoría; "Guardar" lo registra y ofrece deshacer por 5 segundos.
 * Para montos libres, el teclado propio. Categoría, fecha y nota son
 * opcionales y se cambian sin salir del sheet (el panel inferior alterna
 * entre teclado, categorías y nota, así el sheet no cambia de alto).
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import {
  AmountText,
  Button,
  CalendarBlankIcon,
  Chip,
  NotePencilIcon,
  NumericKeypad,
  Sheet,
  showSnackbar,
  TagIcon,
  Text,
  TextField,
  useSheetError,
} from '@/components';
import { db } from '@/db/client';
import { useCategories, useShortcuts } from '@/db/hooks';
import type { TransactionSource } from '@/db/schema';
import { hitMessage } from '@/features/budget/budget-logic';
import { checkBudgetAlert, reconcileBudgetAlerts } from '@/features/budget/budget-repo';
import { iconFor } from '@/features/categories/category-icons';
import { daysLeftInMonth } from '@/lib/dates';
import { haptics } from '@/lib/haptics';
import { digitsToAmount, formatCOP } from '@/lib/money';
import { space } from '@/theme';

import {
  DAY_OPTIONS,
  nextDayOption,
  NOTE_MAX,
  occurredAtFor,
  savedMessage,
} from './quick-add-logic';
import { addExpense, deleteTransaction } from './transactions-repo';

type Panel = 'keypad' | 'category' | 'note';

export interface QuickAddSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function QuickAddSheet({ visible, onClose }: QuickAddSheetProps) {
  const shortcuts = useShortcuts();
  const categories = useCategories('expense');
  const { error, showError } = useSheetError(visible);

  const [digits, setDigits] = useState('');
  const [shortcutId, setShortcutId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [dayOption, setDayOption] = useState(0);
  const [note, setNote] = useState('');
  const [panel, setPanel] = useState<Panel>('keypad');

  // Se limpia al ABRIR (estado derivado en render), no al cerrar: así el
  // sheet no se ve vacío mientras baja en la animación de salida.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setDigits('');
      setShortcutId(null);
      setCategoryId(null);
      setDayOption(0);
      setNote('');
      setPanel('keypad');
    }
  }

  const amount = digitsToAmount(digits);
  const shortcut = shortcuts.find((s) => s.id === shortcutId) ?? null;
  const category = categories.find((c) => c.id === categoryId) ?? null;
  const CategoryIcon = category ? iconFor(category.icon) : TagIcon;

  const save = () => {
    const source: TransactionSource = shortcut ? 'shortcut' : 'manual';
    const label = shortcut?.label ?? category?.name ?? null;
    const now = new Date();
    let row: ReturnType<typeof addExpense>;
    try {
      row = addExpense(db, {
        amount,
        categoryId,
        note,
        occurredAt: occurredAtFor(dayOption, now),
        source,
      });
    } catch {
      // El sheet sigue abierto con lo escrito para reintentar.
      haptics.reject();
      showError('No se pudo guardar el gasto. Intenta de nuevo.');
      return;
    }
    // Alerta suave del presupuesto: va en el mismo snackbar, sin diálogos.
    // Si falla, el gasto ya quedó guardado: se confirma sin la alerta.
    let hit: ReturnType<typeof checkBudgetAlert> = null;
    try {
      hit = checkBudgetAlert(db, categoryId, row.occurredAt, now);
    } catch {
      hit = null;
    }
    haptics.confirm();
    onClose();
    const saved = savedMessage(label, formatCOP(amount));
    showSnackbar(
      hit ? `${saved}. ${hitMessage(hit, daysLeftInMonth(now), formatCOP)}` : saved,
      {
        label: 'Deshacer',
        onPress: () => {
          deleteTransaction(db, row.id);
          reconcileBudgetAlerts(db, row.categoryId, new Date());
        },
      },
      hit ? 'alert' : 'default',
    );
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Registrar gasto" hideTitle error={error}>
      <View style={styles.header}>
        <Text variant="overline" tone="inkMuted">
          {shortcut?.label ?? category?.name ?? 'Nuevo gasto'}
        </Text>
        <AmountText
          amount={amount}
          size="hero"
          tone={amount === 0 ? 'inkMuted' : 'ink'}
          accessibilityLiveRegion="polite"
          testID="quick-add-amount"
        />
      </View>

      <View style={styles.details}>
        <Chip
          label={category?.name ?? 'Categoría'}
          icon={CategoryIcon}
          selected={panel === 'category'}
          accessibilityHint={
            panel === 'category' ? 'Cierra la lista de categorías' : 'Abre la lista de categorías'
          }
          onPress={() => setPanel(panel === 'category' ? 'keypad' : 'category')}
        />
        <Chip
          label={DAY_OPTIONS[dayOption]!.label}
          icon={CalendarBlankIcon}
          accessibilityHint="Cambia el día del gasto"
          onPress={() => {
            haptics.tick();
            setDayOption(nextDayOption(dayOption));
          }}
        />
        <Chip
          label={note.trim() ? truncate(note.trim(), 16) : 'Nota'}
          icon={NotePencilIcon}
          selected={panel === 'note'}
          accessibilityHint={
            panel === 'note' ? 'Cierra la nota' : 'Abre el campo para escribir una nota'
          }
          onPress={() => setPanel(panel === 'note' ? 'keypad' : 'note')}
        />
      </View>

      {panel === 'keypad' ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rowContent}
            style={styles.rowScroll}>
            {shortcuts.map((s) => (
              <Chip
                key={s.id}
                label={s.label}
                icon={iconFor(s.icon)}
                amount={s.amount}
                selected={shortcutId === s.id}
                onPress={() => {
                  haptics.tick();
                  setShortcutId(s.id);
                  setCategoryId(s.categoryId);
                  setDigits(String(s.amount));
                }}
              />
            ))}
          </ScrollView>
          <NumericKeypad
            value={digits}
            onChange={(next) => {
              setDigits(next);
              // Si edita el monto a mano, ya no es el atajo (la categoría se mantiene).
              if (shortcutId !== null) setShortcutId(null);
            }}
          />
        </>
      ) : null}

      {panel === 'category' ? (
        <View style={styles.categoryGrid} accessibilityRole="radiogroup">
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
                setShortcutId(null);
                setPanel('keypad');
              }}
            />
          ))}
        </View>
      ) : null}

      {panel === 'note' ? (
        <View style={styles.notePanel}>
          <TextField
            label="Nota (opcional)"
            value={note}
            onChangeText={setNote}
            maxLength={NOTE_MAX}
            placeholder="Con quién, dónde, por qué…"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => setPanel('keypad')}
          />
          <Button label="Listo" variant="outline" onPress={() => setPanel('keypad')} />
        </View>
      ) : null}

      <View style={styles.footer}>
        <Button
          label="Guardar"
          variant="accent"
          size="lg"
          block
          disabled={amount === 0}
          testID="quick-add-save"
          onPress={save}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: space[1],
    marginBottom: space[3],
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
    marginBottom: space[3],
  },
  rowScroll: {
    marginHorizontal: -space[5],
    marginBottom: space[3],
    flexGrow: 0,
  },
  rowContent: {
    gap: space[2],
    paddingHorizontal: space[5],
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
    paddingVertical: space[2],
  },
  notePanel: {
    gap: space[3],
    paddingVertical: space[2],
  },
  footer: {
    marginTop: space[3],
  },
});

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
