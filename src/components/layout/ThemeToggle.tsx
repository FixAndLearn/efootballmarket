"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "efm_theme_mode";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [resolvedDark, setResolvedDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const readCurrent = () => {
      const attr = document.documentElement.getAttribute("data-theme");
      if (attr === "dark") return true;
      if (attr === "light") return false;
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    };
    setResolvedDark(readCurrent());
  }, []);

  const toggleTheme = () => {
    const nextDark = !resolvedDark;
    const nextAttr = nextDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nextAttr);
    try {
      localStorage.setItem(STORAGE_KEY, nextAttr);
    } catch {
      // ignore storage errors
    }
    setResolvedDark(nextDark);
  };

  if (!mounted) {
    return (
      <div
        className={
          compact
            ? "w-8 h-8 rounded-full bg-sx-stone border border-sx-border"
            : "w-9 h-9 rounded-full bg-sx-stone border border-sx-border"
        }
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={resolvedDark ? "Switch to Light Exchange Mode" : "Switch to Dark Exchange Mode"}
      aria-label={resolvedDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`${
        compact ? "w-8 h-8" : "w-9 h-9"
      } inline-flex items-center justify-center rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border hover:border-sx-border-strong text-sx-ink transition-colors cursor-pointer shrink-0`}
    >
      {resolvedDark ? (
        <Sun className="w-4 h-4 text-sx-amber-text" />
      ) : (
        <Moon className="w-4 h-4 text-sx-ink-soft" />
      )}
    </button>
  );
}
