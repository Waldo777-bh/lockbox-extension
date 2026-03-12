// Key derivation using PBKDF2 with high iterations (Web Crypto API)
// PBKDF2 with 600K iterations of SHA-256 provides strong security
// and works everywhere (popup, service worker, content script)

import { bufferToBase64, base64ToBuffer } from "./aes";

export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 600_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
}

export function exportDerivedKey(key: ArrayBuffer): string {
  return bufferToBase64(key);
}

export function importDerivedKey(b64: string): ArrayBuffer {
  return base64ToBuffer(b64);
}
