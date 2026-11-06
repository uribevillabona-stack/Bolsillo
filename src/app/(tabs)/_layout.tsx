/**
 * Pestañas principales: Inicio · Movimientos · Aprende · Plan.
 * El botón flotante de registro y el sheet viven aquí, así están disponibles
 * en las cuatro pestañas.
 */
import { Tabs } from 'expo-router/js-tabs';

import { QuickAddButton } from '@/components/QuickAddButton';
import { TabBar } from '@/components/TabBar';
import { QuickAddSheet } from '@/features/expenses/QuickAddSheet';
import { useQuickAddStore } from '@/features/expenses/quick-add-store';

export default function TabsLayout() {
  const { open, show, hide } = useQuickAddStore();

  return (
    <>
      <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="movimientos" />
        <Tabs.Screen name="aprende" />
        <Tabs.Screen name="plan" />
      </Tabs>
      <QuickAddButton onPress={show} />
      <QuickAddSheet visible={open} onClose={hide} />
    </>
  );
}
