import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Upload, Loader2, Check } from "lucide-react";
import { getEncryptedVault, getRecoveryVault, getAccount, getConfig, setEncryptedVault, setRecoveryVault, setStatus, setAccount, setConfig } from "@/lib/storage";
import { SettingsSection } from "./primitives";

export function ExportImportSection() {
  const [exportStatus, setExportStatus] = useState<"idle" | "exporting" | "done">("idle");
  const [importStatus, setImportStatus] = useState<"idle" | "importing" | "done" | "error">("idle");
  const [importError, setImportError] = useState("");

  const handleExport = async () => {
    setExportStatus("exporting");
    try {
      const [vault, recoveryVault, account, config] = await Promise.all([
        getEncryptedVault(),
        getRecoveryVault(),
        getAccount(),
        getConfig(),
      ]);

      if (!vault) {
        setExportStatus("idle");
        return;
      }

      const backup = {
        format: "lockbox-backup",
        version: 1,
        exportedAt: new Date().toISOString(),
        walletName: account?.name ?? "My Wallet",
        vault,
        recoveryVault: recoveryVault ?? null,
        tier: config.tier ?? "free",
        licenseKey: config.licenseKey ?? null,
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lockbox-wallet-${new Date().toISOString().slice(0, 10)}.lockbox`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportStatus("done");
      setTimeout(() => setExportStatus("idle"), 3000);
    } catch {
      setExportStatus("idle");
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".lockbox,.json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setImportStatus("importing");
      setImportError("");

      try {
        const text = await file.text();
        const backup = JSON.parse(text);

        if (backup.format !== "lockbox-backup" || !backup.vault) {
          throw new Error("Invalid backup file. Please select a valid .lockbox file.");
        }

        if (!backup.vault.ciphertext || !backup.vault.salt || !backup.vault.iv) {
          throw new Error("Backup file is corrupted or incomplete.");
        }

        await setEncryptedVault(backup.vault);

        if (backup.recoveryVault) {
          await setRecoveryVault(backup.recoveryVault);
        }

        await setStatus("locked");

        if (backup.tier || backup.licenseKey) {
          const currentConfig = await getConfig();
          await setConfig({
            ...currentConfig,
            tier: backup.tier ?? currentConfig.tier,
            licenseKey: backup.licenseKey ?? currentConfig.licenseKey,
          });
        }

        await setAccount({
          email: null,
          name: backup.walletName ?? "Imported Wallet",
          walletId: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        });

        setImportStatus("done");
        setTimeout(() => window.location.reload(), 1500);
      } catch (err: any) {
        setImportStatus("error");
        setImportError(err.message || "Failed to import wallet");
      }
    };
    input.click();
  };

  return (
    <SettingsSection
      title="Wallet Transfer"
      icon={<Download className="w-3.5 h-3.5 text-lockbox-accent" />}
    >
      {/* Export */}
      <div className="py-2.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-lockbox-text">Export Wallet</p>
            <p className="text-[10px] text-lockbox-text-muted mt-0.5">
              Download encrypted backup (.lockbox file)
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exportStatus === "exporting"}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-lockbox-accent/10 text-lockbox-accent text-xs font-medium hover:bg-lockbox-accent/15 border border-lockbox-accent/20 transition-colors"
          >
            {exportStatus === "exporting" ? (
              <Loader2 size={12} className="animate-spin" />
            ) : exportStatus === "done" ? (
              <Check size={12} />
            ) : (
              <Download size={12} />
            )}
            {exportStatus === "done" ? "Saved!" : "Export"}
          </button>
        </div>
        <p className="text-[9px] text-lockbox-text-muted mt-1.5 leading-relaxed">
          Your keys stay encrypted with your master password. Import this file on another machine to access your wallet.
        </p>
      </div>

      {/* Import */}
      <div className="py-2.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-lockbox-text">Import Wallet</p>
            <p className="text-[10px] text-lockbox-text-muted mt-0.5">
              Restore from a .lockbox backup file
            </p>
          </div>
          <button
            onClick={handleImport}
            disabled={importStatus === "importing"}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-lockbox-surface text-lockbox-text-secondary text-xs font-medium hover:bg-lockbox-border border border-lockbox-border transition-colors"
          >
            {importStatus === "importing" ? (
              <Loader2 size={12} className="animate-spin" />
            ) : importStatus === "done" ? (
              <Check size={12} className="text-lockbox-accent" />
            ) : (
              <Upload size={12} />
            )}
            {importStatus === "done" ? "Imported!" : "Import"}
          </button>
        </div>
        {importStatus === "error" && importError && (
          <motion.p
            className="text-[10px] text-lockbox-danger mt-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {importError}
          </motion.p>
        )}
        {importStatus === "done" && (
          <motion.p
            className="text-[10px] text-lockbox-accent mt-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Wallet imported! Reloading...
          </motion.p>
        )}
      </div>
    </SettingsSection>
  );
}
