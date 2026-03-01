// HMAC-SHA256 for vault integrity checking using Web Crypto API

import { bufferToBase64, base64ToBuffer } from "./aes";

export async function computeHMAC(
  data: string,
  keyMaterial: ArrayBuffer
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const encoded = new TextEncoder().encode(data);
  const signature = await crypto.subtle.sign("HMAC", key, encoded);
  return bufferToBase64(signature);
}

export async function verifyHMAC(
  data: string,
  hmac: string,
  keyMaterial: ArrayBuffer
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const encoded = new TextEncoder().encode(data);
  const signatureBuf = base64ToBuffer(hmac);
  return crypto.subtle.verify("HMAC", key, signatureBuf, encoded);
}
