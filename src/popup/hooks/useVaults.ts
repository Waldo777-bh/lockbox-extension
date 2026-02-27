import { useState, useEffect, useCallback } from "react";
import { getVaultsWithKeys } from "../../lib/cache";
import type { VaultWithKeys } from "../../types";

export function useVaults(isAuthenticated: boolean) {
  const [vaults, setVaults] = useState<VaultWithKeys[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVaults = useCallback(
    async (forceRefresh = false) => {
      if (!isAuthenticated) {
        setVaults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getVaultsWithKeys(forceRefresh);
        setVaults(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load vaults";
        setError(message);
        console.error("Failed to fetch vaults:", err);
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated],
  );

  useEffect(() => {
    fetchVaults(true); // Force refresh on popup open
  }, [fetchVaults]);

  const refresh = useCallback(() => fetchVaults(true), [fetchVaults]);

  return { vaults, loading, error, refresh };
}
