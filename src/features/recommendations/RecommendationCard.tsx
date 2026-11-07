/**
 * La única recomendación de Inicio. Se descarta con "Ahora no" (vuelve en
 * 3 días si sigue aplicando) y se puede deshacer.
 *
 * Marca de color según el tono: coral = alerta de gasto, mantequilla = va
 * bien. Las neutras no llevan marca.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, showSnackbar, Text } from '@/components';
import { db } from '@/db/client';
import { haptics } from '@/lib/haptics';
import { speakMoney } from '@/lib/money';
import { hairline, space, useTheme } from '@/theme';

import type { Recommendation } from './recommendations';
import { dismissRecommendation, undoDismiss } from './recommendations-repo';

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  const { colors } = useTheme();
  const markColor =
    rec.tone === 'alert' ? colors.accent : rec.tone === 'good' ? colors.butter : null;

  const dismiss = () => {
    try {
      dismissRecommendation(db, rec.key);
    } catch {
      haptics.reject();
      showSnackbar('No se pudo guardar. Intenta de nuevo.');
      return;
    }
    haptics.tap();
    showSnackbar('Listo, no te lo mostramos por unos días', {
      label: 'Deshacer',
      onPress: () => undoDismiss(db, rec.key),
    });
  };

  return (
    <View
      style={[styles.block, { borderTopColor: colors.line }]}
      testID="recomendacion"
      accessibilityLabel={speakMoney(
        `Recomendación. ${rec.title}${rec.body ? ` ${rec.body}` : ''}`,
      )}>
      <View style={styles.topic}>
        {markColor ? <View style={[styles.mark, { backgroundColor: markColor }]} /> : null}
        <Text variant="overline" tone="inkMuted">
          {rec.topic}
        </Text>
      </View>
      <Text variant="title">{rec.title}</Text>
      {rec.body ? (
        <Text variant="body" tone="inkMuted">
          {rec.body}
        </Text>
      ) : null}
      <View style={styles.actions}>
        {rec.action ? (
          <Button
            label={rec.action.label}
            variant="outline"
            onPress={() => router.push(rec.action!.href)}
          />
        ) : null}
        {rec.key !== 'start' ? (
          <Button
            label="Ahora no"
            variant="quiet"
            onPress={dismiss}
            accessibilityHint="Oculta esta recomendación por unos días"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: space[10],
    paddingTop: space[4],
    borderTopWidth: hairline,
    gap: space[2],
    maxWidth: 360,
  },
  topic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  mark: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space[2],
    marginTop: space[2],
  },
});
