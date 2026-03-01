// Auto-detect service and key type from key value format

import { SERVICES } from "./serviceRegistry";

interface DetectedKey {
  service: string;
  keyName: string;
  confidence: "high" | "medium" | "low";
}

export function detectKeyFromValue(value: string): DetectedKey | null {
  const trimmed = value.trim();

  for (const [serviceKey, service] of Object.entries(SERVICES)) {
    for (const prefix of service.keyPrefixes) {
      if (trimmed.startsWith(prefix)) {
        // Determine specific key name based on prefix
        let keyName = service.commonKeyNames[0] || "API_KEY";

        // Stripe-specific detection
        if (serviceKey === "stripe") {
          if (trimmed.startsWith("sk_")) keyName = "SECRET_KEY";
          else if (trimmed.startsWith("pk_")) keyName = "PUBLISHABLE_KEY";
          else if (trimmed.startsWith("rk_")) keyName = "RESTRICTED_KEY";
        }

        // Clerk has similar prefixes to Stripe
        if (serviceKey === "clerk") {
          if (trimmed.startsWith("pk_")) keyName = "PUBLISHABLE_KEY";
          else if (trimmed.startsWith("sk_")) keyName = "SECRET_KEY";
        }

        // GitHub token types
        if (serviceKey === "github") {
          if (trimmed.startsWith("ghp_")) keyName = "PERSONAL_ACCESS_TOKEN";
          else if (trimmed.startsWith("gho_")) keyName = "OAUTH_TOKEN";
          else if (trimmed.startsWith("ghu_")) keyName = "USER_TOKEN";
          else if (trimmed.startsWith("ghs_")) keyName = "SERVER_TOKEN";
          else if (trimmed.startsWith("ghr_")) keyName = "REFRESH_TOKEN";
        }

        return {
          service: serviceKey,
          keyName,
          confidence: "high",
        };
      }
    }
  }

  // Try generic pattern detection
  if (/^sk-[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return { service: "openai", keyName: "API_KEY", confidence: "medium" };
  }

  if (/^[A-Za-z0-9+/=]{100,}$/.test(trimmed)) {
    return { service: "unknown", keyName: "API_KEY", confidence: "low" };
  }

  return null;
}

export function parseEnvFile(content: string): { name: string; value: string; service: string }[] {
  const results: { name: string; value: string; service: string }[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const name = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!name || !value) continue;

    const detected = detectKeyFromValue(value);
    results.push({
      name,
      value,
      service: detected?.service ?? "unknown",
    });
  }

  return results;
}
