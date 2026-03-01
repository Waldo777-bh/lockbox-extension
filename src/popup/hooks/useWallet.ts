import { useState, useEffect, useCallback, useRef } from "react";
import type { DecryptedWallet, WalletStatus, WalletConfig, PopupPage, Vault, ApiKey, AuditEntry } from "@/types";
import { getStatus, setStatus, getEncryptedVault, setEncryptedVault, getConfig, setConfig, getDerivedKey, setDerivedKey, clearDerivedKey, getAccount, setAccount } from "@/lib/storage";
import { createVault, unlockVault, saveVault, createEmptyWallet, createVaultWithRecovery } from "@/crypto/vault";
import { generateRecoveryPhrase } from "@/crypto/recovery";
import { DEFAULT_CONFIG, FREE_TIER_LIMITS } from "@/lib/constants";
import { generateId, countAllKeys } from "@/lib/utils";

interface WalletState {
  status: WalletStatus;
  wallet: DecryptedWallet | null;
  config: WalletConfig;
  page: PopupPage;
  loading: boolean;
  error: string | null;
  recoveryPhrase: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    status: "uninitialized",
    wallet: null,
    config: DEFAULT_CONFIG,
    page: "welcome",
    loading: true,
    error: null,
    recoveryPhrase: null,
  });
  const derivedKeyRef = useRef<string | null>(null);
  const saltRef = useRef<string | null>(null);

  // Initialize: check wallet status
  useEffect(() => {
    (async () => {
      try {
        const [status, config, vault, derivedKey] = await Promise.all([
          getStatus(),
          getConfig(),
          getEncryptedVault(),
          getDerivedKey(),
        ]);

        let page: PopupPage;
        let walletData: DecryptedWallet | null = null;

        if (status === "uninitialized" || !vault) {
          page = "welcome";
        } else if (!derivedKey) {
          page = "lock-screen";
        } else {
          // Wallet exists and is unlocked — try to decrypt
          try {
            const { wallet: w } = await unlockWithDerivedKey(vault, derivedKey);
            walletData = w;
            derivedKeyRef.current = derivedKey;
            saltRef.current = vault.salt;
            page = "home";
          } catch {
            page = "lock-screen";
          }
        }

        setState((s) => ({
          ...s,
          status: walletData ? "unlocked" : status,
          wallet: walletData,
          config,
          page,
          loading: false,
        }));
      } catch (err) {
        setState((s) => ({ ...s, loading: false, error: "Failed to initialize wallet" }));
      }
    })();
  }, []);

  const navigate = useCallback((page: PopupPage) => {
    setState((s) => ({ ...s, page, error: null }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((s) => ({ ...s, error }));
  }, []);

  // Create new wallet
  const createNewWallet = useCallback(async (password: string) => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      const phrase = generateRecoveryPhrase();
      const emptyWallet = createEmptyWallet();

      const { encrypted, derivedKey, recoveryEncrypted } = await createVaultWithRecovery(
        password,
        phrase,
        emptyWallet
      );

      await setEncryptedVault(encrypted);
      await setStatus("unlocked");
      await setDerivedKey(derivedKey);
      await setConfig(DEFAULT_CONFIG);
      await setAccount({
        email: null,
        name: "My Wallet",
        walletId: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });

      derivedKeyRef.current = derivedKey;
      saltRef.current = encrypted.salt;

      setState((s) => ({
        ...s,
        status: "unlocked",
        wallet: emptyWallet,
        recoveryPhrase: phrase,
        page: "recovery-phrase",
        loading: false,
      }));
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message || "Failed to create wallet" }));
    }
  }, []);

  // Unlock wallet
  const unlock = useCallback(async (password: string) => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      const vault = await getEncryptedVault();
      if (!vault) throw new Error("No vault found");

      const { wallet, derivedKey } = await unlockVault(password, vault);
      await setDerivedKey(derivedKey);
      await setStatus("unlocked");
      derivedKeyRef.current = derivedKey;
      saltRef.current = vault.salt;

      setState((s) => ({
        ...s,
        status: "unlocked",
        wallet,
        page: "home",
        loading: false,
      }));

      // Notify background about activity
      chrome.runtime?.sendMessage({ type: "LOCKBOX_ACTIVITY" }).catch(() => {});
    } catch (err: any) {
      setState((s) => ({
        ...s,
        loading: false,
        error: "Invalid password",
      }));
    }
  }, []);

  // Lock wallet
  const lock = useCallback(async () => {
    await clearDerivedKey();
    await setStatus("locked");
    derivedKeyRef.current = null;
    setState((s) => ({
      ...s,
      status: "locked",
      wallet: null,
      page: "lock-screen",
    }));
    chrome.runtime?.sendMessage({ type: "LOCKBOX_LOCK" }).catch(() => {});
  }, []);

  // Persist wallet changes
  const persistWallet = useCallback(async (wallet: DecryptedWallet) => {
    if (!derivedKeyRef.current || !saltRef.current) return;
    const encrypted = await saveVault(wallet, derivedKeyRef.current, saltRef.current);
    await setEncryptedVault(encrypted);
    setState((s) => ({ ...s, wallet }));
  }, []);

  // Add key
  const addKey = useCallback(
    async (vaultId: string, key: Omit<ApiKey, "id" | "vaultId" | "createdAt" | "updatedAt" | "lastAccessedAt">) => {
      if (!state.wallet) return;

      // Check tier limits
      const totalKeys = countAllKeys(state.wallet.vaults);
      if (state.config.tier === "free" && totalKeys >= FREE_TIER_LIMITS.maxKeys) {
        setState((s) => ({ ...s, error: `Free tier limit: ${FREE_TIER_LIMITS.maxKeys} keys maximum` }));
        return;
      }

      const now = new Date().toISOString();
      const newKey: ApiKey = {
        ...key,
        id: generateId(),
        vaultId,
        lastAccessedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      const updated: DecryptedWallet = {
        ...state.wallet,
        vaults: state.wallet.vaults.map((v) =>
          v.id === vaultId
            ? { ...v, keys: [...v.keys, newKey], updatedAt: now }
            : v
        ),
        auditLog: [
          {
            id: generateId(),
            action: "created" as const,
            keyId: newKey.id,
            keyName: newKey.name,
            service: newKey.service,
            vaultId,
            vaultName: state.wallet.vaults.find((v) => v.id === vaultId)?.name || "",
            timestamp: now,
          },
          ...state.wallet.auditLog,
        ].slice(0, 500),
      };

      await persistWallet(updated);
    },
    [state.wallet, state.config.tier, persistWallet]
  );

  // Update key
  const updateKey = useCallback(
    async (keyId: string, updates: Partial<ApiKey>) => {
      if (!state.wallet) return;
      const now = new Date().toISOString();

      const updated: DecryptedWallet = {
        ...state.wallet,
        vaults: state.wallet.vaults.map((v) => ({
          ...v,
          keys: v.keys.map((k) =>
            k.id === keyId ? { ...k, ...updates, updatedAt: now } : k
          ),
        })),
      };

      await persistWallet(updated);
    },
    [state.wallet, persistWallet]
  );

  // Delete key
  const deleteKey = useCallback(
    async (keyId: string) => {
      if (!state.wallet) return;
      const now = new Date().toISOString();

      // Find key info for audit
      let keyInfo: ApiKey | undefined;
      let vaultInfo: Vault | undefined;
      for (const v of state.wallet.vaults) {
        const k = v.keys.find((k) => k.id === keyId);
        if (k) {
          keyInfo = k;
          vaultInfo = v;
          break;
        }
      }

      const updated: DecryptedWallet = {
        ...state.wallet,
        vaults: state.wallet.vaults.map((v) => ({
          ...v,
          keys: v.keys.filter((k) => k.id !== keyId),
          updatedAt: now,
        })),
        auditLog: keyInfo
          ? [
              {
                id: generateId(),
                action: "deleted" as const,
                keyId,
                keyName: keyInfo.name,
                service: keyInfo.service,
                vaultId: vaultInfo?.id || "",
                vaultName: vaultInfo?.name || "",
                timestamp: now,
              },
              ...state.wallet.auditLog,
            ].slice(0, 500)
          : state.wallet.auditLog,
      };

      await persistWallet(updated);
    },
    [state.wallet, persistWallet]
  );

  // Add vault
  const addVault = useCallback(
    async (name: string, description: string, icon: string) => {
      if (!state.wallet) return;

      if (
        state.config.tier === "free" &&
        state.wallet.vaults.length >= FREE_TIER_LIMITS.maxVaults
      ) {
        setState((s) => ({ ...s, error: "Free tier: 1 vault maximum. Upgrade to Pro." }));
        return;
      }

      const now = new Date().toISOString();
      const newVault: Vault = {
        id: generateId(),
        name,
        description,
        icon,
        keys: [],
        createdAt: now,
        updatedAt: now,
      };

      const updated: DecryptedWallet = {
        ...state.wallet,
        vaults: [...state.wallet.vaults, newVault],
      };

      await persistWallet(updated);
    },
    [state.wallet, state.config.tier, persistWallet]
  );

  // Record key access
  const recordAccess = useCallback(
    async (keyId: string, action: AuditEntry["action"], site?: string) => {
      if (!state.wallet) return;
      const now = new Date().toISOString();

      let keyInfo: ApiKey | undefined;
      let vaultInfo: Vault | undefined;
      for (const v of state.wallet.vaults) {
        const k = v.keys.find((k) => k.id === keyId);
        if (k) {
          keyInfo = k;
          vaultInfo = v;
          break;
        }
      }
      if (!keyInfo || !vaultInfo) return;

      const updated: DecryptedWallet = {
        ...state.wallet,
        vaults: state.wallet.vaults.map((v) => ({
          ...v,
          keys: v.keys.map((k) =>
            k.id === keyId ? { ...k, lastAccessedAt: now } : k
          ),
        })),
        auditLog: [
          {
            id: generateId(),
            action,
            keyId,
            keyName: keyInfo.name,
            service: keyInfo.service,
            vaultId: vaultInfo.id,
            vaultName: vaultInfo.name,
            site,
            timestamp: now,
          },
          ...state.wallet.auditLog,
        ].slice(0, 500),
      };

      await persistWallet(updated);
    },
    [state.wallet, persistWallet]
  );

  // Update config
  const updateConfig = useCallback(
    async (updates: Partial<WalletConfig>) => {
      await setConfig(updates);
      setState((s) => ({ ...s, config: { ...s.config, ...updates } }));
    },
    []
  );

  return {
    ...state,
    navigate,
    setError,
    createNewWallet,
    unlock,
    lock,
    addKey,
    updateKey,
    deleteKey,
    addVault,
    recordAccess,
    updateConfig,
    persistWallet,
  };
}

// Helper: try to decrypt with an existing derived key stored in session
async function unlockWithDerivedKey(vault: any, derivedKeyB64: string) {
  const { importDerivedKey } = await import("@/crypto/argon2");
  const { decrypt } = await import("@/crypto/aes");
  const { verifyHMAC } = await import("@/crypto/hmac");

  const keyMaterial = importDerivedKey(derivedKeyB64);
  const hmacValid = await verifyHMAC(vault.ciphertext, vault.hmac, keyMaterial);
  if (!hmacValid) throw new Error("Invalid key");

  const plaintext = await decrypt(vault.ciphertext, vault.tag, vault.iv, keyMaterial);
  const wallet = JSON.parse(plaintext) as DecryptedWallet;
  return { wallet };
}
