import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lightbulb } from "lucide-react";

const TIPS_STORAGE_KEY = "lockbox_dismissed_tips";

interface OnboardingTipProps {
  /** Unique ID for this tip so it can be dismissed permanently */
  tipId: string;
  /** The tip text to display */
  message: string;
  /** Position relative to trigger: "above" | "below" */
  position?: "above" | "below";
}

/**
 * N3: Lightweight onboarding tip for new users.
 * Shows once per tip ID. Dismissed tips are stored in chrome.storage.local.
 * Non-intrusive — small accent-colored callout with dismiss button.
 */
export function OnboardingTip({ tipId, message, position = "below" }: OnboardingTipProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if this tip has been dismissed
    chrome.storage.local.get(TIPS_STORAGE_KEY, (result) => {
      const dismissed: string[] = result[TIPS_STORAGE_KEY] ?? [];
      if (!dismissed.includes(tipId)) {
        // Small delay so it doesn't flash during page transition
        setTimeout(() => setVisible(true), 600);
      }
    });
  }, [tipId]);

  const dismiss = () => {
    setVisible(false);
    chrome.storage.local.get(TIPS_STORAGE_KEY, (result) => {
      const dismissed: string[] = result[TIPS_STORAGE_KEY] ?? [];
      chrome.storage.local.set({ [TIPS_STORAGE_KEY]: [...dismissed, tipId] });
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`flex items-start gap-2 px-3 py-2 mx-3 rounded-lg bg-lockbox-accent/10 border border-lockbox-accent/20 ${
            position === "above" ? "mb-2" : "mt-2"
          }`}
          initial={{ opacity: 0, y: position === "above" ? 8 : -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: position === "above" ? 8 : -8, height: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Lightbulb className="w-3.5 h-3.5 text-lockbox-accent flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-lockbox-accent leading-relaxed flex-1">
            {message}
          </p>
          <button
            onClick={dismiss}
            className="p-0.5 rounded text-lockbox-accent/60 hover:text-lockbox-accent transition-colors flex-shrink-0"
            aria-label="Dismiss tip"
          >
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
