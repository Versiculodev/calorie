import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
} from "@expo-google-fonts/figtree";
import { Fraunces_500Medium } from "@expo-google-fonts/fraunces";
import { useFonts } from "expo-font";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { LogProvider } from "@/lib/log";
import { palette } from "@/theme/palette";

import "../global.css";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Fraunces_500Medium,
  });

  useEffect(() => {
    if (loaded || error) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <LogProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.paper },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="add" options={{ presentation: "modal" }} />
        <Stack.Screen name="settings" options={{ presentation: "modal" }} />
      </Stack>
    </LogProvider>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.error}>
      <Text style={styles.title}>Calorie could not open</Text>
      <Text selectable style={styles.body}>
        {error.message}
      </Text>
      <Pressable accessibilityRole="button" onPress={retry} style={styles.button}>
        <Text style={styles.buttonLabel}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
    backgroundColor: palette.paper,
  },
  title: {
    color: palette.ink,
    fontSize: 26,
    fontWeight: "600",
  },
  body: {
    color: palette.quiet,
    fontSize: 16,
    lineHeight: 23,
    marginTop: 12,
  },
  button: {
    marginTop: 24,
    backgroundColor: palette.glaze,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonLabel: {
    color: palette.onGlaze,
    fontSize: 17,
    fontWeight: "600",
  },
});
