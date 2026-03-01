import type { WalletConfig } from "@/types";

export const DASHBOARD_URL = "https://dashboard.yourlockbox.dev";

export const DEFAULT_CONFIG: WalletConfig = {
  autoLockMinutes: 15,
  tier: "free",
  licenseKey: null,
  lastSynced: null,
  dashboardUrl: DASHBOARD_URL,
  theme: "dark",
  clipboardClearSeconds: 30,
  autoFillEnabled: true,
  keyCaptureEnabled: true,
  compactMode: false,
  autoSyncEnabled: true,
};

export const FREE_TIER_LIMITS = {
  maxVaults: 1,
  maxKeys: 25,
};

export const STORAGE_KEYS = {
  VAULT: "lockbox_vault",
  RECOVERY_VAULT: "lockbox_recovery_vault",
  CONFIG: "lockbox_config",
  STATUS: "lockbox_status",
  ACCOUNT: "lockbox_account",
  SITE_PERMISSIONS: "lockbox_site_permissions",
  DERIVED_KEY: "lockbox_derived_key",
  RECENT_KEYS: "lockbox_recent_keys",
} as const;

export const REVEAL_DURATION_MS = 10_000;
export const COPY_FEEDBACK_MS = 2_000;

export const PASSWORD_MIN_LENGTH = 8;

export const AUTO_LOCK_OPTIONS = [
  { label: "5 minutes", value: 5 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "Never", value: 0 },
];

export const CLIPBOARD_CLEAR_OPTIONS = [
  { label: "30 seconds", value: 30 },
  { label: "1 minute", value: 60 },
  { label: "5 minutes", value: 300 },
  { label: "Never", value: 0 },
];

export const API_KEY_FIELD_SELECTORS = [
  'input[name*="api_key" i]',
  'input[name*="apikey" i]',
  'input[name*="api-key" i]',
  'input[name*="secret_key" i]',
  'input[name*="secretkey" i]',
  'input[name*="secret-key" i]',
  'input[name*="access_token" i]',
  'input[name*="accesstoken" i]',
  'input[name*="access-token" i]',
  'input[name*="api_token" i]',
  'input[name*="bearer" i]',
  'input[name*="authorization" i]',
  'input[id*="api_key" i]',
  'input[id*="apikey" i]',
  'input[id*="api-key" i]',
  'input[id*="secret_key" i]',
  'input[id*="secretkey" i]',
  'input[id*="access_token" i]',
  'input[id*="api_token" i]',
  'input[placeholder*="api key" i]',
  'input[placeholder*="secret key" i]',
  'input[placeholder*="access token" i]',
  'input[placeholder*="api token" i]',
  'input[placeholder*="sk-" i]',
  'input[placeholder*="pk_" i]',
  'input[aria-label*="api key" i]',
  'input[aria-label*="secret key" i]',
  'input[aria-label*="token" i]',
  'textarea[name*="api_key" i]',
  'textarea[name*="secret" i]',
  'textarea[placeholder*="api key" i]',
  'textarea[placeholder*="token" i]',
];

export const KNOWN_PLATFORMS = [
  { domain: "platform.openai.com", service: "openai" },
  { domain: "console.anthropic.com", service: "anthropic" },
  { domain: "dashboard.stripe.com", service: "stripe" },
  { domain: "console.aws.amazon.com", service: "aws" },
  { domain: "github.com", service: "github" },
  { domain: "vercel.com", service: "vercel" },
  { domain: "supabase.com", service: "supabase" },
  { domain: "console.firebase.google.com", service: "firebase" },
  { domain: "dashboard.clerk.com", service: "clerk" },
  { domain: "railway.app", service: "railway" },
  { domain: "console.cloud.google.com", service: "google_cloud" },
  { domain: "dash.cloudflare.com", service: "cloudflare" },
  { domain: "console.twilio.com", service: "twilio" },
  { domain: "app.sendgrid.com", service: "sendgrid" },
  { domain: "app.netlify.com", service: "netlify" },
  { domain: "cloud.digitalocean.com", service: "digitalocean" },
  { domain: "dashboard.heroku.com", service: "heroku" },
  { domain: "resend.com", service: "resend" },
  { domain: "console.neon.tech", service: "neon" },
  { domain: "app.planetscale.com", service: "planetscale" },
] as const;
