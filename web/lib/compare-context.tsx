"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Property } from "../types";

type Ctx = {
  items: Property[];
  toggle: (p: Property) => void;
  remove: (id: number) => void;
  isAdded: (id: number) => boolean;
  clear: () => void;
};

const CompareContext = createContext<Ctx>({
  items: [],
  toggle: () => {},
  remove: () => {},
  isAdded: () => false,
  clear: () => {},
});

const STORAGE_KEY = "props.compare.items";

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Property[]>([]);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage failures.
    }
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      toggle: (p: Property) =>
        setItems((prev) => {
          const exists = prev.find((x) => x.id === p.id);
          if (exists) return prev.filter((x) => x.id !== p.id);
          return prev.length >= 4 ? prev : [...prev, p];
        }),
      remove: (id: number) => setItems((prev) => prev.filter((item) => item.id !== id)),
      isAdded: (id: number) => items.some((x) => x.id === id),
      clear: () => setItems([]),
    }),
    [items],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export const useCompare = () => useContext(CompareContext);
