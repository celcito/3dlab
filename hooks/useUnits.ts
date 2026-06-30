import { useCallback, useMemo } from "react";

const STORAGE_KEY = "cookie-cutter-units";

export function useUnits() {
  const unit = useMemo(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as "mm" | "cm") || "mm";
    } catch {
      return "mm";
    }
  }, []);

  const toggle = useCallback(() => {
    const next = unit === "mm" ? "cm" : "mm";
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event("cookie-cutter-unit-change"));
  }, [unit]);

  const format = useCallback(
    (valueMm: number): string => {
      if (unit === "cm") {
        const cm = valueMm / 10;
        return `${cm.toFixed(1).replace(".", ",")} cm`;
      }
      return `${valueMm.toFixed(1)} mm`;
    },
    [unit]
  );

  const parse = useCallback(
    (value: string): number => {
      const num = parseFloat(value.replace(",", "."));
      if (isNaN(num)) return 0;
      return unit === "cm" ? num * 10 : num;
    },
    [unit]
  );

  const convert = useCallback(
    (valueMm: number): number => {
      return unit === "cm" ? valueMm / 10 : valueMm;
    },
    [unit]
  );

  return { unit, toggle, format, parse, convert };
}
