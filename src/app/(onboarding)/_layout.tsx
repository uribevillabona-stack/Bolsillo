import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

export const unstable_settings = {
  initialRouteName: 'perfil',
};

export default function OnboardingLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
