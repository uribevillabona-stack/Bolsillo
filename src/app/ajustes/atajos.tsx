/**
 * Ajustes → Atajos: los botones de un toque del registro rápido.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ListRow, PlusIcon, Screen, Text } from '@/components';
import { useShortcuts } from '@/db/hooks';
import type { Shortcut } from '@/db/schema';
import { iconFor } from '@/features/categories/category-icons';
import { BackHeader } from '@/features/shared/BackHeader';
import { ShortcutSheet } from '@/features/shortcuts/ShortcutSheet';
import { space } from '@/theme';

export default function AtajosScreen() {
  const shortcuts = useShortcuts();
  const [target, setTarget] = useState<Shortcut | 'new' | null>(null);

  return (
    <Screen>
      <BackHeader title="Atajos" />
      <Text variant="body" tone="inkMuted" style={styles.lead}>
        Lo que compras seguido, a un toque. Aparecen arriba del teclado cuando registras un gasto.
      </Text>

      <View style={styles.list}>
        {shortcuts.length === 0 ? (
          <Text variant="body" tone="inkMuted">
            No tienes atajos. Crea uno con lo que más compras.
          </Text>
        ) : (
          shortcuts.map((s, i) => (
            <ListRow
              key={s.id}
              title={s.label}
              icon={iconFor(s.icon)}
              amount={s.amount}
              onPress={() => setTarget(s)}
              accessibilityHint="Editar o eliminar el atajo"
              divider={i < shortcuts.length - 1}
            />
          ))
        )}
      </View>

      <Button
        label="Nuevo atajo"
        variant="outline"
        icon={PlusIcon}
        onPress={() => setTarget('new')}
      />

      <ShortcutSheet target={target} onClose={() => setTarget(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: {
    marginTop: space[2],
    maxWidth: 340,
  },
  list: {
    marginVertical: space[6],
  },
});
