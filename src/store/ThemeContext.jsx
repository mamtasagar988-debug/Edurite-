import { createContext, useContext, useState, useEffect } from "react";

/* 1. DEFINE THEMES FIRST ─────────────────────────────────────────── */
const DARK = {
  bg:          "#0B0D14",
  surface:     "#12151F",
  surface2:    "#0E1019",
  border:      "#1E2235",
  accent:      "#F59E0B",
  accentDim:   "rgba(245,158,11,0.12)",
  accentBorder:"rgba(245,158,11,0.3)",
  text:        "#E8EAED",
  muted:       "#6B7280",
  secondary:   "#9CA3AF",
  green:       "#10B981",
  greenDim:    "rgba(16,185,129,0.12)",
  blue:        "#3B82F6",
  blueDim:     "rgba(59,130,246,0.12)",
  purple:      "#A855F7",
  purpleDim:   "rgba(168,85,247,0.12)",
  red:         "#EF4444",
  redDim:      "rgba(239,68,68,0.12)",
  orange:      "#F97316",
  orangeDim:   "rgba(249,115,22,0.12)",
};

const LIGHT = {
  bg:          "#F1F5F9",
  surface:     "#FFFFFF",
  surface2:    "#F8FAFC",
  border:      "#E2E8F0",
  accent:      "#D97706",
  accentDim:   "rgba(217,119,6,0.10)",
  accentBorder:"rgba(217,119,6,0.3)",
  text:        "#0F172A",
  muted:       "#64748B",
  secondary:   "#475569",
  green:       "#059669",
  greenDim:    "rgba(5,150,105,0.10)",
  blue:        "#2563EB",
  blueDim:     "rgba(37,99,235,0.10)",
  purple:      "#7C3AED",
  purpleDim:   "rgba(124,58,237,0.10)",
  red:         "#DC2626",
  redDim:      "rgba(220,38,38,0.10)",
  orange:      "#EA580C",
  orangeDim:   "rgba(234,88,12,0.10)",
};

/* 2. INITIALIZE CONTEXT (Now DARK is safely available) ───────────── */
const ThemeContext = createContext({
  theme:       "dark",
  colors:      DARK,
  toggleTheme: () => {},
});

/* 3. DEFINE PROVIDER COMPONENT ──────────────────────────────────── */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("app_theme") ?? "dark";
  });

  const colors = theme === "dark" ? DARK : LIGHT;

  const toggleTheme = () => {
    setTheme(t => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("app_theme", next);
      return next;
    });
  };

  useEffect(() => {
    document.body.style.background = colors.bg;
    document.body.style.color      = colors.text;
  }, [colors]);

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* 4. EXPORT CUSTOM HOOK LAST ────────────────────────────────────── */
export const useTheme = () => useContext(ThemeContext);
