import React from "react";
import { SERVICE_COLORS } from "@/types";

interface ServiceIconProps {
  service: string;
  size?: number;
}

export function ServiceIcon({ service, size = 32 }: ServiceIconProps) {
  const normalised = service.toLowerCase().replace(/[\s_-]/g, "_");
  const color = SERVICE_COLORS[normalised] ?? SERVICE_COLORS.default;
  const letter = service.charAt(0).toUpperCase();

  return (
    <div
      className="rounded-lg flex items-center justify-center shrink-0 font-bold select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        backgroundColor: `${color}20`,
        color: color,
      }}
      aria-label={`${service} icon`}
    >
      {letter}
    </div>
  );
}
