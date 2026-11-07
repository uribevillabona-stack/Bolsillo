/**
 * Una micro-lección: tarjetas que se deslizan, 1 a 3 preguntas y el
 * resultado. Al terminar se guarda la lección como hecha (cuenta para la
 * racha). Repetirla está bien: se guarda otra vez con su puntaje.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  FlatList,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, CheckIcon, ConfettiIcon, showSnackbar, Text, XIcon } from '@/components';
import { PressableScale } from '@/components/PressableScale';
import { db } from '@/db/client';
import { quizScore, scoreMessage } from '@/features/learn/learn-logic';
import { recordCompletion } from '@/features/learn/learn-repo';
import { lessonById, type Lesson, type LessonCard } from '@/features/learn/lessons';
import { haptics } from '@/lib/haptics';
import { hairline, minTouchTarget, radius, screenGutter, space, useTheme } from '@/theme';

type Stage = 'cards' | 'quiz' | 'done';

export default function LeccionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = lessonById(id);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!lesson) {
    return (
      <View
        style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top + space[6] }]}>
        <View style={styles.gutter}>
          <Text variant="title">Esta lección no existe.</Text>
          <Button label="Volver" variant="outline" onPress={() => router.back()} />
        </View>
      </View>
    );
  }
  return <LessonPlayer lesson={lesson} />;
}

function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const list = useRef<FlatList<LessonCard>>(null);

  const [stage, setStage] = useState<Stage>('cards');
  const [cardIndex, setCardIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => lesson.quiz.map(() => null));
  const saved = useRef(false);
  // Respuestas ya tomadas, por pregunta. Un ref (no el estado) para que dos
  // toques en el mismo cuadro no cuenten como dos respuestas distintas.
  const answered = useRef(new Set<number>());

  const total = lesson.cards.length + lesson.quiz.length;
  const position =
    stage === 'cards'
      ? cardIndex + 1
      : stage === 'quiz'
        ? lesson.cards.length + questionIndex + 1
        : total;

  const goToCard = (next: number) => {
    if (next === cardIndex || next < 0 || next >= lesson.cards.length) return;
    haptics.tick();
    setCardIndex(next);
    const card = lesson.cards[next]!;
    AccessibilityInfo.announceForAccessibility(
      `Tarjeta ${next + 1} de ${lesson.cards.length}. ${card.title}`,
    );
  };

  // El índice sale de la posición del scroll (no solo del "momentum"), así
  // no se desfasa si la lista se mueve por otra vía.
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    goToCard(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const nextCard = () => {
    if (cardIndex < lesson.cards.length - 1) {
      list.current?.scrollToIndex({ index: cardIndex + 1, animated: true });
      goToCard(cardIndex + 1);
    } else {
      setStage('quiz');
      haptics.tap();
    }
  };

  const answer = (option: number) => {
    if (answered.current.has(questionIndex)) return;
    answered.current.add(questionIndex);
    const q = lesson.quiz[questionIndex]!;
    const correct = option === q.answer;
    if (correct) haptics.success();
    else haptics.reject();
    setAnswers((prev) => prev.map((a, i) => (i === questionIndex ? option : a)));
    AccessibilityInfo.announceForAccessibility(
      `${correct ? 'Bien' : 'No era esa'}. ${q.explanation}`,
    );
  };

  const nextQuestion = () => {
    if (questionIndex < lesson.quiz.length - 1) {
      setQuestionIndex(questionIndex + 1);
      return;
    }
    if (!saved.current) {
      try {
        recordCompletion(db, lesson.id, quizScore(answers, lesson.quiz), lesson.quiz.length);
        saved.current = true;
      } catch {
        // El resultado se muestra igual; solo no cuenta para la racha.
        showSnackbar('No pudimos guardar tu progreso. Repite la lección más tarde.');
      }
    }
    setStage('done');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top + space[3] }]}>
      {/* Encabezado: cerrar + avance */}
      <View style={[styles.header, styles.gutter]}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Cerrar la lección"
          onPress={() => router.back()}
          style={styles.close}>
          <XIcon size={24} color={colors.ink} />
        </PressableScale>
        <View
          style={styles.segments}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Paso ${position} de ${total}`}
          accessibilityValue={{ min: 0, max: total, now: position }}>
          {Array.from({ length: total }, (_, i) => (
            <View
              key={i}
              style={[styles.segment, { backgroundColor: i < position ? colors.ink : colors.line }]}
            />
          ))}
        </View>
      </View>

      {stage === 'cards' ? (
        <>
          <FlatList
            ref={list}
            data={lesson.cards}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={32}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            renderItem={({ item, index }) => (
              // Solo la tarjeta visible existe para el lector de pantalla: si no,
              // TalkBack saltaría a la siguiente y movería la lista por su cuenta.
              <View
                style={{ width }}
                importantForAccessibility={index === cardIndex ? 'auto' : 'no-hide-descendants'}
                accessibilityElementsHidden={index !== cardIndex}>
                <ScrollView contentContainerStyle={[styles.page, styles.grow]}>
                  <CardView card={item} index={index} count={lesson.cards.length} lesson={lesson} />
                </ScrollView>
              </View>
            )}
          />
          <View style={[styles.footer, styles.gutter, { paddingBottom: insets.bottom + space[4] }]}>
            <Button
              label={cardIndex < lesson.cards.length - 1 ? 'Siguiente' : 'Ir a las preguntas'}
              size="lg"
              block
              onPress={nextCard}
              testID="leccion-siguiente"
            />
          </View>
        </>
      ) : null}

      {stage === 'quiz' ? (
        <QuizView
          key={questionIndex}
          lesson={lesson}
          index={questionIndex}
          selected={answers[questionIndex] ?? null}
          onAnswer={answer}
          onNext={nextQuestion}
          bottomInset={insets.bottom}
        />
      ) : null}

      {stage === 'done' ? (
        <DoneView
          lesson={lesson}
          score={quizScore(answers, lesson.quiz)}
          bottomInset={insets.bottom}
        />
      ) : null}
    </View>
  );
}

function CardView({
  card,
  index,
  count,
  lesson,
}: {
  card: LessonCard;
  index: number;
  count: number;
  lesson: Lesson;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.card}>
      <Text variant="overline" tone="inkMuted">
        {index === 0 ? `${lesson.title} · ${lesson.minutes} min` : `${index + 1} de ${count}`}
      </Text>
      <Text variant="display" accessibilityRole="header">
        {card.title}
      </Text>
      {card.highlight ? (
        <View style={[styles.highlight, { backgroundColor: colors.butter }]}>
          <Text variant="amountMedium" tone="onButter">
            {card.highlight}
          </Text>
        </View>
      ) : null}
      <Text variant="body" style={styles.cardBody}>
        {card.body}
      </Text>
      {index === 0 && count > 1 ? (
        <Text variant="caption" tone="inkMuted" style={styles.swipeHint}>
          Desliza o toca Siguiente.
        </Text>
      ) : null}
    </View>
  );
}

function QuizView({
  lesson,
  index,
  selected,
  onAnswer,
  onNext,
  bottomInset,
}: {
  lesson: Lesson;
  index: number;
  selected: number | null;
  onAnswer: (option: number) => void;
  onNext: () => void;
  bottomInset: number;
}) {
  const { colors } = useTheme();
  const q = lesson.quiz[index]!;
  const answered = selected !== null;
  const correct = selected === q.answer;
  const last = index === lesson.quiz.length - 1;

  // Al llegar a una pregunta, se anuncia (el botón que tenía el foco desaparece).
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      `Pregunta ${index + 1} de ${lesson.quiz.length}. ${q.question}`,
    );
  }, [index, lesson.quiz.length, q.question]);

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.gutter, styles.quiz, styles.grow]}>
        <Text variant="overline" tone="inkMuted">
          Pregunta {index + 1} de {lesson.quiz.length}
        </Text>
        <Text variant="title" accessibilityRole="header">
          {q.question}
        </Text>
        <View style={styles.options} accessibilityRole="radiogroup">
          {q.options.map((label, i) => {
            const isAnswer = answered && i === q.answer;
            const isWrongPick = answered && i === selected && !correct;
            return (
              <PressableScale
                key={i}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected === i, disabled: answered }}
                accessibilityLabel={
                  isAnswer
                    ? `${label}. Respuesta correcta`
                    : isWrongPick
                      ? `${label}. Incorrecta`
                      : label
                }
                disabled={answered}
                onPress={() => onAnswer(i)}
                style={[
                  styles.option,
                  {
                    borderColor: isAnswer
                      ? colors.primary
                      : isWrongPick
                        ? colors.accent
                        : colors.line,
                    backgroundColor: isAnswer ? colors.primary : colors.bg,
                  },
                ]}>
                <Text
                  variant="bodyStrong"
                  tone={isAnswer ? 'onPrimary' : 'ink'}
                  style={styles.optionText}>
                  {label}
                </Text>
                {isAnswer ? <CheckIcon size={20} color={colors.onPrimary} /> : null}
                {isWrongPick ? <XIcon size={20} color={colors.accentText} /> : null}
              </PressableScale>
            );
          })}
        </View>

        {answered ? (
          <Animated.View entering={FadeIn.duration(200)} style={styles.explanation}>
            <Text variant="bodyStrong" tone={correct ? 'primary' : 'accentText'}>
              {correct ? 'Bien.' : 'No era esa.'}
            </Text>
            <Text variant="body" tone="inkMuted">
              {q.explanation}
            </Text>
          </Animated.View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, styles.gutter, { paddingBottom: bottomInset + space[4] }]}>
        <Button
          label={last ? 'Ver resultado' : 'Siguiente pregunta'}
          size="lg"
          block
          disabled={!answered}
          onPress={onNext}
          testID="leccion-siguiente-pregunta"
        />
      </View>
    </View>
  );
}

function DoneView({
  lesson,
  score,
  bottomInset,
}: {
  lesson: Lesson;
  score: number;
  bottomInset: number;
}) {
  const { colors } = useTheme();
  const total = lesson.quiz.length;
  const perfect = score === total;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      `Lección terminada. ${score} de ${total}. ${scoreMessage(score, total)}`,
    );
  }, [score, total]);

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.gutter, styles.done, styles.grow]}>
        <View style={[styles.doneMark, { backgroundColor: colors.butter }]}>
          <ConfettiIcon size={32} color={colors.onButter} />
        </View>
        <Text variant="overline" tone="inkMuted">
          Lección terminada
        </Text>
        <Text variant="display" accessibilityRole="header">
          {lesson.title}
        </Text>
        <Text variant="amountLarge" style={styles.score}>
          {score}/{total}
        </Text>
        <Text variant="body" tone={perfect ? 'ink' : 'inkMuted'}>
          {scoreMessage(score, total)}
        </Text>
      </ScrollView>
      <View style={[styles.footer, styles.gutter, { paddingBottom: bottomInset + space[4] }]}>
        <Button label="Listo" size="lg" block onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  gutter: { paddingHorizontal: screenGutter },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  close: {
    width: minTouchTarget,
    height: minTouchTarget,
    justifyContent: 'center',
    marginLeft: -space[3],
    paddingLeft: space[3],
  },
  segments: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  page: {
    paddingHorizontal: screenGutter,
  },
  grow: {
    flexGrow: 1,
  },
  card: {
    flex: 1,
    paddingTop: space[8],
    gap: space[4],
    maxWidth: 420,
  },
  highlight: {
    alignSelf: 'flex-start',
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radius.sm,
  },
  cardBody: {
    fontSize: 18,
    lineHeight: 27,
  },
  swipeHint: {
    marginTop: 'auto',
    marginBottom: space[4],
  },
  footer: {
    paddingTop: space[3],
  },
  quiz: {
    paddingTop: space[8],
    gap: space[4],
  },
  options: {
    gap: space[2],
  },
  option: {
    minHeight: minTouchTarget + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderWidth: hairline,
    borderRadius: radius.sm,
  },
  optionText: {
    flex: 1,
  },
  explanation: {
    gap: space[1],
  },
  done: {
    paddingTop: space[10],
    gap: space[3],
  },
  doneMark: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[2],
  },
  score: {
    marginTop: space[2],
  },
});
