import React, { useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "favourites" | "recent";

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  filter: FilterTab;
  onFilterChange: (f: FilterTab) => void;
}

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "favourites", label: "Favourites" },
  { value: "recent", label: "Recent" },
];

export function SearchBar({
  query,
  onQueryChange,
  filter,
  onFilterChange,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus the search input on mount
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="px-3 pt-3 pb-2 space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-lockbox-text-muted pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search keys..."
          className="w-full pl-8 pr-8 py-2 bg-lockbox-surface border border-lockbox-border rounded-lg text-sm text-lockbox-text placeholder:text-lockbox-text-muted focus:outline-none focus:border-lockbox-accent/50 focus:ring-1 focus:ring-lockbox-accent/20 transition-all"
        />
        {query && (
          <button
            onClick={() => onQueryChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-lockbox-border transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3 h-3 text-lockbox-text-muted" />
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onFilterChange(tab.value)}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors",
              filter === tab.value
                ? "bg-lockbox-accent/15 text-lockbox-accent"
                : "text-lockbox-text-muted hover:text-lockbox-text-secondary hover:bg-lockbox-surface",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
