/**
 * Pantalla de error de una ruta (ErrorBoundary de Expo Router). Si algo
 * falla al dibujar una pantalla, en vez de cerrarse la app muestra esto en
 * español, con "Reintentar". Los datos no se tocan: viven en SQLite.
 */
import type { ErrorBoundaryProps } from 'expo-router';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text } from '@/components';
import { screenGutter, space, useTheme } from '@/theme';

export function RouteError({ error, retry }: ErrorBoundaryProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space[8], paddingBottom: insets.bottom + space[6] },
      ]}
      accessibilityRole="alert">
      <Text variant="display" accessibilityRole="header">
        Algo se nos enredó.
      </Text>
      <Text variant="body" tone="inkMuted">
        Esta pantalla no cargó bien. Tus datos siguen guardados en el teléfono: no se perdió nada.
      </Text>
      <View style={styles.actions}>
        <Button label="Reintentar" size="lg" onPress={retry} />
        <Button
          label="Ir al inicio"
          variant="quiet"
          onPress={() => {
            router.replace('/');
            retry();
          }}
        />
      </View>
      <Text variant="mono" tone="inkMuted" selectable style={styles.detail}>
        {error.message}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: screenGutter,
    gap: space[3],
  },
  actions: {
    marginTop: space[4],
    gap: space[1],
    alignItems: 'flex-start',
  },
  detail: {
    marginTop: 'auto',
    fontSize: 12,
  },
});
