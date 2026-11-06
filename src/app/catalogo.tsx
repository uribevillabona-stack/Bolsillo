/**
 * Catálogo del design system (solo en desarrollo).
 *
 * Sirve para revisar cada componente en claro y oscuro, en el teléfono real,
 * y para mostrarle al jurado el sistema de diseño de forma aislada.
 */
import { Redirect, router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AmountText,
  Button,
  Chip,
  CoffeeIcon,
  ListRow,
  NumericKeypad,
  PlusIcon,
  ProgressRing,
  ReceiptIcon,
  Screen,
  Sheet,
  Text,
} from '@/components';
import { digitsToAmount } from '@/lib/money';
import {
  hairline,
  palettes,
  radius,
  space,
  useTheme,
  useThemeStore,
  type ColorTokens,
  type ThemePreference,
} from '@/theme';

const PREFERENCES: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: 'Sistema' },
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
];

export default function CatalogoScreen() {
  const { colors, scheme } = useTheme();
  const { preference, setPreference } = useThemeStore();
  const [digits, setDigits] = useState('12500');
  const [progress, setProgress] = useState(0.45);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Screen>
      <Button label="Volver" variant="quiet" onPress={() => router.back()} />
      <Text variant="display" accessibilityRole="header" style={styles.h1}>
        Catálogo
      </Text>

      <Section title="Tema">
        <View style={styles.row}>
          {PREFERENCES.map((p) => (
            <Chip
              key={p.id}
              label={p.label}
              selected={preference === p.id}
              onPress={() => setPreference(p.id)}
            />
          ))}
        </View>
        <View style={styles.swatches}>
          {(Object.keys(palettes[scheme]) as (keyof ColorTokens)[])
            .filter((k) => k !== 'scrim')
            .map((k) => (
              <View key={k} style={styles.swatch}>
                <View
                  style={[
                    styles.swatchColor,
                    { backgroundColor: colors[k], borderColor: colors.line },
                  ]}
                />
                <Text variant="caption" tone="inkMuted">
                  {k}
                </Text>
              </View>
            ))}
        </View>
      </Section>

      <Section title="Tipografía">
        <Text variant="display">Bricolage display</Text>
        <Text variant="title">Título de sección</Text>
        <Text variant="body">
          Geist para el texto. Llevas $ 38.000 en tintos este mes. Eso es medio mercado.
        </Text>
        <Text variant="label" tone="inkMuted">
          Etiqueta secundaria
        </Text>
        <Text variant="overline" tone="inkMuted">
          Rótulo editorial
        </Text>
        <Text variant="mono">0123456789 · Geist Mono</Text>
      </Section>

      <Section title="AmountText">
        <AmountText amount={1250000} size="hero" />
        <AmountText amount={-38000} size="large" tone="accentText" />
        <AmountText amount={50000} size="medium" signed tone="primary" />
        <AmountText amount={2500} size="small" />
      </Section>

      <Section title="Button">
        <Button label="Guardar gasto" variant="accent" icon={PlusIcon} onPress={() => {}} />
        <Button label="Continuar" variant="primary" onPress={() => {}} />
        <Button label="Editar atajos" variant="outline" onPress={() => {}} />
        <Button label="Ahora no" variant="quiet" onPress={() => {}} />
        <Button label="Deshabilitado" disabled onPress={() => {}} />
        <Button label="Abrir sheet" variant="outline" block onPress={() => setSheetOpen(true)} />
      </Section>

      <Section title="Chip">
        <View style={styles.row}>
          <Chip label="Tinto" icon={CoffeeIcon} amount={2500} onPress={() => {}} />
          <Chip label="Seleccionado" selected onPress={() => {}} />
          <Chip label="Sin acción" />
        </View>
      </Section>

      <Section title="ListRow">
        <ListRow title="Tinto" subtitle="Hoy · 7:42 a. m." icon={CoffeeIcon} amount={-2500} />
        <ListRow
          title="Transferencia Nequi"
          subtitle="Detectado · por confirmar"
          icon={ReceiptIcon}
          amount={-45000}
          onPress={() => {}}
        />
        <ListRow title="Modo oscuro" value="Sistema" onPress={() => {}} divider={false} />
      </Section>

      <Section title="ProgressRing">
        <View style={styles.row}>
          <ProgressRing
            progress={progress}
            accessibilityLabel={`${Math.round(progress * 100)} por ciento`}>
            <Text variant="label">{Math.round(progress * 100)} %</Text>
          </ProgressRing>
          <ProgressRing progress={0.8} tone="butter" accessibilityLabel="80 por ciento" />
          <ProgressRing progress={1.2} accessibilityLabel="Presupuesto excedido" />
        </View>
        <View style={styles.row}>
          <Chip label="−10 %" onPress={() => setProgress((p) => Math.max(0, p - 0.1))} />
          <Chip label="+10 %" onPress={() => setProgress((p) => Math.min(1.3, p + 0.1))} />
        </View>
      </Section>

      <Section title="NumericKeypad">
        <AmountText amount={digitsToAmount(digits)} size="large" />
        <NumericKeypad value={digits} onChange={setDigits} />
      </Section>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Sheet de ejemplo">
        <Text variant="body" tone="inkMuted">
          Arrastra hacia abajo, toca afuera o usa el botón atrás para cerrarlo.
        </Text>
        <View style={styles.sheetAction}>
          <Button label="Entendido" block onPress={() => setSheetOpen(false)} />
        </View>
      </Sheet>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { borderTopColor: colors.line }]}>
      <Text variant="overline" tone="inkMuted">
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  h1: {
    marginTop: space[2],
  },
  section: {
    marginTop: space[8],
    paddingTop: space[4],
    borderTopWidth: hairline,
    gap: space[3],
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space[3],
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[3],
  },
  swatch: {
    width: 72,
    gap: space[1],
  },
  swatchColor: {
    height: 40,
    borderRadius: radius.xs,
    borderWidth: hairline,
  },
  sheetAction: {
    marginTop: space[6],
  },
});
