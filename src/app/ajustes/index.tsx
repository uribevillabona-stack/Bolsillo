/**
 * Ajustes: perfil, ingreso de referencia, tema, atajos, respaldo y
 * (Fase 3) detección automática.
 */
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Chip,
  DownloadSimpleIcon,
  HandCoinsIcon,
  ListRow,
  ReceiptIcon,
  Screen,
  showSnackbar,
  Text,
  TextField,
} from '@/components';
import { db } from '@/db/client';
import { useProfile } from '@/db/hooks';
import { setThemePreference } from '@/features/profile/preferences';
import { updateProfile } from '@/features/profile/profile-repo';
import { AmountSheet } from '@/features/shared/AmountSheet';
import { BackHeader } from '@/features/shared/BackHeader';
import { formatCOP } from '@/lib/money';
import { hairline, space, useTheme, useThemeStore, type ThemePreference } from '@/theme';

const THEMES: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: 'Como el teléfono' },
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
];

export default function AjustesScreen() {
  const profile = useProfile();
  const preference = useThemeStore((s) => s.preference);
  const [incomeOpen, setIncomeOpen] = useState(false);
  // null = sin editar: muestra el nombre guardado (que llega en el segundo render).
  const [draftName, setName] = useState<string | null>(null);
  const name = draftName ?? profile?.name ?? '';

  return (
    <Screen>
      <BackHeader title="Ajustes" />

      <Section title="Tú">
        <TextField
          label="Nombre"
          value={name}
          onChangeText={setName}
          onEndEditing={() => {
            const trimmed = name.trim();
            if (trimmed && trimmed !== profile?.name) updateProfile(db, { name: trimmed });
          }}
          maxLength={40}
          autoCapitalize="words"
        />
        <ListRow
          title="Ingreso de referencia"
          subtitle="Base del disponible si no registras tus ingresos"
          icon={HandCoinsIcon}
          value={formatCOP(profile?.monthlyIncomeEstimate ?? 0)}
          onPress={() => setIncomeOpen(true)}
          divider={false}
        />
      </Section>

      <Section title="Apariencia">
        <View style={styles.chips} accessibilityRole="radiogroup">
          {THEMES.map((t) => (
            <Chip
              role="radio"
              key={t.id}
              label={t.label}
              selected={preference === t.id}
              onPress={() => setThemePreference(t.id)}
            />
          ))}
        </View>
      </Section>

      <Section title="Registro">
        <ListRow
          title="Atajos de gasto"
          subtitle="Tinto, pasaje, recarga… y los tuyos"
          icon={ReceiptIcon}
          onPress={() => router.push('/ajustes/atajos')}
        />
        <ListRow
          title="Respaldo"
          subtitle="Exporta o restaura tus datos (archivo JSON)"
          icon={DownloadSimpleIcon}
          onPress={() => router.push('/ajustes/respaldo')}
          divider={false}
        />
      </Section>

      <Section title="Detección automática">
        <Text variant="body" tone="inkMuted">
          {profile?.detectionConsent
            ? 'Dijiste que sí. La activamos en cuanto esta función llegue a la app.'
            : 'Desactivada. Podrás activarla aquí cuando esta función llegue a la app.'}
        </Text>
      </Section>

      <Section title="Acerca de">
        <Text variant="body" tone="inkMuted">
          BOLSILLO {Constants.expoConfig?.version ?? ''} · Tus datos viven solo en este teléfono.
        </Text>
        {__DEV__ ? (
          <ListRow
            title="Catálogo de componentes"
            subtitle="Solo en desarrollo"
            onPress={() => router.push('/catalogo')}
            divider={false}
          />
        ) : null}
      </Section>

      <AmountSheet
        visible={incomeOpen}
        title="Ingreso de referencia"
        hint="Lo que te entra al mes, más o menos. Si registras tus ingresos, usamos esos."
        initialAmount={profile?.monthlyIncomeEstimate ?? 0}
        onClose={() => setIncomeOpen(false)}
        onConfirm={(amount) => {
          updateProfile(db, { monthlyIncomeEstimate: amount });
          setIncomeOpen(false);
          showSnackbar(`Ingreso de referencia: ${formatCOP(amount)}`);
        }}
      />
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
  section: {
    marginTop: space[8],
    paddingTop: space[4],
    borderTopWidth: hairline,
    gap: space[3],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
  },
});
