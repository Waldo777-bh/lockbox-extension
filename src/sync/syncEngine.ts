// Sync engine — push/pull encrypted vault to/from dashboard

import { getEncryptedVault, setEncryptedVault, getConfig, setConfig } from "@/lib/storage";
import { pushVault, pullVault, getSyncStatus } from "./api";

export type SyncStatus = "synced" | "syncing" | "offline" | "error";

let syncStatus: SyncStatus = "offline";
let listeners: ((status: SyncStatus) => void)[] = [];

export function getSyncState(): SyncStatus {
  return syncStatus;
}

export function onSyncStatusChange(fn: (status: SyncStatus) => void) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

function setSyncStatus(status: SyncStatus) {
  syncStatus = status;
  listeners.forEach((fn) => fn(status));
}

export async function syncPush(): Promise<void> {
  try {
    setSyncStatus("syncing");
    const vault = await getEncryptedVault();
    if (!vault) {
      setSyncStatus("synced");
      return;
    }

    // We push the encrypted blob as a string — dashboard can't read key values
    await pushVault({
      encryptedVault: JSON.stringify(vault),
      metadata: {
        vaultCount: 0, // Would need decrypted data for accurate count
        keyCount: 0,
        services: [],
        lastModified: new Date().toISOString(),
      },
    });

    await setConfig({ lastSynced: new Date().toISOString() });
    setSyncStatus("synced");
  } catch (err) {
    console.error("Sync push failed:", err);
    setSyncStatus("error");
  }
}

export async function syncPull(): Promise<void> {
  try {
    setSyncStatus("syncing");
    const response = await pullVault();

    if (response?.encryptedVault) {
      const vault = JSON.parse(response.encryptedVault);
      await setEncryptedVault(vault);
      await setConfig({ lastSynced: new Date().toISOString() });
    }

    setSyncStatus("synced");
  } catch (err) {
    console.error("Sync pull failed:", err);
    setSyncStatus("error");
  }
}

export async function checkSync(): Promise<boolean> {
  try {
    const config = await getConfig();
    const status = await getSyncStatus();
    return status.hasChanges;
  } catch {
    return false;
  }
}
