import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ClipboardPaste,
  Loader2,
  Save,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useWalletContext } from "../App";
import { detectKeyFromValue } from "@/services/keyDetector";
import { getServiceName, getServiceColor, getServiceOptions, SERVICES } from "@/services/serviceRegistry";

export function QuickPaste() {
  const { navigate, wallet, addKey, error, setError } = useWalletContext();

  const [pastedValue, setPastedValue] = useState("");
  const [detectedService, setDetectedService] = useState("");
  const [detectedName, setDetectedName] = useState("");
  const [confidence, setConfidence] = useState<string | null>(null);
  const [vaultId, setVaultId] = useState(wallet?.vaults[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  // Service override dropdown
  const [editingService, setEditingService] = useState(false);

  // Auto-detect when value changes
  useEffect(() => {
    if (!pastedValue.trim()) {
      setDetectedService("");
      setDetectedName("");
      setConfidence(null);
      return;
    }

    const detected = detectKeyFromValue(pastedValue.trim());
    if (detected) {
      setDetectedService(detected.service);
      setDetectedName(detected.keyName);
      setConfidence(detected.confidence);
    } else {
      setDetectedService("unknown");
      setDetectedName("API_KEY");
      setConfidence(null);
    }
  }, [pastedValue]);

  const serviceName = detectedService ? getServiceName(detectedService) : "";
  const serviceColor = detectedService ? getServiceColor(detectedService) : "#6b7280";

  const canSave = pastedValue.trim() && detectedName.trim() && vaultId && !saving;

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    setError(null);
    try {
      await addKey(vaultId, {
        service: detectedService || "unknown",
        name: detectedName.trim(),
        value: pastedValue.trim(),
        notes: "",
        expiresAt: null,
        favourite: false,
      });
      navigate("home");
    } catch (err: any) {
      setError(err.message || "Failed to save key");
    } finally {
      setSaving(false);
    }
  };

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
        <div className="flex items-center gap-2">
          <ClipboardPaste className="w-4 h-4 text-lockbox-accent" />
          <h1 className="text-lg font-semibold text-lockbox-text">Quick Paste</h1>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 flex flex-col gap-4">
        {/* Paste area */}
        <div>
          <label className="block text-xs font-medium text-lockbox-text-secondary mb-1.5">
            Paste your API key
          </label>
          <textarea
            value={pastedValue}
            onChange={(e) => setPastedValue(e.target.value)}
            placeholder="Paste your API key here..."
            rows={4}
            autoFocus
            className="w-full bg-lockbox-surface border border-lockbox-border rounded-lg px-3.5 py-2.5 text-sm text-lockbox-text placeholder:text-lockbox-text-muted focus:border-lockbox-accent transition-colors font-mono resize-none"
          />
        </div>

        {/* Detection result */}
        {pastedValue.trim() && detectedService && (
          <motion.div
            className="bg-lockbox-surface border border-lockbox-border rounded-lg p-3.5"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-lockbox-accent" />
              <span className="text-xs font-medium text-lockbox-text-secondary">
                {confidence === "high" ? "Detected" : confidence === "medium" ? "Likely" : "Best guess"}
              </span>
            </div>

            {/* Detected service */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: `${serviceColor}20`, color: serviceColor }}
              >
                {serviceName[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-lockbox-text">{serviceName}</p>
                {confidence && (
                  <p className="text-[10px] text-lockbox-text-muted capitalize">
                    {confidence} confidence
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditingService(!editingService)}
                className="text-xs text-lockbox-accent hover:underline"
              >
                Change
              </button>
            </div>

            {/* Service override */}
            {editingService && (
              <motion.div
                className="mb-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.15 }}
              >
                <select
                  value={detectedService}
                  onChange={(e) => {
                    setDetectedService(e.target.value);
                    const svc = SERVICES[e.target.value];
                    if (svc) setDetectedName(svc.commonKeyNames[0] ?? "API_KEY");
                    setEditingService(false);
                  }}
                  className="w-full bg-lockbox-bg border border-lockbox-border rounded-md px-2.5 py-1.5 text-xs text-lockbox-text focus:border-lockbox-accent transition-colors"
                >
                  {getServiceOptions().map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                  <option value="unknown">Unknown / Other</option>
                </select>
              </motion.div>
            )}

            {/* Key name */}
            <div>
              <label className="block text-[10px] font-medium text-lockbox-text-muted mb-1">
                Key Name
              </label>
              <input
                type="text"
                value={detectedName}
                onChange={(e) => setDetectedName(e.target.value)}
                className="w-full bg-lockbox-bg border border-lockbox-border rounded-md px-2.5 py-1.5 text-xs text-lockbox-text focus:border-lockbox-accent transition-colors"
              />
            </div>
          </motion.div>
        )}

        {/* Vault selector */}
        <div>
          <label className="block text-xs font-medium text-lockbox-text-secondary mb-1.5">
            Vault
          </label>
          <select
            value={vaultId}
            onChange={(e) => setVaultId(e.target.value)}
            className="w-full bg-lockbox-surface border border-lockbox-border rounded-lg px-3.5 py-2.5 text-sm text-lockbox-text focus:border-lockbox-accent transition-colors appearance-none cursor-pointer"
          >
            {wallet?.vaults.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            className="bg-lockbox-danger/10 border border-lockbox-danger/30 rounded-lg px-3.5 py-2.5"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs text-lockbox-danger">{error}</p>
          </motion.div>
        )}

        {/* Save button */}
        <div className="mt-auto pt-4 pb-2">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm
                       transition-all duration-200 cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed
                       hover:shadow-lg hover:shadow-lockbox-accent/20 active:scale-[0.98]"
            style={{ backgroundColor: "#00d87a", color: "#0f0f14" }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Key
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
