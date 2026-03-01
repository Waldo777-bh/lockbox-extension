import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ChevronDown,
  Loader2,
  Save,
} from "lucide-react";
import { useWalletContext } from "../App";
import { getServiceOptions, SERVICES } from "@/services/serviceRegistry";

export function AddKey() {
  const { navigate, wallet, addKey, error, setError, loading } = useWalletContext();

  const [service, setService] = useState("");
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [showValue, setShowValue] = useState(false);
  const [vaultId, setVaultId] = useState(wallet?.vaults[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [serviceQuery, setServiceQuery] = useState("");

  const serviceOptions = useMemo(() => getServiceOptions(), []);

  const filteredServiceOptions = useMemo(() => {
    if (!serviceQuery.trim()) return serviceOptions;
    const lower = serviceQuery.toLowerCase();
    return serviceOptions.filter((opt) =>
      opt.label.toLowerCase().includes(lower)
    );
  }, [serviceOptions, serviceQuery]);

  // Auto-suggest key name when service is selected
  const handleServiceSelect = (svcKey: string) => {
    setService(svcKey);
    setServiceDropdownOpen(false);
    setServiceQuery("");
    // Auto-suggest a name based on the service
    const svc = SERVICES[svcKey];
    if (svc && !name) {
      setName(svc.commonKeyNames[0] ?? "API_KEY");
    }
  };

  const selectedServiceLabel = serviceOptions.find((o) => o.value === service)?.label ?? "";

  const canSave = service.trim() && name.trim() && value.trim() && vaultId && !saving;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setError(null);
    try {
      await addKey(vaultId, {
        service: service.trim(),
        name: name.trim(),
        value: value.trim(),
        notes: notes.trim(),
        expiresAt: expiresAt || null,
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
        <h1 className="text-lg font-semibold text-lockbox-text">Add Key</h1>
      </motion.div>

      {/* Form */}
      <form
        onSubmit={handleSave}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 flex flex-col gap-4"
      >
        {/* Service selector */}
        <div className="relative">
          <label className="block text-xs font-medium text-lockbox-text-secondary mb-1.5">
            Service
          </label>
          <button
            type="button"
            onClick={() => setServiceDropdownOpen(!serviceDropdownOpen)}
            className="w-full flex items-center justify-between bg-lockbox-surface border border-lockbox-border rounded-lg px-3.5 py-2.5 text-sm text-lockbox-text focus:border-lockbox-accent transition-colors"
          >
            <span className={selectedServiceLabel ? "text-lockbox-text" : "text-lockbox-text-muted"}>
              {selectedServiceLabel || "Select a service..."}
            </span>
            <ChevronDown className="w-4 h-4 text-lockbox-text-muted" />
          </button>

          {serviceDropdownOpen && (
            <motion.div
              className="absolute z-50 mt-1 w-full bg-lockbox-surface border border-lockbox-border rounded-lg shadow-xl overflow-hidden"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="p-2">
                <input
                  type="text"
                  value={serviceQuery}
                  onChange={(e) => setServiceQuery(e.target.value)}
                  placeholder="Search services..."
                  className="w-full bg-lockbox-bg border border-lockbox-border rounded-md px-2.5 py-1.5 text-xs text-lockbox-text placeholder:text-lockbox-text-muted focus:border-lockbox-accent transition-colors"
                  autoFocus
                />
              </div>
              <div className="max-h-40 overflow-y-auto scrollbar-thin">
                {filteredServiceOptions.map((opt) => {
                  const svc = SERVICES[opt.value];
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => handleServiceSelect(opt.value)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-lockbox-border transition-colors ${
                        service === opt.value ? "bg-lockbox-accent/10 text-lockbox-accent" : "text-lockbox-text"
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{
                          backgroundColor: `${svc?.color ?? "#6b7280"}20`,
                          color: svc?.color ?? "#6b7280",
                        }}
                      >
                        {opt.label[0]}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
                {filteredServiceOptions.length === 0 && (
                  <p className="px-3 py-2 text-xs text-lockbox-text-muted">No services found</p>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Key name */}
        <div>
          <label className="block text-xs font-medium text-lockbox-text-secondary mb-1.5">
            Key Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., API_KEY, SECRET_KEY"
            className="w-full bg-lockbox-surface border border-lockbox-border rounded-lg px-3.5 py-2.5 text-sm text-lockbox-text placeholder:text-lockbox-text-muted focus:border-lockbox-accent transition-colors"
          />
        </div>

        {/* Key value */}
        <div>
          <label className="block text-xs font-medium text-lockbox-text-secondary mb-1.5">
            Key Value
          </label>
          <div className="relative">
            <input
              type={showValue ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-lockbox-surface border border-lockbox-border rounded-lg px-3.5 py-2.5 pr-10 text-sm text-lockbox-text placeholder:text-lockbox-text-muted focus:border-lockbox-accent transition-colors font-mono"
            />
            <button
              type="button"
              onClick={() => setShowValue(!showValue)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-lockbox-text-muted hover:text-lockbox-text-secondary transition-colors cursor-pointer"
            >
              {showValue ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

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

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-lockbox-text-secondary mb-1.5">
            Notes <span className="text-lockbox-text-muted">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this key..."
            rows={2}
            className="w-full bg-lockbox-surface border border-lockbox-border rounded-lg px-3.5 py-2.5 text-sm text-lockbox-text placeholder:text-lockbox-text-muted focus:border-lockbox-accent transition-colors resize-none"
          />
        </div>

        {/* Expiry date */}
        <div>
          <label className="block text-xs font-medium text-lockbox-text-secondary mb-1.5">
            Expiry Date <span className="text-lockbox-text-muted">(optional)</span>
          </label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full bg-lockbox-surface border border-lockbox-border rounded-lg px-3.5 py-2.5 text-sm text-lockbox-text focus:border-lockbox-accent transition-colors"
          />
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
            type="submit"
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
      </form>
    </div>
  );
}
