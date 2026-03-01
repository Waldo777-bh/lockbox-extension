import React from "react";

interface TierBadgeProps {
  tier: "free" | "pro";
}

export function TierBadge({ tier }: TierBadgeProps) {
  if (tier === "pro") {
    return (
      <span
        className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold leading-none uppercase tracking-wide"
        style={{
          background: "linear-gradient(135deg, #FFD700, #FFA500)",
          color: "#1a1a24",
        }}
      >
        PRO
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-lockbox-text-muted/20 text-lockbox-text-muted text-[9px] font-bold leading-none uppercase tracking-wide">
      FREE
    </span>
  );
}
