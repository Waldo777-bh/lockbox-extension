import { useState, useMemo } from "react";
import type { VaultWithKeys } from "../../types";

export function useSearch(vaults: VaultWithKeys[]) {
  const [query, setQuery] = useState("");

  const filteredVaults = useMemo(() => {
    if (!query.trim()) return vaults;

    const lower = query.toLowerCase().trim();

    return vaults
      .map((vault) => ({
        ...vault,
        keys: vault.keys.filter(
          (key) =>
            key.name.toLowerCase().includes(lower) ||
            key.service.toLowerCase().includes(lower) ||
            vault.name.toLowerCase().includes(lower),
        ),
      }))
      .filter((vault) => vault.keys.length > 0);
  }, [vaults, query]);

  return { query, setQuery, filteredVaults };
}
