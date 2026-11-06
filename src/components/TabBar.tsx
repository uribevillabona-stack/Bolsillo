/**
 * Barra de pestañas propia.
 *
 * Diseño: barra plana con borde superior de 1px (sin sombra ni blur). La
 * pestaña activa se marca con tinta y una línea corta encima del ícono; las
 * inactivas en tono secundario. El botón flotante de registro vive aparte
 * (QuickAddButton), para que su área táctil no quede fuera de este contenedor.
 */
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { hairline, minTouchTarget, useTheme } from '@/theme';

import { BookOpenTextIcon, HouseIcon, ReceiptIcon, TargetIcon, type Icon } from './icons';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

/** Ícono y nombre visible de cada ruta de `src/app/(tabs)/`. */
const TABS: Record<string, { label: string; icon: Icon }> = {
  index: { label: 'Inicio', icon: HouseIcon },
  movimientos: { label: 'Movimientos', icon: ReceiptIcon },
  aprende: { label: 'Aprende', icon: BookOpenTextIcon },
  plan: { label: 'Plan', icon: TargetIcon },
};

export const TAB_BAR_HEIGHT = 64;
export function TabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: colors.bg,
          borderTopColor: colors.line,
          paddingBottom: insets.bottom,
          height: TAB_BAR_HEIGHT + insets.bottom,
        },
      ]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = index === state.index;
        const tint = focused ? colors.ink : colors.inkMuted;
        const TabIcon = tab.icon;

        return (
          <PressableScale
            key={route.key}
            testID={`tab-${route.name}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            scaleTo={0.94}
            onPress={() => {
              const event = emitter.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                haptics.tick();
                navigateToTab(route.key);
              }
            }}
            style={styles.tab}>
            <View
              style={[styles.indicator, { backgroundColor: focused ? colors.ink : 'transparent' }]}
            />
            <TabIcon size={24} color={tint} weight={focused ? 'bold' : 'regular'} />
            <Text variant="caption" style={[styles.label, { color: tint }]} numberOfLines={1}>
              {tab.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: hairline,
  },
  tab: {
    flex: 1,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 2,
    borderRadius: 1,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
  },
});
