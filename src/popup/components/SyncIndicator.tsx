import React from "react";

interface SyncIndicatorProps {
  status: "synced" | "syncing" | "offline";
}

const STATUS_CONFIG: Record<
  SyncIndicatorProps["status"],
  { color: string; label: string; pulse: boolean }
> = {
  synced: { color: "#10b981", label: "Synced", pulse: false },
  syncing: { color: "#f59e0b", label: "Syncing...", pulse: true },
  offline: { color: "#ef4444", label: "Offline", pulse: false },
};

export function SyncIndicator({ status }: SyncIndicatorProps) {
  const { color, label, pulse } = STATUS_CONFIG[status];

  return (
    <div className="relative group" aria-label={label}>
      {/* Dot */}
      <span
        className={`block w-2 h-2 rounded-full ${pulse ? "animate-pulse" : ""}`}
        style={{ backgroundColor: color }}
      />

      {/* Tooltip */}
      <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2 py-1 text-[10px] font-medium text-lockbox-text bg-lockbox-surface border border-lockbox-border rounded shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
        {label}
      </span>
    </div>
  );
}
