/**
 * (tabs)/_layout.js
 * Single-screen layout — no bottom tabs.
 * Chat is the only screen, with sidebar drawer for navigation.
 */
import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="chat" />
      <Stack.Screen name="conversations" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
