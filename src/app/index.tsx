import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bowl } from "@/components/bowl";
import { Screen } from "@/components/screen";
import {
  entriesForDay,
  formatDayLabel,
  formatDayNumber,
  formatNumber,
  formatWeekday,
  hasMacros,
  macroSentence,
  MEALS,
  MEAL_LABEL,
  readout,
  remaining,
  sumEntries,
  todayKey,
  weekEnding,
  type Meal,
} from "@/lib/calorie";
import { useLog } from "@/lib/log";
import { palette } from "@/theme/palette";

export default function HomeScreen() {
  const log = useLog();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const today = todayKey();
  const [day, setDay] = useState(today);

  if (!log.hydrated) {
    return <View style={styles.paper} />;
  }

  const foods = entriesForDay(log.entries, day);
  const totals = sumEntries(foods);
  const balance = remaining(totals.kcal, log.targets.kcal);
  const figure = readout(totals.kcal, log.targets.kcal);
  const stacked = width < 420;

  return (
    <Screen
      footer={
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            router.push({ pathname: "/add", params: { day } });
          }}
          style={({ pressed }) => [styles.add, pressed && styles.pressed]}
        >
          <Text style={styles.addLabel}>Add food</Text>
        </Pressable>
      }
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 18 }]}
        showsVerticalScrollIndicator={false}
        style={styles.fill}
      >
        <Text style={styles.date}>{formatDayLabel(day)}</Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            router.push("/settings");
          }}
          style={styles.targetButton}
        >
          <Text style={styles.targetLink}>Daily target</Text>
        </Pressable>

        <View style={styles.week}>
          {weekEnding(today).map((key) => {
            const selected = key === day;
            return (
              <Pressable
                accessibilityLabel={`${formatDayLabel(key)}${selected ? ", selected" : ""}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={key}
                onPress={() => {
                  setDay(key);
                }}
                style={styles.day}
              >
                <Text style={[styles.weekday, selected && styles.dayOn]}>{formatWeekday(key)}</Text>
                <Text style={[styles.dayNumber, selected && styles.dayOn]}>{formatDayNumber(key)}</Text>
                <View style={[styles.mark, selected && styles.markOn]} />
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.readout, stacked && styles.readoutStacked]}>
          <View style={styles.figure}>
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.kcal, figure.over && styles.over]}
            >
              {formatNumber(figure.value)}
            </Text>
            <Text style={[styles.caption, figure.over && styles.over]}>{figure.caption}</Text>
          </View>
          <Bowl over={figure.over} portion={balance.portion} />
        </View>

        {foods.length === 0 ? (
          <Text style={styles.empty}>Nothing logged yet. Add the first thing you ate.</Text>
        ) : hasMacros(totals) ? (
          <Text style={styles.macros}>{macroSentence(totals)}</Text>
        ) : null}

        {MEALS.map((meal) => (
          <MealBlock
            dayLabel={formatDayLabel(day)}
            foods={foods.filter((entry) => entry.meal === meal)}
            key={meal}
            meal={meal}
            onRemove={log.removeEntry}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

interface MealBlockProps {
  meal: Meal;
  dayLabel: string;
  foods: ReturnType<typeof entriesForDay>;
  onRemove: (id: string) => void;
}

function MealBlock({ meal, dayLabel, foods, onRemove }: MealBlockProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  if (foods.length === 0) {
    return null;
  }
  return (
    <View style={styles.mealBlock}>
      <Text accessibilityRole="header" style={styles.meal}>
        {MEAL_LABEL[meal]}
      </Text>
      {foods.map((entry) => {
        const pending = pendingId === entry.id;
        return (
          <View key={entry.id} style={styles.row}>
            <Pressable
              accessibilityLabel={`${entry.name}, ${formatNumber(entry.kcal)} calories`}
              accessibilityRole="button"
              disabled={pending}
              onPress={() => {
                setPendingId(entry.id);
              }}
              style={styles.foodHit}
            >
              <Text style={styles.food}>{entry.name}</Text>
            </Pressable>
            {pending ? (
              <View style={styles.confirm}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setPendingId(null);
                  }}
                >
                  <Text style={styles.keep}>Keep</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={`Remove ${entry.name} from ${dayLabel}`}
                  accessibilityRole="button"
                  onPress={() => {
                    onRemove(entry.id);
                    setPendingId(null);
                  }}
                >
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityLabel={`${formatNumber(entry.kcal)} calories. Remove ${entry.name}`}
                accessibilityRole="button"
                onPress={() => {
                  setPendingId(entry.id);
                }}
              >
                <Text style={styles.rowKcal}>{formatNumber(entry.kcal)}</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
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
    paddingBottom: 28,
  },
  date: {
    color: palette.ink,
    fontFamily: "Figtree_600SemiBold",
    fontSize: 26,
    lineHeight: 32,
  },
  targetButton: {
    alignSelf: "flex-start",
    marginTop: 6,
  },
  targetLink: {
    color: palette.glaze,
    fontFamily: "Figtree_500Medium",
    fontSize: 16,
  },
  week: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },
  day: {
    alignItems: "center",
    minWidth: 36,
    paddingVertical: 4,
  },
  weekday: {
    color: palette.quiet,
    fontFamily: "Figtree_500Medium",
    fontSize: 12,
  },
  dayNumber: {
    color: palette.ink,
    fontFamily: "Figtree_600SemiBold",
    fontSize: 16,
    marginTop: 2,
  },
  dayOn: {
    color: palette.glaze,
  },
  mark: {
    height: 2,
    width: 16,
    marginTop: 4,
    backgroundColor: "transparent",
  },
  markOn: {
    backgroundColor: palette.glaze,
  },
  readout: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 28,
  },
  readoutStacked: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  figure: {
    flexShrink: 1,
    paddingBottom: 8,
  },
  kcal: {
    color: palette.ink,
    fontFamily: "Fraunces_500Medium",
    fontSize: 64,
    lineHeight: 68,
  },
  caption: {
    color: palette.quiet,
    fontFamily: "Figtree_400Regular",
    fontSize: 16,
    marginTop: 2,
  },
  over: {
    color: palette.cinnabar,
  },
  empty: {
    color: palette.ink,
    fontFamily: "Figtree_400Regular",
    fontSize: 17,
    lineHeight: 24,
    marginTop: 8,
    maxWidth: 320,
  },
  macros: {
    color: palette.ink,
    fontFamily: "Figtree_400Regular",
    fontSize: 16,
    lineHeight: 23,
    marginTop: 4,
    maxWidth: 340,
  },
  mealBlock: {
    marginTop: 28,
  },
  meal: {
    color: palette.ink,
    fontFamily: "Figtree_600SemiBold",
    fontSize: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  foodHit: {
    flex: 1,
  },
  food: {
    color: palette.ink,
    fontFamily: "Figtree_400Regular",
    fontSize: 17,
  },
  rowKcal: {
    color: palette.ink,
    fontFamily: "Figtree_500Medium",
    fontSize: 17,
  },
  confirm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  keep: {
    color: palette.quiet,
    fontFamily: "Figtree_500Medium",
    fontSize: 16,
  },
  remove: {
    color: palette.cinnabar,
    fontFamily: "Figtree_600SemiBold",
    fontSize: 16,
  },
  add: {
    backgroundColor: palette.glaze,
    alignItems: "center",
    paddingVertical: 16,
  },
  addLabel: {
    color: palette.onGlaze,
    fontFamily: "Figtree_600SemiBold",
    fontSize: 17,
  },
  pressed: {
    opacity: 0.85,
  },
});
