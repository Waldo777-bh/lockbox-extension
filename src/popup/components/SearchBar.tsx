import React, { useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  query: string;
  onChange: (value: string) => void;
}

export function SearchBar({ query, onChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus on mount
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  return (
    <div className="px-3 py-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-lockbox-text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search keys, vaults, services..."
          className="w-full pl-8 pr-8 py-2 bg-lockbox-surface border border-lockbox-border rounded-lg text-sm text-lockbox-text placeholder:text-lockbox-text-muted focus:outline-none focus:border-lockbox-accent/50 focus:ring-1 focus:ring-lockbox-accent/20 transition-all"
        />
        {query && (
          <button
            onClick={() => onChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-lockbox-border transition-colors"
          >
            <X className="w-3 h-3 text-lockbox-text-muted" />
          </button>
        )}
      </div>
    </div>
  );
}
