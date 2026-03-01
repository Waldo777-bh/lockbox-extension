import { useState, useEffect, useCallback, useRef } from "react";
import type { DecryptedWallet, WalletStatus, WalletConfig, PopupPage, Vault, ApiKey, AuditEntry } from "@/types";
import { getStatus, setStatus, getEncryptedVault, setEncryptedVault, getConfig, setConfig, getDerivedKey, setDerivedKey, clearDerivedKey, getAccount, setAccount, setRecoveryVault } from "@/lib/storage";
import { createVault, unlockVault, saveVault, createEmptyWallet, createVaultWithRecovery, saveRecoveryVault } from "@/crypto/vault";
import { generateRecoveryPhrase, recoveryPhraseToKeyB64 } from "@/crypto/recovery";
import { DEFAULT_CONFIG, FREE_TIER_LIMITS } from "@/lib/constants";
import { generateId, countAllKeys } from "@/lib/utils";
import { syncPush } from "@/sync/syncEngine";

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

      // Embed recovery key inside wallet data so it's always available when decrypted
      const recoveryKeyB64 = recoveryPhraseToKeyB64(phrase);
      const walletWithRecoveryKey: DecryptedWallet = {
        ...emptyWallet,
        _recoveryKeyB64: recoveryKeyB64,
      };

      const { encrypted, derivedKey, recoveryEncrypted } = await createVaultWithRecovery(
        password,
        phrase,
        walletWithRecoveryKey
      );

      await setEncryptedVault(encrypted);
      // Also store the recovery-encrypted vault for phrase-based recovery
      await setRecoveryVault(recoveryEncrypted);
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
        wallet: walletWithRecoveryKey,
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

      // Sync wallet to dashboard on unlock
      syncPush(wallet).catch(() => {});
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

  // Persist wallet changes and trigger background sync
  const persistWallet = useCallback(async (wallet: DecryptedWallet) => {
    if (!derivedKeyRef.current || !saltRef.current) return;
    const encrypted = await saveVault(wallet, derivedKeyRef.current, saltRef.current);
    await setEncryptedVault(encrypted);

    // Keep recovery vault in sync whenever the wallet has an embedded recovery key
    if (wallet._recoveryKeyB64) {
      try {
        const recoveryVault = await saveRecoveryVault(wallet, wallet._recoveryKeyB64);
        await setRecoveryVault(recoveryVault);
      } catch {
        // Non-critical — don't block persist if recovery vault update fails
      }
    }

    setState((s) => ({ ...s, wallet }));

    // Trigger sync in the background (don't await — fire and forget)
    syncPush(wallet).catch(() => {});
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

  // Delete vault
  const deleteVault = useCallback(
    async (vaultId: string) => {
      if (!state.wallet) return;

      // Don't allow deleting the last vault
      if (state.wallet.vaults.length <= 1) {
        setState((s) => ({ ...s, error: "Cannot delete the last vault" }));
        return;
      }

      const now = new Date().toISOString();
      const vault = state.wallet.vaults.find((v) => v.id === vaultId);

      const updated: DecryptedWallet = {
        ...state.wallet,
        vaults: state.wallet.vaults.filter((v) => v.id !== vaultId),
        auditLog: vault
          ? [
              ...vault.keys.map((k) => ({
                id: generateId(),
                action: "deleted" as const,
                keyId: k.id,
                keyName: k.name,
                service: k.service,
                vaultId: vault.id,
                vaultName: vault.name,
                timestamp: now,
              })),
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

  // Update vault (rename, description, icon)
  const updateVault = useCallback(
    async (vaultId: string, updates: { name?: string; description?: string; icon?: string }) => {
      if (!state.wallet) return;
      const now = new Date().toISOString();

      const updated: DecryptedWallet = {
        ...state.wallet,
        vaults: state.wallet.vaults.map((v) =>
          v.id === vaultId
            ? { ...v, ...updates, updatedAt: now }
            : v
        ),
      };

      await persistWallet(updated);
    },
    [state.wallet, persistWallet]
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

  // Change password
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const vault = await getEncryptedVault();
      if (!vault) throw new Error("No vault found");

      // This will throw if password is wrong
      const { wallet: decryptedWallet } = await unlockVault(currentPassword, vault);

      // Re-encrypt with new password
      const { encrypted, derivedKey } = await createVault(newPassword, decryptedWallet);

      await setEncryptedVault(encrypted);
      await setDerivedKey(derivedKey);
      derivedKeyRef.current = derivedKey;
      saltRef.current = encrypted.salt;

      setState((s) => ({ ...s, wallet: decryptedWallet }));
    },
    []
  );

  // Set up recovery for wallets that were created before recovery vault was stored.
  // User provides their recovery phrase → we derive the key, embed it in wallet data,
  // and generate the recovery vault.
  const setupRecovery = useCallback(
    async (recoveryPhrase: string) => {
      if (!state.wallet) throw new Error("Wallet not unlocked");

      const recoveryKeyB64 = recoveryPhraseToKeyB64(recoveryPhrase);

      // Embed recovery key in wallet data
      const updated: DecryptedWallet = {
        ...state.wallet,
        _recoveryKeyB64: recoveryKeyB64,
      };

      // persistWallet will auto-generate the recovery vault now
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
    deleteVault,
    addVault,
    updateVault,
    changePassword,
    setupRecovery,
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
