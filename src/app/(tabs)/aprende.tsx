/**
 * Aprende: micro-lecciones conectadas con los datos del usuario.
 *
 * Arriba, la racha semanal (mantequilla = aprendizaje y logros). Luego la
 * lección sugerida con el porqué ("Tus gastos hormiga van 35 % arriba") y la
 * lista completa: nada está bloqueado.
 */
import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  BookOpenTextIcon,
  Button,
  CheckIcon,
  ListRow,
  ProgressBar,
  Screen,
  Text,
} from '@/components';
import { QUICK_ADD_BUTTON_CLEARANCE } from '@/components/QuickAddButton';
import { STREAK_WEEKS_SHOWN, useLearn } from '@/features/learn/use-learn';
import { useMonthOverview } from '@/features/overview/use-month-overview';
import { useNow } from '@/lib/use-now';
import { hairline, radius, space, useTheme } from '@/theme';

export default function AprendeScreen() {
  const { colors } = useTheme();
  const now = useNow();
  const { budgets, goals } = useMonthOverview(now);
  const tight = budgets.find((b) => b.status !== 'ok');
  const { lessons, completedIds, completedCount, streak, recent, next } = useLearn(now, {
    tightBudget: tight?.categoryName ?? null,
    goalsCount: goals.length,
  });

  const open = (id: string) => router.push(`/leccion/${id}` as Href);
  const weeksLabel = streak.weeks === 1 ? '1 semana' : `${streak.weeks} semanas`;

  return (
    <Screen bottomInset={QUICK_ADD_BUTTON_CLEARANCE}>
      <Text variant="display" accessibilityRole="header">
        Aprende
      </Text>
      <Text variant="body" tone="inkMuted" style={styles.lead}>
        Lecciones de 3 a 5 minutos sobre tu propia plata. Sin sermones.
      </Text>

      {/* Racha y progreso */}
      <View
        style={[styles.streak, { backgroundColor: colors.butter }]}
        accessible
        accessibilityLabel={`Racha semanal: ${weeksLabel}. ${completedCount} de ${lessons.length} lecciones terminadas.`}>
        <Text variant="overline" tone="onButter">
          Racha semanal
        </Text>
        <Text variant="amountLarge" tone="onButter">
          {weeksLabel}
        </Text>
        <View style={styles.weeks}>
          {recent.map((active, i) => (
            <View
              key={i}
              style={[
                styles.week,
                { borderColor: colors.onButter },
                active && { backgroundColor: colors.onButter },
              ]}
            />
          ))}
        </View>
        <Text variant="caption" tone="onButter">
          {streak.thisWeekDone
            ? 'Esta semana ya cuenta. Nos vemos la próxima.'
            : 'Una semana cuenta si terminas una lección o anotas gastos 3 días.'}
        </Text>
        <Text variant="caption" tone="onButter" style={styles.weeksCaption}>
          Últimas {STREAK_WEEKS_SHOWN} semanas
        </Text>
      </View>

      <View style={styles.progress}>
        <View style={styles.progressText}>
          <Text variant="label" tone="inkMuted">
            Lecciones terminadas
          </Text>
          <Text variant="label">
            {completedCount} de {lessons.length}
          </Text>
        </View>
        <ProgressBar
          progress={completedCount / lessons.length}
          tone="primary"
          accessibilityLabel="Lecciones terminadas"
        />
      </View>

      {/* Sugerida */}
      {next ? (
        <View style={[styles.section, { borderTopColor: colors.lineStrong }]}>
          <Text variant="overline" tone="inkMuted" accessibilityRole="header">
            Para ti ahora
          </Text>
          <Text variant="title">{next.lesson.title}</Text>
          <Text variant="body" tone="inkMuted">
            {next.reason}
          </Text>
          <Text variant="caption" tone="inkMuted">
            {next.lesson.minutes} min · {next.lesson.cards.length} tarjetas ·{' '}
            {next.lesson.quiz.length === 1 ? '1 pregunta' : `${next.lesson.quiz.length} preguntas`}
          </Text>
          <View style={styles.cta}>
            <Button
              label="Empezar"
              icon={BookOpenTextIcon}
              onPress={() => open(next.lesson.id)}
              testID="aprende-empezar"
            />
          </View>
        </View>
      ) : (
        <View style={[styles.section, { borderTopColor: colors.lineStrong }]}>
          <Text variant="title" accessibilityRole="header">
            Terminaste todas las lecciones.
          </Text>
          <Text variant="body" tone="inkMuted">
            Repasar también cuenta para tu racha. Pronto llegan más.
          </Text>
        </View>
      )}

      {/* Todas */}
      <View style={[styles.section, { borderTopColor: colors.lineStrong }]}>
        <Text variant="overline" tone="inkMuted" accessibilityRole="header">
          Todas las lecciones
        </Text>
        <View>
          {lessons.map((l, i) => {
            const done = completedIds.has(l.id);
            return (
              <ListRow
                key={l.id}
                title={l.title}
                subtitle={`${l.minutes} min · ${done ? 'Hecha' : l.summary}`}
                icon={done ? CheckIcon : BookOpenTextIcon}
                onPress={() => open(l.id)}
                accessibilityHint={done ? 'Repasar la lección' : 'Empezar la lección'}
                divider={i < lessons.length - 1}
              />
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: {
    marginTop: space[2],
    maxWidth: 300,
  },
  streak: {
    marginTop: space[8],
    padding: space[5],
    borderRadius: radius.md,
    gap: space[2],
  },
  weeks: {
    flexDirection: 'row',
    gap: space[1],
    marginVertical: space[1],
  },
  week: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  weeksCaption: {
    opacity: 0.8,
  },
  progress: {
    marginTop: space[6],
    gap: space[2],
  },
  progressText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  section: {
    marginTop: space[8],
    paddingTop: space[4],
    borderTopWidth: hairline,
    gap: space[2],
  },
  cta: {
    flexDirection: 'row',
    marginTop: space[2],
  },
});
