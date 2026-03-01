// ── Wallet State ──
export type WalletStatus = "uninitialized" | "locked" | "unlocked";

export interface WalletConfig {
  autoLockMinutes: number;
  tier: "free" | "pro";
  licenseKey: string | null;
  lastSynced: string | null;
  dashboardUrl: string;
  theme: "dark" | "light" | "system";
  clipboardClearSeconds: number;
  autoFillEnabled: boolean;
  keyCaptureEnabled: boolean;
  compactMode: boolean;
  autoSyncEnabled: boolean;
}

export interface EncryptedVault {
  version: number;
  salt: string;
  iv: string;
  tag: string;
  ciphertext: string;
  hmac: string;
}

export interface StoredData {
  lockbox_vault: EncryptedVault | null;
  lockbox_config: WalletConfig;
  lockbox_status: WalletStatus;
  lockbox_account: AccountInfo | null;
  lockbox_site_permissions: Record<string, boolean>;
}

// ── Account ──
export interface AccountInfo {
  email: string | null;
  name: string;
  walletId: string;
  createdAt: string;
  token?: string | null;
  dashboardConnected?: boolean;
}

// ── Vault & Keys (decrypted) ──
export interface Vault {
  id: string;
  name: string;
  description: string;
  icon: string;
  keys: ApiKey[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  vaultId: string;
  service: string;
  name: string;
  value: string;
  notes: string;
  expiresAt: string | null;
  favourite: boolean;
  lastAccessedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DecryptedWallet {
  vaults: Vault[];
  auditLog: AuditEntry[];
}

// ── Audit ──
export interface AuditEntry {
  id: string;
  action: "created" | "accessed" | "updated" | "deleted" | "copied" | "autofilled";
  keyId: string;
  keyName: string;
  service: string;
  vaultId: string;
  vaultName: string;
  site?: string;
  timestamp: string;
}

// ── Service Registry ──
export interface ServiceDefinition {
  name: string;
  icon: string;
  color: string;
  keyPrefixes: string[];
  dashboardUrls: string[];
  commonKeyNames: string[];
}

// ── Detected Fields (content script) ──
export interface DetectedField {
  element: HTMLInputElement | HTMLTextAreaElement;
  type: "input" | "textarea";
  confidence: "high" | "medium";
  fieldLabel: string;
}

// ── Messages between popup/background/content ──
export type MessageType =
  | "LOCKBOX_GET_STATUS"
  | "LOCKBOX_UNLOCK"
  | "LOCKBOX_LOCK"
  | "LOCKBOX_GET_KEYS"
  | "LOCKBOX_GET_ALL_KEYS"
  | "LOCKBOX_REVEAL_KEY"
  | "LOCKBOX_PASTE_KEY"
  | "LOCKBOX_COPY_TO_CLIPBOARD"
  | "LOCKBOX_SHOW_PICKER"
  | "LOCKBOX_KEY_CAPTURED"
  | "LOCKBOX_ACTIVITY"
  | "LOCKBOX_SYNC_STATUS"
  | "LOCKBOX_AUTH_TOKEN";

export interface LockboxMessage {
  type: MessageType;
  payload?: any;
}

// ── Popup Navigation ──
export type PopupPage =
  | "welcome"
  | "create-wallet"
  | "recovery-phrase"
  | "confirm-phrase"
  | "wallet-ready"
  | "import-wallet"
  | "lock-screen"
  | "home"
  | "add-key"
  | "quick-paste"
  | "import-env"
  | "key-detail"
  | "vault-list"
  | "settings"
  | "search"
  | "upgrade";

// ── Service icon map for inline use ──
export const SERVICE_COLORS: Record<string, string> = {
  openai: "#10a37f",
  anthropic: "#d4a27f",
  stripe: "#635bff",
  aws: "#ff9900",
  github: "#ffffff",
  google_cloud: "#4285f4",
  vercel: "#ffffff",
  supabase: "#3ecf8e",
  firebase: "#ffca28",
  clerk: "#6c47ff",
  railway: "#ffffff",
  cloudflare: "#f38020",
  twilio: "#f22f46",
  sendgrid: "#1a82e2",
  netlify: "#00c7b7",
  digitalocean: "#0080ff",
  heroku: "#430098",
  resend: "#ffffff",
  neon: "#00e599",
  planetscale: "#000000",
  default: "#6b7280",
};
