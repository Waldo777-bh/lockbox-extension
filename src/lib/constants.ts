export const DASHBOARD_URL = "https://dashboard.yourlockbox.dev";
export const API_BASE_URL = `${DASHBOARD_URL}/api`;
export const SIGN_IN_URL = `${DASHBOARD_URL}/sign-in`;
export const EXTENSION_AUTH_URL = `${DASHBOARD_URL}/extension-auth`;

export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const RECENT_KEYS_COUNT = 5;
export const REVEAL_DURATION_MS = 5000; // 5 seconds
export const COPY_FEEDBACK_MS = 2000; // 2 seconds

export const STORAGE_KEYS = {
  AUTH_TOKEN: "lockbox_auth_token",
  USER_DATA: "lockbox_user_data",
  CACHE_DATA: "lockbox_cache_data",
  RECENT_KEYS: "lockbox_recent_keys",
} as const;

export const API_KEY_FIELD_SELECTORS = [
  'input[name*="api_key" i]',
  'input[name*="apikey" i]',
  'input[name*="api-key" i]',
  'input[name*="secret_key" i]',
  'input[name*="secret-key" i]',
  'input[name*="secretkey" i]',
  'input[name*="access_token" i]',
  'input[name*="access-token" i]',
  'input[name*="accesstoken" i]',
  'input[name*="auth_token" i]',
  'input[name*="token" i]',
  'input[id*="api_key" i]',
  'input[id*="apikey" i]',
  'input[id*="api-key" i]',
  'input[id*="secret_key" i]',
  'input[id*="secret-key" i]',
  'input[id*="access_token" i]',
  'input[id*="auth_token" i]',
  'input[placeholder*="api key" i]',
  'input[placeholder*="api_key" i]',
  'input[placeholder*="secret key" i]',
  'input[placeholder*="access token" i]',
  'input[placeholder*="sk-" i]',
  'input[placeholder*="pk_" i]',
  'input[aria-label*="api key" i]',
  'input[aria-label*="secret key" i]',
  'input[aria-label*="access token" i]',
];

export const SUPPORTED_SITES: Record<string, string> = {
  "platform.openai.com": "OpenAI",
  "dashboard.stripe.com": "Stripe",
  "console.aws.amazon.com": "AWS",
  "github.com": "GitHub",
  "console.anthropic.com": "Anthropic",
  "dashboard.clerk.com": "Clerk",
};
