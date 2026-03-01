import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Palette,
  Zap,
  User,
  AlertTriangle,
  Timer,
  Clipboard,
  Sun,
  Moon,
  Monitor,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Crown,
  Loader2,
  Link2,
  Check,
  Copy,
  X,
} from "lucide-react";
import { useWalletContext } from "../App";
import { AUTO_LOCK_OPTIONS, CLIPBOARD_CLEAR_OPTIONS, DASHBOARD_URL } from "@/lib/constants";
import { getAccount, setAccount, clearAllData } from "@/lib/storage";

// ── Toggle switch ──
function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="flex-shrink-0"
    >
      {enabled ? (
        <ToggleRight className="w-6 h-6 text-lockbox-accent" />
      ) : (
        <ToggleLeft className="w-6 h-6 text-lockbox-text-muted" />
      )}
    </button>
  );
}

// ── Settings row ──
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-lockbox-text">{label}</p>
        {description && (
          <p className="text-[10px] text-lockbox-text-muted mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ── Select ──
function SettingSelect({
  value,
  options,
  onChange,
}: {
  value: number;
  options: { label: string; value: number }[];
  onChange: (val: number) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="bg-lockbox-surface border border-lockbox-border rounded-md px-2 py-1 text-xs text-lockbox-text focus:border-lockbox-accent transition-colors appearance-none cursor-pointer min-w-[110px]"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ── Section ──
function SettingsSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        {icon}
        <h2 className="text-xs font-semibold text-lockbox-text-secondary uppercase tracking-wider">
          {title}
        </h2>
      </div>
      <div className="bg-lockbox-surface border border-lockbox-border rounded-lg px-3.5 divide-y divide-lockbox-border">
        {children}
      </div>
    </div>
  );
}

// ── Confirm dialog for delete wallet ──
function DeleteConfirmDialog({
  open,
  onConfirm,
  onCancel,
  deleting,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <motion.div
        className="relative bg-lockbox-surface border border-lockbox-border rounded-xl p-5 w-full max-w-sm shadow-xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-lockbox-danger" />
          <h3 className="text-sm font-semibold text-lockbox-text">Delete Wallet</h3>
        </div>
        <p className="text-xs text-lockbox-text-secondary mb-2">
          This will permanently delete your wallet, all vaults, and all stored keys from this device.
        </p>
        <p className="text-xs text-lockbox-danger font-medium mb-5">
          This action cannot be undone. Make sure you have your recovery phrase before proceeding.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-lockbox-border text-xs font-medium text-lockbox-text-secondary hover:bg-lockbox-border transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-lockbox-danger text-white text-xs font-semibold hover:bg-lockbox-danger/90 transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Delete Everything
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Dashboard Connection ──
function DashboardConnection() {
  const { config, updateConfig } = useWalletContext();
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const dashboardUrl = config.dashboardUrl || DASHBOARD_URL;

  // Check if already connected on mount
  useState(() => {
    getAccount().then((info) => {
      if (info?.token && info?.dashboardConnected) {
        setStatus("connected");
        setConnectedEmail(info.email);
      }
    });
  });

  const handleConnect = async () => {
    const trimmed = token.trim();
    if (!trimmed) return;

    setStatus("connecting");
    setErrorMsg("");

    try {
      const res = await fetch(`${dashboardUrl}/api/auth/extension-verify`, {
        headers: { Authorization: `Bearer ${trimmed}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Invalid token");
      }

      const data = await res.json();
      if (!data.valid) throw new Error("Token is not valid");

      // Save token to account
      const account = await getAccount();
      await setAccount({
        email: data.email ?? account?.email ?? null,
        name: account?.name ?? "",
        walletId: account?.walletId ?? "",
        createdAt: account?.createdAt ?? new Date().toISOString(),
        token: trimmed,
        dashboardConnected: true,
      });

      setStatus("connected");
      setConnectedEmail(data.email);
      setToken("");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Connection failed");
    }
  };

  const handleDisconnect = async () => {
    const account = await getAccount();
    if (account) {
      await setAccount({
        ...account,
        token: null,
        dashboardConnected: false,
      });
    }
    setStatus("idle");
    setConnectedEmail(null);
    setToken("");
  };

  return (
    <SettingsSection
      title="Dashboard Connection"
      icon={<Link2 className="w-3.5 h-3.5 text-lockbox-accent" />}
    >
      {status === "connected" ? (
        <div className="py-2.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-lockbox-accent" />
            <span className="text-xs font-medium text-lockbox-accent">Connected</span>
          </div>
          {connectedEmail && (
            <p className="text-[10px] text-lockbox-text-muted mb-2">
              Syncing with {connectedEmail}
            </p>
          )}
          <p className="text-[10px] text-lockbox-text-muted mb-2">{dashboardUrl}</p>
          <button
            onClick={handleDisconnect}
            className="text-[10px] font-medium text-lockbox-danger hover:underline"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="py-2.5">
          <p className="text-[10px] text-lockbox-text-muted mb-2">
            Paste your connection token from the dashboard to enable sync.
          </p>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              placeholder="Paste token here..."
              className="flex-1 bg-lockbox-bg border border-lockbox-border rounded-md px-2 py-1.5 text-[10px] font-mono text-lockbox-text placeholder:text-lockbox-text-muted focus:border-lockbox-accent transition-colors min-w-0"
            />
            <button
              onClick={handleConnect}
              disabled={!token.trim() || status === "connecting"}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-lockbox-accent text-lockbox-bg text-[10px] font-semibold hover:bg-lockbox-accent-hover transition-colors disabled:opacity-50"
            >
              {status === "connecting" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Link2 size={12} />
              )}
              Connect
            </button>
          </div>
          {status === "error" && (
            <p className="text-[10px] text-lockbox-danger mt-1.5">{errorMsg}</p>
          )}
          <a
            href={`${dashboardUrl}/dashboard/extension-setup`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[10px] text-lockbox-accent hover:underline mt-2"
          >
            Get a token from the dashboard &rarr;
          </a>

          {/* Advanced: custom dashboard URL */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="block text-[10px] text-lockbox-text-muted hover:text-lockbox-text-secondary mt-2 transition-colors"
          >
            {showAdvanced ? "Hide advanced" : "Advanced"}
          </button>
          {showAdvanced && (
            <div className="mt-2">
              <label className="text-[10px] text-lockbox-text-muted block mb-1">Dashboard URL</label>
              <input
                type="text"
                value={dashboardUrl}
                onChange={(e) => updateConfig({ dashboardUrl: e.target.value })}
                placeholder="https://dashboard.yourlockbox.dev"
                className="w-full bg-lockbox-bg border border-lockbox-border rounded-md px-2 py-1.5 text-[10px] font-mono text-lockbox-text placeholder:text-lockbox-text-muted focus:border-lockbox-accent transition-colors"
              />
              <p className="text-[9px] text-lockbox-text-muted mt-1">
                For local dev: http://localhost:3000
              </p>
            </div>
          )}
        </div>
      )}
    </SettingsSection>
  );
}

// ── Main Settings ──
export function Settings() {
  const { navigate, config, updateConfig } = useWalletContext();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [accountInfo, setAccountInfo] = useState<{
    email: string | null;
    walletId: string;
  } | null>(null);

  // Load account info on mount
  useState(() => {
    getAccount().then((info) => {
      if (info) setAccountInfo({ email: info.email, walletId: info.walletId });
    });
  });

  const handleDeleteWallet = async () => {
    setDeleting(true);
    try {
      await clearAllData();
      // Reload the popup to go back to welcome screen
      window.location.reload();
    } catch {
      setDeleting(false);
    }
  };

  const themeOptions: { value: "dark" | "light" | "system"; label: string; icon: React.ReactNode }[] = [
    { value: "dark", label: "Dark", icon: <Moon className="w-3 h-3" /> },
    { value: "light", label: "Light", icon: <Sun className="w-3 h-3" /> },
    { value: "system", label: "System", icon: <Monitor className="w-3 h-3" /> },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <motion.div
        className="flex items-center gap-3 px-4 py-3 border-b border-lockbox-border"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => navigate("home")}
          className="p-1.5 rounded-lg hover:bg-lockbox-surface transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} className="text-lockbox-text-secondary" />
        </button>
        <h1 className="text-lg font-semibold text-lockbox-text">Settings</h1>
      </motion.div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
        {/* Security */}
        <SettingsSection
          title="Security"
          icon={<Shield className="w-3.5 h-3.5 text-lockbox-accent" />}
        >
          <SettingRow
            label="Auto-lock timer"
            description="Lock wallet after inactivity"
          >
            <SettingSelect
              value={config.autoLockMinutes}
              options={AUTO_LOCK_OPTIONS}
              onChange={(val) => updateConfig({ autoLockMinutes: val })}
            />
          </SettingRow>
          <SettingRow
            label="Clipboard clear"
            description="Clear clipboard after copying"
          >
            <SettingSelect
              value={config.clipboardClearSeconds}
              options={CLIPBOARD_CLEAR_OPTIONS}
              onChange={(val) => updateConfig({ clipboardClearSeconds: val })}
            />
          </SettingRow>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection
          title="Appearance"
          icon={<Palette className="w-3.5 h-3.5 text-lockbox-accent" />}
        >
          <SettingRow label="Theme">
            <div className="flex items-center gap-1">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateConfig({ theme: opt.value })}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                    config.theme === opt.value
                      ? "bg-lockbox-accent/15 text-lockbox-accent border border-lockbox-accent/30"
                      : "text-lockbox-text-muted hover:text-lockbox-text border border-transparent"
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </SettingRow>
        </SettingsSection>

        {/* Auto-fill */}
        <SettingsSection
          title="Auto-fill"
          icon={<Zap className="w-3.5 h-3.5 text-lockbox-accent" />}
        >
          <SettingRow
            label="Auto-detect fields"
            description="Detect API key fields on web pages"
          >
            <Toggle
              enabled={config.autoFillEnabled}
              onChange={(val) => updateConfig({ autoFillEnabled: val })}
            />
          </SettingRow>
          <SettingRow
            label="Key capture"
            description="Offer to save detected API keys"
          >
            <Toggle
              enabled={config.keyCaptureEnabled}
              onChange={(val) => updateConfig({ keyCaptureEnabled: val })}
            />
          </SettingRow>
        </SettingsSection>

        {/* Account */}
        <SettingsSection
          title="Account"
          icon={<User className="w-3.5 h-3.5 text-lockbox-accent" />}
        >
          <SettingRow label="Email">
            <span className="text-xs text-lockbox-text-muted">
              {accountInfo?.email ?? "Not set"}
            </span>
          </SettingRow>
          <SettingRow label="Tier">
            <span className={`flex items-center gap-1 text-xs font-medium ${
              config.tier === "pro" ? "text-lockbox-pro" : "text-lockbox-text-muted"
            }`}>
              {config.tier === "pro" && <Crown className="w-3 h-3" />}
              {config.tier === "pro" ? "Pro" : "Free"}
            </span>
          </SettingRow>
          <SettingRow label="Wallet ID">
            <span className="text-[10px] font-mono text-lockbox-text-muted truncate max-w-[140px] block">
              {accountInfo?.walletId ?? "Unknown"}
            </span>
          </SettingRow>
        </SettingsSection>

        {/* Dashboard Connection */}
        <DashboardConnection />

        {/* Danger zone */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2 px-1">
            <AlertTriangle className="w-3.5 h-3.5 text-lockbox-danger" />
            <h2 className="text-xs font-semibold text-lockbox-danger uppercase tracking-wider">
              Danger Zone
            </h2>
          </div>
          <div className="bg-lockbox-danger/5 border border-lockbox-danger/20 rounded-lg px-3.5 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-lockbox-text">Delete Wallet</p>
                <p className="text-[10px] text-lockbox-text-muted mt-0.5">
                  Remove all data from this device
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-lockbox-danger/10 text-lockbox-danger text-xs font-medium hover:bg-lockbox-danger/20 border border-lockbox-danger/20 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        <DeleteConfirmDialog
          open={showDeleteConfirm}
          onConfirm={handleDeleteWallet}
          onCancel={() => setShowDeleteConfirm(false)}
          deleting={deleting}
        />
      </AnimatePresence>
    </div>
  );
}
