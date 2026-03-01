import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-xl bg-lockbox-surface border border-lockbox-border flex items-center justify-center text-lockbox-text-muted mb-3">
        {icon}
      </div>

      <h3 className="text-sm font-semibold text-lockbox-text mb-1">
        {title}
      </h3>

      {description && (
        <p className="text-xs text-lockbox-text-muted leading-relaxed max-w-[240px]">
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-1.5 text-xs font-medium rounded-lg bg-lockbox-accent text-lockbox-bg hover:bg-lockbox-accent-hover transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
