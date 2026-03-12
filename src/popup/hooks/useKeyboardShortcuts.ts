import { useEffect } from "react";

/**
 * S7: Global keyboard shortcuts for the Lockbox extension popup.
 *
 * Shortcuts:
 *   Ctrl/Cmd + K  — Focus the search input
 *   Ctrl/Cmd + L  — Lock the wallet
 *   Escape        — Lock (when not in a dialog/sub-page)
 */
export function useKeyboardShortcuts({
  onFocusSearch,
  onLock,
  enabled = true,
}: {
  onFocusSearch?: () => void;
  onLock?: () => void;
  enabled?: boolean;
}) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd + K → Focus search
      if (mod && e.key === "k") {
        e.preventDefault();
        onFocusSearch?.();
        return;
      }

      // Ctrl/Cmd + L → Lock wallet
      if (mod && e.key === "l") {
        e.preventDefault();
        onLock?.();
        return;
      }

      // Escape → Lock (only if no input is focused)
      if (e.key === "Escape") {
        const active = document.activeElement;
        const isInput =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active instanceof HTMLSelectElement;

        // If input is focused, just blur it instead of locking
        if (isInput) {
          (active as HTMLElement).blur();
          return;
        }

        onLock?.();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onFocusSearch, onLock, enabled]);
}
