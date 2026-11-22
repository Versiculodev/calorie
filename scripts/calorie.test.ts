import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  addDays,
  createId,
  entriesForDay,
  formatDayLabel,
  isDayKey,
  mealForHour,
  parseFoodDraft,
  parseSnapshot,
  parseTargets,
  PRESETS,
  presetEntry,
  readout,
  remaining,
  serializeSnapshot,
  sumEntries,
  weekEnding,
  type FoodEntry,
} from "../src/lib/calorie.ts";

const day = "2026-11-22";

describe("days", () => {
  it("labels Sunday, November 22", () => {
    assert.equal(formatDayLabel(day), "Sunday, November 22");
  });

  it("rejects a date that rolls over", () => {
    assert.equal(isDayKey("2026-02-31"), false);
    assert.equal(isDayKey(day), true);
  });

  it("walks across a month boundary", () => {
    assert.equal(addDays("2026-11-01", -1), "2026-10-31");
  });

  it("builds a week ending on the given day", () => {
    const week = weekEnding(day);
    assert.deepEqual(week, [
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
      "2026-11-21",
      "2026-11-22",
    ]);
  });
});

describe("meals", () => {
  it("picks a meal from the hour", () => {
    assert.equal(mealForHour(8), "breakfast");
    assert.equal(mealForHour(11), "lunch");
    assert.equal(mealForHour(15), "dinner");
    assert.equal(mealForHour(21), "snack");
  });
});

describe("balance", () => {
  it("reports what is left", () => {
    assert.deepEqual(remaining(1160, 2000), { left: 840, over: 0, portion: 0.58 });
    assert.deepEqual(readout(1160, 2000), {
      value: 840,
      caption: "left of 2,000",
      over: false,
    });
  });

  it("reports the target before anything is logged", () => {
    assert.deepEqual(readout(0, 2000), {
      value: 2000,
      caption: "for the day",
      over: false,
    });
  });

  it("reports how far over the target", () => {
    assert.deepEqual(readout(2200, 2000), {
      value: 200,
      caption: "over 2,000",
      over: true,
    });
    assert.equal(remaining(2200, 2000).portion, 1);
  });
});

describe("drafts", () => {
  it("saves a named food", () => {
    const parsed = parseFoodDraft(
      { name: "  Rice   bowl ", kcal: "520", protein: "18", carbs: "78.5", fat: "", meal: "lunch" },
      day,
      "id-1",
      10,
    );
    assert.equal(parsed.ok, true);
    if (!parsed.ok) {
      return;
    }
    assert.equal(parsed.value.name, "Rice bowl");
    assert.equal(parsed.value.kcal, 520);
    assert.equal(parsed.value.fat, 0);
    assert.equal(parsed.value.carbs, 78.5);
  });

  it("asks for a name and a calorie number", () => {
    const unnamed = parseFoodDraft(
      { name: "   ", kcal: "100", protein: "", carbs: "", fat: "", meal: "snack" },
      day,
      "id-1",
      10,
    );
    assert.deepEqual(unnamed, { ok: false, message: "Name the food." });

    const huge = parseFoodDraft(
      { name: "Cake", kcal: "9000", protein: "", carbs: "", fat: "", meal: "snack" },
      day,
      "id-1",
      10,
    );
    assert.equal(huge.ok, false);
  });

  it("keeps the daily target inside a usable range", () => {
    const parsed = parseTargets({ kcal: "1800", protein: "100", carbs: "200", fat: "60" });
    assert.equal(parsed.ok, true);
    const low = parseTargets({ kcal: "400", protein: "100", carbs: "200", fat: "60" });
    assert.equal(low.ok, false);
  });
});

describe("log snapshot", () => {
  it("round-trips entries and drops a broken one", () => {
    const entry = presetEntry(PRESETS[0], day, "breakfast", createId(1, 0.123456), 5);
    const raw = serializeSnapshot({
      entries: [entry, { ...entry, id: "", name: "broken" }],
      targets: { kcal: 1800, protein: 90, carbs: 200, fat: 50 },
    });
    const snapshot = parseSnapshot(raw);
    assert.ok(snapshot);
    assert.equal(snapshot.entries.length, 1);
    assert.equal(snapshot.entries[0]?.name, "Eggs");
    assert.equal(snapshot.targets.kcal, 1800);
    assert.equal(parseSnapshot("{"), null);
  });

  it("sums one day and ignores another", () => {
    const breakfast: FoodEntry = {
      id: "a",
      day,
      meal: "breakfast",
      name: "Eggs",
      kcal: 156,
      protein: 12,
      carbs: 1,
      fat: 11,
      createdAt: 2,
    };
    const later: FoodEntry = { ...breakfast, id: "b", day: "2026-11-21", createdAt: 1 };
    const foods = entriesForDay([later, breakfast], day);
    assert.deepEqual(
      foods.map((food) => food.id),
      ["a"],
    );
    assert.equal(sumEntries(foods).kcal, 156);
  });
});
