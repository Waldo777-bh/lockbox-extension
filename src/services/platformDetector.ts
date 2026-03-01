// Detect which platform the user is on and filter relevant keys

import { KNOWN_PLATFORMS } from "@/lib/constants";

export function detectPlatform(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    for (const platform of KNOWN_PLATFORMS) {
      if (hostname === platform.domain || hostname.endsWith("." + platform.domain)) {
        return platform.service;
      }
    }
  } catch {}
  return null;
}

export function isKnownPlatform(url: string): boolean {
  return detectPlatform(url) !== null;
}

export function getPlatformForDomain(hostname: string): string | null {
  for (const platform of KNOWN_PLATFORMS) {
    if (hostname === platform.domain || hostname.endsWith("." + platform.domain)) {
      return platform.service;
    }
  }
  return null;
}
