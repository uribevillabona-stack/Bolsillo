/**
 * Encabezado de pantallas secundarias: volver + título grande.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ArrowLeftIcon, Text } from '@/components';
import { PressableScale } from '@/components/PressableScale';
import { minTouchTarget, space, useTheme } from '@/theme';

export function BackHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <View>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={() => router.back()}
        style={styles.back}>
        <ArrowLeftIcon size={24} color={colors.ink} />
      </PressableScale>
      <Text variant="display" accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    width: minTouchTarget,
    height: minTouchTarget,
    justifyContent: 'center',
    marginLeft: -space[3],
    paddingLeft: space[3],
  },
  title: {
    marginTop: space[2],
  },
});
