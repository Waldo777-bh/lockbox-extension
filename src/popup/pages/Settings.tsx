import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Palette,
  Zap,
  User,
  AlertTriangle,
  Crown,
  Sun,
  Moon,
  Monitor,
  Trash2,
} from "lucide-react";
import { useWalletContext } from "../App";
import { AUTO_LOCK_OPTIONS, CLIPBOARD_CLEAR_OPTIONS } from "@/lib/constants";
import { getAccount, clearAllData } from "@/lib/storage";
import { resetSync } from "@/sync/api";

// Sub-components extracted for maintainability (E1)
import { Toggle, SettingRow, SettingSelect, SettingsSection } from "./settings/primitives";
import { ChangePasswordSection } from "./settings/ChangePasswordSection";
import { SetUpRecoverySection } from "./settings/SetUpRecoverySection";
import { ExportImportSection } from "./settings/ExportImportSection";
import { DashboardConnection } from "./settings/DashboardConnection";
import { DeleteConfirmDialog } from "./settings/DeleteConfirmDialog";

export function Settings() {
  const { navigate, config, updateConfig } = useWalletContext();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [accountInfo, setAccountInfo] = useState<{
    email: string | null;
    walletId: string;
  } | null>(null);

  useState(() => {
    getAccount().then((info) => {
      if (info) setAccountInfo({ email: info.email, walletId: info.walletId });
    });
  });

  const handleDeleteWallet = async () => {
    setDeleting(true);
    try {
      await resetSync().catch(() => {});
      await clearAllData();
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
          <ChangePasswordSection />
          <SetUpRecoverySection />
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

        {/* Plan & Account */}
        {config.tier === "pro" ? (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Crown className="w-3.5 h-3.5" style={{ color: "#FFD700" }} />
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#FFD700" }}>
                Pro Plan
              </h2>
            </div>
            <div
              className="rounded-lg px-3.5 py-3"
              style={{
                background: "linear-gradient(135deg, rgba(255,215,0,0.06), rgba(255,165,0,0.04))",
                border: "1px solid rgba(255,215,0,0.15)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.15))",
                    border: "1px solid rgba(255,215,0,0.2)",
                  }}
                >
                  <Crown className="w-4 h-4" style={{ color: "#FFD700" }} />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#FFD700" }}>
                    Pro Plan Active
                  </p>
                  <p className="text-[10px] text-lockbox-text-muted">
                    Unlimited vaults & API keys
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,215,0,0.1)" }}>
                <div className="flex-1">
                  <p className="text-[10px] text-lockbox-text-muted">Email</p>
                  <p className="text-xs text-lockbox-text truncate">{accountInfo?.email ?? "Not set"}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-lockbox-text-muted">Wallet ID</p>
                  <p className="text-[10px] font-mono text-lockbox-text-secondary truncate">
                    {accountInfo?.walletId ?? "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
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
              <button
                onClick={() => navigate("upgrade")}
                className="flex items-center gap-1 text-xs font-medium text-lockbox-accent hover:underline"
              >
                Free — Upgrade →
              </button>
            </SettingRow>
            <SettingRow label="Wallet ID">
              <span className="text-[10px] font-mono text-lockbox-text-muted truncate max-w-[140px] block">
                {accountInfo?.walletId ?? "Unknown"}
              </span>
            </SettingRow>
          </SettingsSection>
        )}

        {/* Export / Import Wallet */}
        <ExportImportSection />

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
