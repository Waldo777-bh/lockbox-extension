import React from "react";
import { getPasswordStrength } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const { score, label, color } = getPasswordStrength(password);
  const segments = 4;

  return (
    <div className="space-y-1.5">
      {/* Strength bar */}
      <div className="flex gap-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full transition-colors duration-300"
            style={{
              backgroundColor: i < score ? color : "#2a2a3a",
            }}
          />
        ))}
      </div>

      {/* Strength label */}
      <p
        className="text-[11px] font-medium capitalize"
        style={{ color }}
      >
        {label}
      </p>
    </div>
  );
}
