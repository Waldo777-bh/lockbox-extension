import React from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";

// ── Toggle switch ──
export function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="flex-shrink-0"
    >
      {enabled ? (
        <ToggleRight className="w-6 h-6 text-lockbox-accent" />
      ) : (
        <ToggleLeft className="w-6 h-6 text-lockbox-text-muted" />
      )}
    </button>
  );
}

// ── Settings row ──
export function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-lockbox-text">{label}</p>
        {description && (
          <p className="text-[10px] text-lockbox-text-muted mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ── Select ──
export function SettingSelect({
  value,
  options,
  onChange,
}: {
  value: number;
  options: { label: string; value: number }[];
  onChange: (val: number) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="bg-lockbox-surface border border-lockbox-border rounded-md px-2 py-1 text-xs text-lockbox-text focus:border-lockbox-accent transition-colors appearance-none cursor-pointer min-w-[110px]"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ── Section ──
export function SettingsSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        {icon}
        <h2 className="text-xs font-semibold text-lockbox-text-secondary uppercase tracking-wider">
          {title}
        </h2>
      </div>
      <div className="bg-lockbox-surface border border-lockbox-border rounded-lg px-3.5 divide-y divide-lockbox-border">
        {children}
      </div>
    </div>
  );
}
