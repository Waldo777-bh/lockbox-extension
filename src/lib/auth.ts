import { STORAGE_KEYS, DASHBOARD_URL } from "./constants";
import type { User, AuthState } from "../types";

export async function getAuthState(): Promise<AuthState> {
  try {
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
    ]);

    const token = result[STORAGE_KEYS.AUTH_TOKEN] as string | undefined;
    const user = result[STORAGE_KEYS.USER_DATA] as User | undefined;

    if (token && user) {
      return {
        isAuthenticated: true,
        user,
        token,
        loading: false,
      };
    }

    // Try to get session from dashboard cookies
    const sessionToken = await getClerkSession();
    if (sessionToken) {
      return {
        isAuthenticated: true,
        user: null,
        token: sessionToken,
        loading: false,
      };
    }

    return {
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
    };
  } catch {
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
    };
  }
}

async function getClerkSession(): Promise<string | null> {
  try {
    const cookie = await chrome.cookies.get({
      url: DASHBOARD_URL,
      name: "__session",
    });
    return cookie?.value ?? null;
  } catch {
    // cookies API may not be available
    return null;
  }
}

export async function saveAuthToken(token: string, user: User): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.AUTH_TOKEN]: token,
    [STORAGE_KEYS.USER_DATA]: user,
  });
}

export async function clearAuth(): Promise<void> {
  await chrome.storage.local.remove([
    STORAGE_KEYS.AUTH_TOKEN,
    STORAGE_KEYS.USER_DATA,
    STORAGE_KEYS.CACHE_DATA,
    STORAGE_KEYS.RECENT_KEYS,
  ]);
}

export function getAuthHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}
