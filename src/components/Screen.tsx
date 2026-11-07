/**
 * Contenedor de pantalla: fondo del tema, márgenes laterales y área segura.
 * Todas las pantallas lo usan como raíz para que el aire y los márgenes sean
 * idénticos en toda la app.
 */
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { screenGutter, space, useTheme } from '@/theme';

export interface ScreenProps {
  children: ReactNode;
  /** Por defecto la pantalla hace scroll. */
  scroll?: boolean;
  /** Espacio extra al final (para que el botón flotante no tape contenido). */
  bottomInset?: number;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({ children, scroll = true, bottomInset = 0, contentStyle }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + space[6],
    paddingBottom: space[8] + bottomInset,
  };

  if (!scroll) {
    return (
      <View style={[styles.base, { backgroundColor: colors.bg }, padding, contentStyle]}>
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.base, padding, contentStyle]}
      // "handled": un toque en un botón no se gasta en cerrar el teclado. Importa
      // también para los sheets: el Modal cuelga de esta pantalla, y este scroll
      // (ancestro en el sistema de toques) se quedaba con el primer toque.
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  base: {
    flexGrow: 1,
    paddingHorizontal: screenGutter,
  },
});
