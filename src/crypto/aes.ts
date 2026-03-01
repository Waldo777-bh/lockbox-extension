// AES-256-GCM encryption/decryption using Web Crypto API

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer as ArrayBuffer;
}

function bufferToBase64(buf: ArrayBuffer | ArrayBufferLike): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function generateSalt(): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(32));
}

export async function generateIV(): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(12));
}

export async function importKey(rawKey: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encrypt(
  plaintext: string,
  keyMaterial: ArrayBuffer
): Promise<{ iv: string; ciphertext: string; tag: string }> {
  const iv = await generateIV();
  const key = await importKey(keyMaterial);
  const encoded = new TextEncoder().encode(plaintext);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource, tagLength: 128 },
    key,
    encoded
  );

  // AES-GCM appends 16-byte auth tag to ciphertext
  const encryptedBytes = new Uint8Array(encrypted);
  const ciphertextBytes = encryptedBytes.slice(0, encryptedBytes.length - 16);
  const tagBytes = encryptedBytes.slice(encryptedBytes.length - 16);

  return {
    iv: bufferToBase64(iv.buffer as ArrayBuffer),
    ciphertext: bufferToBase64(ciphertextBytes.buffer as ArrayBuffer),
    tag: bufferToBase64(tagBytes.buffer as ArrayBuffer),
  };
}

export async function decrypt(
  ciphertext: string,
  tag: string,
  iv: string,
  keyMaterial: ArrayBuffer
): Promise<string> {
  const ivBuf = new Uint8Array(base64ToBuffer(iv));
  const ciphertextBuf = new Uint8Array(base64ToBuffer(ciphertext));
  const tagBuf = new Uint8Array(base64ToBuffer(tag));

  // Reconstruct: ciphertext + tag
  const combined = new Uint8Array(ciphertextBuf.length + tagBuf.length);
  combined.set(ciphertextBuf);
  combined.set(tagBuf, ciphertextBuf.length);

  const key = await importKey(keyMaterial);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuf, tagLength: 128 },
    key,
    combined
  );

  return new TextDecoder().decode(decrypted);
}

export { bufferToBase64, base64ToBuffer };
