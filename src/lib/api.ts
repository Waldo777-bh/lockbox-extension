import { API_BASE_URL } from "./constants";
import { getAuthState, getAuthHeaders } from "./auth";
import type { Vault, ApiKey, RevealedKey, AuditEntry, User } from "../types";

export class ApiError extends Error {
  public code?: string;
  constructor(
    public status: number,
    message: string,
    code?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const state = await getAuthState();
  if (!state.token) {
    throw new ApiError(401, "Not authenticated");
  }

  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(state.token),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    // Try to parse structured error with code
    try {
      const parsed = JSON.parse(text);
      throw new ApiError(response.status, parsed.error || text, parsed.code);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError(response.status, text);
    }
  }

  return response.json();
}

export const api = {
  // User
  async getUser(): Promise<User> {
    return request<User>("/user");
  },

  // Vaults
  async getVaults(): Promise<Vault[]> {
    return request<Vault[]>("/vaults");
  },

  // Keys
  async getKeys(vaultId: string): Promise<ApiKey[]> {
    return request<ApiKey[]>(`/vaults/${vaultId}/keys`);
  },

  // Reveal key value (never cached)
  async revealKey(vaultId: string, keyId: string): Promise<RevealedKey> {
    return request<RevealedKey>(`/vaults/${vaultId}/keys/${keyId}/reveal`);
  },

  // Add key
  async addKey(
    vaultId: string,
    data: { name: string; service: string; value: string; description?: string },
  ): Promise<ApiKey> {
    return request<ApiKey>(`/vaults/${vaultId}/keys`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Audit log
  async getAuditLog(): Promise<AuditEntry[]> {
    return request<AuditEntry[]>("/audit");
  },
};
