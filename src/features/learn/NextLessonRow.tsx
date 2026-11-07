/**
 * "Próxima lección" en Inicio: una sola línea, con el porqué.
 */
import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BookOpenTextIcon, CaretRightIcon, Text } from '@/components';
import { PressableScale } from '@/components/PressableScale';
import { hairline, radius, space, useTheme } from '@/theme';

import type { NextLesson } from './learn-logic';

export function NextLessonRow({ next }: { next: NextLesson }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={() => router.push(`/leccion/${next.lesson.id}` as Href)}
      scaleTo={0.99}
      accessibilityRole="button"
      accessibilityLabel={`Próxima lección: ${next.lesson.title}, ${next.lesson.minutes} minutos. ${next.reason}`}
      accessibilityHint="Abre la lección"
      testID="proxima-leccion"
      style={[styles.row, { borderTopColor: colors.line }]}>
      <View style={[styles.mark, { backgroundColor: colors.butter }]}>
        <BookOpenTextIcon size={20} color={colors.onButter} />
      </View>
      <View style={styles.text}>
        <Text variant="overline" tone="inkMuted">
          Próxima lección · {next.lesson.minutes} min
        </Text>
        <Text variant="bodyStrong">{next.lesson.title}</Text>
        <Text variant="caption" tone="inkMuted" numberOfLines={2}>
          {next.reason}
        </Text>
      </View>
      <CaretRightIcon size={16} color={colors.inkMuted} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: space[8],
    paddingTop: space[4],
    borderTopWidth: hairline,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  mark: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
