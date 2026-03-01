// Vault encryption/decryption orchestration

import type { EncryptedVault, DecryptedWallet, Vault } from "@/types";
import { encrypt, decrypt, generateSalt, bufferToBase64, base64ToBuffer } from "./aes";
import { deriveKey, exportDerivedKey, importDerivedKey } from "./argon2";
import { computeHMAC, verifyHMAC } from "./hmac";
import { recoveryPhraseToKey } from "./recovery";

export async function createVault(
  password: string,
  wallet: DecryptedWallet
): Promise<{ encrypted: EncryptedVault; derivedKey: string }> {
  const salt = await generateSalt();
  const keyMaterial = await deriveKey(password, salt);
  const plaintext = JSON.stringify(wallet);

  const { iv, ciphertext, tag } = await encrypt(plaintext, keyMaterial);
  const hmac = await computeHMAC(ciphertext, keyMaterial);

  return {
    encrypted: {
      version: 1,
      salt: bufferToBase64(salt.buffer as ArrayBuffer),
      iv,
      tag,
      ciphertext,
      hmac,
    },
    derivedKey: exportDerivedKey(keyMaterial),
  };
}

export async function unlockVault(
  password: string,
  vault: EncryptedVault
): Promise<{ wallet: DecryptedWallet; derivedKey: string }> {
  const salt = new Uint8Array(base64ToBuffer(vault.salt));
  const keyMaterial = await deriveKey(password, salt);

  // Verify integrity
  const hmacValid = await verifyHMAC(vault.ciphertext, vault.hmac, keyMaterial);
  if (!hmacValid) {
    throw new Error("Invalid password or corrupted vault");
  }

  const plaintext = await decrypt(vault.ciphertext, vault.tag, vault.iv, keyMaterial);
  const wallet = JSON.parse(plaintext) as DecryptedWallet;

  return {
    wallet,
    derivedKey: exportDerivedKey(keyMaterial),
  };
}

export async function unlockVaultWithRecovery(
  recoveryPhrase: string,
  vault: EncryptedVault
): Promise<{ wallet: DecryptedWallet; derivedKey: string }> {
  const keyMaterial = recoveryPhraseToKey(recoveryPhrase);

  const hmacValid = await verifyHMAC(vault.ciphertext, vault.hmac, keyMaterial);
  if (!hmacValid) {
    throw new Error("Invalid recovery phrase");
  }

  const plaintext = await decrypt(vault.ciphertext, vault.tag, vault.iv, keyMaterial);
  const wallet = JSON.parse(plaintext) as DecryptedWallet;

  return {
    wallet,
    derivedKey: exportDerivedKey(keyMaterial),
  };
}

export async function saveVault(
  wallet: DecryptedWallet,
  derivedKeyB64: string,
  existingSalt: string
): Promise<EncryptedVault> {
  const keyMaterial = importDerivedKey(derivedKeyB64);
  const plaintext = JSON.stringify(wallet);

  const { iv, ciphertext, tag } = await encrypt(plaintext, keyMaterial);
  const hmac = await computeHMAC(ciphertext, keyMaterial);

  return {
    version: 1,
    salt: existingSalt,
    iv,
    tag,
    ciphertext,
    hmac,
  };
}

export async function createVaultWithRecovery(
  password: string,
  recoveryPhrase: string,
  wallet: DecryptedWallet
): Promise<{
  encrypted: EncryptedVault;
  derivedKey: string;
  recoveryEncrypted: EncryptedVault;
}> {
  // Create main vault encrypted with password
  const { encrypted, derivedKey } = await createVault(password, wallet);

  // Also encrypt with recovery key for backup
  const recoveryKeyMaterial = recoveryPhraseToKey(recoveryPhrase);
  const plaintext = JSON.stringify(wallet);
  const salt = await generateSalt();
  const { iv, ciphertext, tag } = await encrypt(plaintext, recoveryKeyMaterial);
  const hmac = await computeHMAC(ciphertext, recoveryKeyMaterial);

  const recoveryEncrypted: EncryptedVault = {
    version: 1,
    salt: bufferToBase64(salt.buffer as ArrayBuffer),
    iv,
    tag,
    ciphertext,
    hmac,
  };

  return { encrypted, derivedKey, recoveryEncrypted };
}

/** Re-encrypt the wallet with the recovery key and return a fresh recovery vault.
 *  Used by persistWallet to keep the recovery vault in sync on every save. */
export async function saveRecoveryVault(
  wallet: DecryptedWallet,
  recoveryKeyB64: string
): Promise<EncryptedVault> {
  const recoveryKeyMaterial = base64ToBuffer(recoveryKeyB64);
  const plaintext = JSON.stringify(wallet);
  const salt = await generateSalt();
  const { iv, ciphertext, tag } = await encrypt(plaintext, recoveryKeyMaterial);
  const hmac = await computeHMAC(ciphertext, recoveryKeyMaterial);
  return {
    version: 1,
    salt: bufferToBase64(salt.buffer as ArrayBuffer),
    iv,
    tag,
    ciphertext,
    hmac,
  };
}

export function createEmptyWallet(): DecryptedWallet {
  const now = new Date().toISOString();
  return {
    vaults: [
      {
        id: crypto.randomUUID(),
        name: "Default Vault",
        description: "",
        icon: "lock",
        keys: [],
        createdAt: now,
        updatedAt: now,
      },
    ],
    auditLog: [],
  };
}
