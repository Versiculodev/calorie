import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  DEFAULT_TARGETS,
  parseSnapshot,
  serializeSnapshot,
  type DayTargets,
  type FoodEntry,
} from "@/lib/calorie";

const STORAGE_KEY = "calorie.log.v1";

interface LogContextValue {
  hydrated: boolean;
  entries: readonly FoodEntry[];
  targets: DayTargets;
  addEntry: (entry: FoodEntry) => void;
  removeEntry: (id: string) => void;
  setTargets: (targets: DayTargets) => void;
}

const LogContext = createContext<LogContextValue | null>(null);

export function LogProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [targets, setTargetsState] = useState<DayTargets>(DEFAULT_TARGETS);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled || !raw) {
          return;
        }
        const snapshot = parseSnapshot(raw);
        if (!snapshot) {
          return;
        }
        setEntries(snapshot.entries);
        setTargetsState(snapshot.targets);
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void AsyncStorage.setItem(STORAGE_KEY, serializeSnapshot({ entries, targets }));
  }, [hydrated, entries, targets]);

  const value = useMemo<LogContextValue>(
    () => ({
      hydrated,
      entries,
      targets,
      addEntry: (entry) => {
        setEntries((current) => [...current, entry]);
      },
      removeEntry: (id) => {
        setEntries((current) => current.filter((entry) => entry.id !== id));
      },
      setTargets: (next) => {
        setTargetsState(next);
      },
    }),
    [hydrated, entries, targets],
  );

  return <LogContext.Provider value={value}>{children}</LogContext.Provider>;
}

export function useLog(): LogContextValue {
  const value = useContext(LogContext);
  if (!value) {
    throw new Error("useLog must be used within LogProvider");
  }
  return value;
}
