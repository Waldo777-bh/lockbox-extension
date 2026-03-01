// Merge strategy for vault sync conflicts
// Currently: last-write-wins based on timestamp

import type { DecryptedWallet } from "@/types";

export function mergeWallets(
  local: DecryptedWallet,
  remote: DecryptedWallet
): DecryptedWallet {
  // Simple last-write-wins: compare most recent vault update timestamps
  const localLatest = getLatestTimestamp(local);
  const remoteLatest = getLatestTimestamp(remote);

  if (remoteLatest > localLatest) {
    return remote;
  }

  return local;
}

function getLatestTimestamp(wallet: DecryptedWallet): number {
  let latest = 0;
  for (const vault of wallet.vaults) {
    const vaultTime = new Date(vault.updatedAt).getTime();
    if (vaultTime > latest) latest = vaultTime;
    for (const key of vault.keys) {
      const keyTime = new Date(key.updatedAt).getTime();
      if (keyTime > latest) latest = keyTime;
    }
  }
  return latest;
}
