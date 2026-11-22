export const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;

export type Meal = (typeof MEALS)[number];

export const MEAL_LABEL: Record<Meal, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodEntry extends Macros {
  id: string;
  day: string;
  meal: Meal;
  name: string;
  kcal: number;
  createdAt: number;
}

export interface DayTargets extends Macros {
  kcal: number;
}

export interface Preset extends Macros {
  name: string;
  kcal: number;
}

export const DEFAULT_TARGETS: DayTargets = {
  kcal: 2000,
  protein: 120,
  carbs: 220,
  fat: 65,
};

export const PRESETS: readonly Preset[] = [
  { name: "Eggs", kcal: 156, protein: 12, carbs: 1, fat: 11 },
  { name: "Greek yogurt", kcal: 150, protein: 15, carbs: 8, fat: 4 },
  { name: "Banana", kcal: 105, protein: 1, carbs: 27, fat: 0 },
  { name: "Toast with butter", kcal: 180, protein: 4, carbs: 24, fat: 7 },
  { name: "Rice bowl", kcal: 520, protein: 18, carbs: 78, fat: 12 },
  { name: "Chicken salad", kcal: 380, protein: 32, carbs: 14, fat: 20 },
  { name: "Apple", kcal: 95, protein: 0, carbs: 25, fat: 0 },
  { name: "Coffee", kcal: 5, protein: 0, carbs: 0, fat: 0 },
];

export interface FoodDraft {
  name: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  meal: Meal;
}

export interface TargetDraft {
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
}

export interface Readout {
  value: number;
  caption: string;
  over: boolean;
}

export interface LogSnapshot {
  entries: FoodEntry[];
  targets: DayTargets;
}

interface Ok<T> {
  ok: true;
  value: T;
}

interface Err {
  ok: false;
  message: string;
}

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const WHOLE = /^\d+$/;
const GRAMS = /^\d+(\.\d)?$/;

export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey(now: Date = new Date()): string {
  return dayKey(now);
}

export function parseDay(day: string): Date {
  const [year, month, date] = day.split("-").map((part) => Number(part));
  return new Date(year ?? 0, (month ?? 1) - 1, date ?? 1);
}

export function isDayKey(value: string): boolean {
  if (!DAY_KEY.test(value)) {
    return false;
  }
  return dayKey(parseDay(value)) === value;
}

export function addDays(day: string, amount: number): string {
  const date = parseDay(day);
  date.setDate(date.getDate() + amount);
  return dayKey(date);
}

export function weekEnding(day: string, count = 7): string[] {
  const keys: string[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    keys.push(addDays(day, -offset));
  }
  return keys;
}

export function formatDayLabel(day: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(parseDay(day));
}

export function formatWeekday(day: string): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(parseDay(day));
}

