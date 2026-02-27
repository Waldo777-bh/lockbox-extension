import { useState, useEffect, useCallback } from "react";
import { getAuthState, clearAuth, saveAuthToken } from "../../lib/auth";
import type { AuthState, User } from "../../types";

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
  });

  const checkAuth = useCallback(async () => {
    setAuth((prev) => ({ ...prev, loading: true }));
    const state = await getAuthState();
    setAuth({ ...state, loading: false });
  }, []);

  useEffect(() => {
    checkAuth();

    // Listen for auth token messages from the dashboard
    const listener = (message: {
      type: string;
      token?: string;
      user?: User;
    }) => {
      if (message.type === "LOCKBOX_AUTH_TOKEN" && message.token && message.user) {
        saveAuthToken(message.token, message.user).then(() => {
          setAuth({
            isAuthenticated: true,
            user: message.user!,
            token: message.token!,
            loading: false,
          });
        });
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [checkAuth]);

  const signOut = useCallback(async () => {
    await clearAuth();
    setAuth({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
    });
  }, []);

  return { ...auth, signOut, checkAuth };
}
