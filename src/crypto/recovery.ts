// BIP39 mnemonic generation for wallet recovery

import { generateMnemonic, validateMnemonic, mnemonicToSeedSync } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";

export function generateRecoveryPhrase(): string {
  return generateMnemonic(wordlist, 128); // 12 words
}

export function validateRecoveryPhrase(phrase: string): boolean {
  return validateMnemonic(phrase, wordlist);
}

export function recoveryPhraseToKey(phrase: string): ArrayBuffer {
  const seed = mnemonicToSeedSync(phrase);
  // Use first 32 bytes of the 64-byte seed as the recovery key
  return seed.slice(0, 32).buffer as ArrayBuffer;
}

/** Same as recoveryPhraseToKey but returns a base64-encoded string for storage */
export function recoveryPhraseToKeyB64(phrase: string): string {
  const buf = recoveryPhraseToKey(phrase);
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export function getRandomWordsForVerification(
  phrase: string,
  count: number = 3
): { index: number; word: string }[] {
  const words = phrase.split(" ");
  const indices: number[] = [];
  while (indices.length < count) {
    const idx = Math.floor(Math.random() * words.length);
    if (!indices.includes(idx)) indices.push(idx);
  }
  indices.sort((a, b) => a - b);
  return indices.map((index) => ({ index, word: words[index] }));
}
