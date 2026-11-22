import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LineField } from "@/components/line-field";
import { Screen } from "@/components/screen";
import {
  createId,
  firstSearchParam,
  isDayKey,
  MEALS,
  MEAL_LABEL,
  mealForHour,
  parseFoodDraft,
  PRESETS,
  presetEntry,
  todayKey,
  type Meal,
} from "@/lib/calorie";
import { useLog } from "@/lib/log";
import { palette } from "@/theme/palette";

export default function AddFoodScreen() {
  const log = useLog();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ day?: string | string[] }>();
  const requested = firstSearchParam(params.day);
  const day = requested && isDayKey(requested) ? requested : todayKey();
  const [meal, setMeal] = useState<Meal>(() => mealForHour(new Date().getHours()));
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  if (!log.hydrated) {
    return <View style={styles.paper} />;
  }

  function close() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  function save() {
    const parsed = parseFoodDraft(
      { name, kcal, protein, carbs, fat, meal },
      day,
      createId(),
      Date.now(),
    );
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }
    log.addEntry(parsed.value);
    close();
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.paper}
    >
      <Screen
        footer={
          <Pressable
            accessibilityRole="button"
            onPress={save}
            style={({ pressed }) => [styles.save, pressed && styles.pressed]}
          >
            <Text style={styles.saveLabel}>Save food</Text>
          </Pressable>
        }
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 18 }]}
          keyboardShouldPersistTaps="handled"
          style={styles.fill}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Add food</Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={close}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>

          <View style={styles.meals}>
            {MEALS.map((option) => {
              const selected = option === meal;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={option}
                  onPress={() => {
                    setMeal(option);
                  }}
                  style={styles.meal}
                >
                  <Text style={[styles.mealLabel, selected && styles.mealOn]}>{MEAL_LABEL[option]}</Text>
                  <View style={[styles.mark, selected && styles.markOn]} />
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.section}>Often logged</Text>
          <Text style={styles.note}>Typical portions. Remove one if it does not match what you ate.</Text>
          {PRESETS.map((preset) => (
            <Pressable
              accessibilityLabel={`Add ${preset.name}, ${preset.kcal} calories`}
              accessibilityRole="button"
              key={preset.name}
              onPress={() => {
                log.addEntry(presetEntry(preset, day, meal, createId(), Date.now()));
                close();
              }}
              style={styles.row}
            >
              <Text style={styles.food}>{preset.name}</Text>
              <Text style={styles.kcal}>{preset.kcal}</Text>
            </Pressable>
          ))}

          <LineField label="Name" onChangeText={setName} value={name} />
          <LineField keyboard="number-pad" label="Calories" onChangeText={setKcal} value={kcal} />
          <LineField keyboard="decimal-pad" label="Protein (grams)" onChangeText={setProtein} value={protein} />
          <LineField keyboard="decimal-pad" label="Carbs (grams)" onChangeText={setCarbs} value={carbs} />
          <LineField keyboard="decimal-pad" label="Fat (grams)" onChangeText={setFat} value={fat} />
          {message ? <Text style={styles.error}>{message}</Text> : null}
        </ScrollView>
      </Screen>
    </KeyboardAvoidingView>
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
  },
  close: {
    color: palette.glaze,
    fontFamily: "Figtree_500Medium",
    fontSize: 16,
  },
  meals: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },
  meal: {
    alignItems: "center",
    paddingVertical: 4,
  },
  mealLabel: {
    color: palette.quiet,
    fontFamily: "Figtree_500Medium",
    fontSize: 15,
  },
  mealOn: {
    color: palette.glaze,
  },
  mark: {
    height: 2,
    width: 16,
    marginTop: 6,
    backgroundColor: "transparent",
  },
  markOn: {
    backgroundColor: palette.glaze,
  },
  section: {
    color: palette.ink,
    fontFamily: "Figtree_600SemiBold",
    fontSize: 18,
    marginTop: 28,
  },
  note: {
    color: palette.quiet,
    fontFamily: "Figtree_400Regular",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  food: {
    flex: 1,
    color: palette.ink,
    fontFamily: "Figtree_400Regular",
    fontSize: 17,
  },
  kcal: {
    color: palette.ink,
    fontFamily: "Figtree_500Medium",
    fontSize: 17,
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
