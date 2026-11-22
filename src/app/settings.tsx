import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LineField } from "@/components/line-field";
import { Screen } from "@/components/screen";
import { parseTargets, type DayTargets } from "@/lib/calorie";
import { useLog } from "@/lib/log";
import { palette } from "@/theme/palette";

export default function SettingsScreen() {
  const log = useLog();
  if (!log.hydrated) {
    return <View style={styles.paper} />;
  }
  return <TargetForm onSave={log.setTargets} targets={log.targets} />;
}

interface TargetFormProps {
  targets: DayTargets;
  onSave: (targets: DayTargets) => void;
}

function TargetForm({ targets, onSave }: TargetFormProps) {
  const insets = useSafeAreaInsets();
  const [kcal, setKcal] = useState(String(targets.kcal));
  const [protein, setProtein] = useState(String(targets.protein));
  const [carbs, setCarbs] = useState(String(targets.carbs));
  const [fat, setFat] = useState(String(targets.fat));
  const [message, setMessage] = useState<string | null>(null);

  function close() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  function save() {
    const parsed = parseTargets({ kcal, protein, carbs, fat });
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }
    onSave(parsed.value);
    close();
  }

  return (
    <Screen
      footer={
        <Pressable
          accessibilityRole="button"
          onPress={save}
          style={({ pressed }) => [styles.save, pressed && styles.pressed]}
        >
          <Text style={styles.saveLabel}>Save target</Text>
        </Pressable>
      }
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 18 }]}
        style={styles.fill}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Daily target</Text>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={close}>
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>
        <Text style={styles.note}>Set this to the target you use.</Text>
        <LineField keyboard="number-pad" label="Calories" onChangeText={setKcal} selectOnFocus value={kcal} />
        <LineField
          keyboard="decimal-pad"
          label="Protein (grams)"
          onChangeText={setProtein}
          selectOnFocus
          value={protein}
        />
        <LineField
          keyboard="decimal-pad"
          label="Carbs (grams)"
          onChangeText={setCarbs}
          selectOnFocus
          value={carbs}
        />
        <LineField keyboard="decimal-pad" label="Fat (grams)" onChangeText={setFat} selectOnFocus value={fat} />
        {message ? <Text style={styles.error}>{message}</Text> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  paper: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  fill: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 16,
  },
  title: {
    color: palette.ink,
    fontFamily: "Figtree_600SemiBold",
    fontSize: 26,
    flex: 1,
  },
  close: {
    color: palette.glaze,
    fontFamily: "Figtree_500Medium",
    fontSize: 16,
  },
  note: {
    color: palette.quiet,
    fontFamily: "Figtree_400Regular",
    fontSize: 16,
    lineHeight: 23,
    marginTop: 12,
  },
  error: {
    color: palette.cinnabar,
    fontFamily: "Figtree_500Medium",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 16,
  },
  save: {
    backgroundColor: palette.glaze,
    alignItems: "center",
    paddingVertical: 16,
  },
  saveLabel: {
    color: palette.onGlaze,
    fontFamily: "Figtree_600SemiBold",
    fontSize: 17,
  },
  pressed: {
    opacity: 0.85,
  },
});