export function formatDayNumber(day: string): string {
  return String(parseDay(day).getDate());
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

export function formatGrams(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text} g`;
}

export function mealForHour(hour: number): Meal {
  if (hour < 11) {
    return "breakfast";
  }
  if (hour < 15) {
    return "lunch";
  }
  if (hour < 21) {
    return "dinner";
  }
  return "snack";
}

export function isMeal(value: string): value is Meal {
  return (MEALS as readonly string[]).includes(value);
}

export function createId(now: number = Date.now(), rand: number = Math.random()): string {
  return `${now.toString(36)}-${rand.toString(36).slice(2, 10)}`;
}

export function firstSearchParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function remaining(eaten: number, target: number): { left: number; over: number; portion: number } {
  const left = Math.max(0, target - eaten);
  const over = Math.max(0, eaten - target);
  const portion = target <= 0 ? (eaten > 0 ? 1 : 0) : Math.min(1, eaten / target);
  return { left, over, portion };
}

export function readout(eaten: number, target: number): Readout {
  const balance = remaining(eaten, target);
  if (balance.over > 0) {
    return {
      value: balance.over,
      caption: `over ${formatNumber(target)}`,
      over: true,
    };
  }
  if (eaten <= 0) {
    return {
      value: target,
      caption: "for the day",
      over: false,
    };
  }
  return {
    value: balance.left,
    caption: `left of ${formatNumber(target)}`,
    over: false,
  };
}

export function sumEntries(entries: readonly FoodEntry[]): { kcal: number } & Macros {
  return entries.reduce<{ kcal: number } & Macros>(
    (total, entry) => ({
      kcal: total.kcal + entry.kcal,
      protein: total.protein + entry.protein,
      carbs: total.carbs + entry.carbs,
      fat: total.fat + entry.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function entriesForDay(entries: readonly FoodEntry[], day: string): FoodEntry[] {
  return entries
    .filter((entry) => entry.day === day)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function hasMacros(macros: Macros): boolean {
  return macros.protein > 0 || macros.carbs > 0 || macros.fat > 0;
}

export function macroSentence(macros: Macros): string {
  return `${formatGrams(macros.protein)} protein, ${formatGrams(macros.carbs)} carbs, and ${formatGrams(macros.fat)} fat.`;
}

export function parseFoodDraft(
  draft: FoodDraft,
  day: string,
  id: string,
  createdAt: number,
): Ok<FoodEntry> | Err {
  const name = draft.name.trim().replace(/\s+/g, " ");
  if (name.length === 0) {
    return { ok: false, message: "Name the food." };
  }
  if (name.length > 60) {
    return { ok: false, message: "Use a shorter name." };
  }
  const kcal = parseWhole(draft.kcal, 0, 8000, "Enter calories as a whole number.", "That is over 8,000 calories. Check the number.");
  if (!kcal.ok) {
    return kcal;
  }
  const protein = parseGrams(draft.protein, "protein");
  if (!protein.ok) {
    return protein;
  }
  const carbs = parseGrams(draft.carbs, "carbs");
  if (!carbs.ok) {
    return carbs;
  }
  const fat = parseGrams(draft.fat, "fat");
  if (!fat.ok) {
    return fat;
  }
  return {
    ok: true,
    value: {
      id,
      day,
      meal: draft.meal,
      name,
      kcal: kcal.value,
      protein: protein.value,
      carbs: carbs.value,
      fat: fat.value,
      createdAt,
    },
  };
}

export function parseTargets(draft: TargetDraft): Ok<DayTargets> | Err {
  const kcal = parseWhole(
    draft.kcal,
    800,
    6000,
    "Enter a daily calorie target from 800 to 6,000.",
    "Enter a daily calorie target from 800 to 6,000.",
  );
  if (!kcal.ok) {
    return kcal;
  }
  const protein = parseRequiredGrams(draft.protein, "protein", 400);
  if (!protein.ok) {
    return protein;
  }
  const carbs = parseRequiredGrams(draft.carbs, "carbs", 800);
  if (!carbs.ok) {
    return carbs;
  }
  const fat = parseRequiredGrams(draft.fat, "fat", 300);
  if (!fat.ok) {
    return fat;
  }
  return {
    ok: true,
    value: {
      kcal: kcal.value,
      protein: protein.value,
      carbs: carbs.value,
      fat: fat.value,
    },
  };
}

export function serializeSnapshot(snapshot: LogSnapshot): string {
  return JSON.stringify({
    version: 1,
    entries: snapshot.entries,
    targets: snapshot.targets,
  });
}

export function parseSnapshot(raw: string): LogSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.entries)) {
      return null;
    }
    const entries = parsed.entries.flatMap((item) => {
      const entry = readEntry(item);
      return entry ? [entry] : [];
    });
    return {
      entries,
      targets: readTargets(parsed.targets) ?? DEFAULT_TARGETS,
    };
  } catch {
    return null;
  }
}

export function presetEntry(preset: Preset, day: string, meal: Meal, id: string, createdAt: number): FoodEntry {
  return {
    id,
    day,
    meal,
    name: preset.name,
    kcal: preset.kcal,
    protein: preset.protein,
    carbs: preset.carbs,
    fat: preset.fat,
    createdAt,
  };
}

function parseWhole(raw: string, min: number, max: number, emptyMessage: string, rangeMessage: string): Ok<number> | Err {
  const trimmed = raw.trim();
  if (!WHOLE.test(trimmed)) {
    return { ok: false, message: emptyMessage };
  }
  const value = Number(trimmed);
  if (value < min || value > max) {
    return { ok: false, message: rangeMessage };
  }
  return { ok: true, value };
}

function parseGrams(raw: string, label: string): Ok<number> | Err {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { ok: true, value: 0 };
  }
  if (!GRAMS.test(trimmed)) {
    return { ok: false, message: `Enter ${label} in grams, like 12 or 12.5.` };
  }
  const value = Number(trimmed);
  if (value > 500) {
    return { ok: false, message: `${capitalize(label)} looks too high. Use grams for one food.` };
  }
  return { ok: true, value };
}

function parseRequiredGrams(raw: string, label: string, max: number): Ok<number> | Err {
  const trimmed = raw.trim();
  if (!GRAMS.test(trimmed)) {
    return { ok: false, message: `Enter ${label} in grams.` };
  }
  const value = Number(trimmed);
  if (value > max) {
    return { ok: false, message: `Enter ${label} from 0 to ${formatNumber(max)} grams.` };
  }
  return { ok: true, value };
}

function readEntry(value: unknown): FoodEntry | null {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.id !== "string" || value.id.length === 0) {
    return null;
  }
  if (typeof value.day !== "string" || !isDayKey(value.day)) {
    return null;
  }
  if (typeof value.meal !== "string" || !isMeal(value.meal)) {
    return null;
  }
  if (typeof value.name !== "string") {
    return null;
  }
  const name = value.name.trim();
  if (name.length === 0 || name.length > 60) {
    return null;
  }
  const kcal = readBounded(value.kcal, 0, 8000);
  const protein = readBounded(value.protein, 0, 500);
  const carbs = readBounded(value.carbs, 0, 500);
  const fat = readBounded(value.fat, 0, 500);
  if (kcal === null || protein === null || carbs === null || fat === null) {
    return null;
  }
  if (typeof value.createdAt !== "number" || !Number.isFinite(value.createdAt)) {
    return null;
  }
  return {
    id: value.id,
    day: value.day,
    meal: value.meal,
    name,
    kcal: Math.round(kcal),
    protein,
    carbs,
    fat,
    createdAt: value.createdAt,
  };
}

function readTargets(value: unknown): DayTargets | null {
  if (!isRecord(value)) {
    return null;
  }
  const kcal = readBounded(value.kcal, 800, 6000);
  const protein = readBounded(value.protein, 0, 400);
  const carbs = readBounded(value.carbs, 0, 800);
  const fat = readBounded(value.fat, 0, 300);
  if (kcal === null || protein === null || carbs === null || fat === null) {
    return null;
  }
  return {
    kcal: Math.round(kcal),
    protein,
    carbs,
    fat,
  };
}

function readBounded(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    return null;
  }
  return value;
}

function capitalize(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
