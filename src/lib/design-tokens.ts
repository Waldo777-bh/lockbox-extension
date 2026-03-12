/**
 * Lockbox Design Tokens — Single source of truth
 *
 * These tokens define the canonical Lockbox visual language shared across
 * the extension popup, side panel, content scripts, and dashboard.
 *
 * Usage:
 *   - Extension: consumed via Tailwind config (lockbox-* classes) and CSS vars
 *   - Dashboard: consumed via Tailwind config (brand-* classes)
 *   - Marketing site: consumed via CSS custom properties (--accent, --bg-*, etc.)
 *
 * When adding or changing colors, update this file first, then propagate
 * to the relevant tailwind.config / globals.css in each project.
 */

export const tokens = {
  color: {
    dark: {
      bg:             "#0f0f14",
      bgSecondary:    "#0f1218",
      bgTertiary:     "#1a1a24",
      surface:        "#1a1a24",
      surfaceHover:   "#222230",
      border:         "#2a2a3a",
      borderBright:   "#3a3a4a",
      text:           "#ffffff",
      textSecondary:  "#9ca3af",
      textMuted:      "#6b7280",
      accent:         "#00d87a",
      accentHover:    "#00b368",
      danger:         "#ef4444",
      warning:        "#f59e0b",
      success:        "#10b981",
      pro:            "#FFD700",
      blue:           "#4a9eff",
      purple:         "#9b7aff",
    },
    light: {
      bg:             "#f5f5f7",
      bgSecondary:    "#f0f0f4",
      bgTertiary:     "#e8e8ee",
      surface:        "#ffffff",
      surfaceHover:   "#f5f5f7",
      border:         "#e0e0e6",
      borderBright:   "#c8c8d0",
      text:           "#1a1a24",
      textSecondary:  "#5a6178",
      textMuted:      "#8b92a5",
      accent:         "#00b368",
      accentHover:    "#009a5a",
      danger:         "#dc2626",
      warning:        "#d97706",
      success:        "#059669",
      pro:            "#b8960c",
      blue:           "#2563eb",
      purple:         "#7c3aed",
    },
  },
  radius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    full: "9999px",
  },
  font: {
    sans: ["Inter", "system-ui", "sans-serif"],
    mono: ["JetBrains Mono", "monospace"],
    display: ["Outfit", "sans-serif"],
  },
  spacing: {
    popupWidth:  420,
    popupHeight: 640,
    sidebarWidth: 256,
    sidebarCollapsed: 64,
  },
} as const;

export type LockboxTheme = "dark" | "light";
export type LockboxTokens = typeof tokens;
