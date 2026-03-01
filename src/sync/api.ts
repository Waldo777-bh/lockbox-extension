// Dashboard API client for sync

import { DASHBOARD_URL } from "@/lib/constants";

const API_BASE = `${DASHBOARD_URL}/api`;

interface VaultMetaSummary {
  id: string;
  name: string;
  keyCount: number;
  services: string[];
  lastModified: string;
}

interface ServiceMetaSummary {
  name: string;
  keyCount: number;
  keyNames: string[];
}

export interface SyncPushPayload {
  encryptedVault: string;
  metadata: {
    vaultCount: number;
    totalKeys: number;
    vaults: VaultMetaSummary[];
    services: ServiceMetaSummary[];
    lastModified: string;
  };
  checksum: string;
}

export interface SyncPushResponse {
  success: boolean;
  syncedAt: string;
  version: number;
  tier: "free" | "pro" | "team";
  licenceKey: string | null;
}

interface SyncPullResponse {
  encryptedVault: string;
  lastModified: string;
}

interface SyncStatusResponse {
  lastModified: string;
  hasChanges: boolean;
}

async function getAuthToken(): Promise<string | null> {
  const result = await chrome.storage.local.get("lockbox_account");
  const account = result.lockbox_account;
  return account?.token ?? null;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function pushVault(payload: SyncPushPayload): Promise<SyncPushResponse> {
  return apiRequest<SyncPushResponse>("/sync/push", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function pullVault(): Promise<SyncPullResponse> {
  return apiRequest<SyncPullResponse>("/sync/pull");
}

export async function getSyncStatus(): Promise<SyncStatusResponse> {
  return apiRequest<SyncStatusResponse>("/sync/status");
}

/** Tell the dashboard to clear all synced data (vault, metadata, audit log).
 *  Called before the user deletes their local wallet. */
export async function resetSync(): Promise<void> {
  await apiRequest("/sync/reset", { method: "POST" });
}
