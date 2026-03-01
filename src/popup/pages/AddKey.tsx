import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  Calendar,
  X,
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
  const [serviceInput, setServiceInput] = useState("");
  const serviceInputRef = useRef<HTMLInputElement>(null);

  const serviceOptions = useMemo(() => getServiceOptions(), []);

  const filteredServiceOptions = useMemo(() => {
    if (!serviceInput.trim()) return serviceOptions;
    const lower = serviceInput.toLowerCase();
    return serviceOptions.filter((opt) =>
      opt.label.toLowerCase().includes(lower) || opt.value.toLowerCase().includes(lower)
    );
  }, [serviceOptions, serviceInput]);

  // When user picks a preset from the dropdown
  const handleServiceSelect = (svcKey: string, label: string) => {
    setService(svcKey);
    setServiceInput(label);
    setServiceDropdownOpen(false);
    // Auto-suggest a name based on the service
    const svc = SERVICES[svcKey];
    if (svc && !name) {
      setName(svc.commonKeyNames[0] ?? "API_KEY");
    }
  };

  // When the input changes, keep service in sync with what the user typed
  const handleServiceInputChange = (val: string) => {
    setServiceInput(val);
    setServiceDropdownOpen(true);
    // Check if the typed value exactly matches a preset
    const match = serviceOptions.find((o) => o.label.toLowerCase() === val.toLowerCase());
    if (match) {
      setService(match.value);
    } else {
      // Use the raw text as a custom service
      setService(val.trim());
    }
  };

  // Close dropdown when clicking outside
  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!serviceDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(e.target as Node)) {
        setServiceDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [serviceDropdownOpen]);

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
        {/* Service selector — combobox: type freely or pick from suggestions */}
        <div className="relative" ref={serviceDropdownRef}>
          <label className="block text-xs font-medium text-lockbox-text-secondary mb-1.5">
            Service
          </label>
          <div className="relative">
            <input
              ref={serviceInputRef}
              type="text"
              value={serviceInput}
              onChange={(e) => handleServiceInputChange(e.target.value)}
              onFocus={() => setServiceDropdownOpen(true)}
              placeholder="Type or select a service..."
              className="w-full bg-lockbox-surface border border-lockbox-border rounded-lg px-3.5 py-2.5 pr-8 text-sm text-lockbox-text placeholder:text-lockbox-text-muted focus:border-lockbox-accent transition-colors"
            />
            <button
              type="button"
              onClick={() => setServiceDropdownOpen(!serviceDropdownOpen)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lockbox-text-muted hover:text-lockbox-text-secondary cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {serviceDropdownOpen && filteredServiceOptions.length > 0 && (
            <motion.div
              className="absolute z-50 mt-1 w-full bg-lockbox-surface border border-lockbox-border rounded-lg shadow-xl overflow-hidden"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="max-h-40 overflow-y-auto scrollbar-thin">
                {filteredServiceOptions.map((opt) => {
                  const svc = SERVICES[opt.value];
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => handleServiceSelect(opt.value, opt.label)}
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
        <DatePicker
          value={expiresAt}
          onChange={setExpiresAt}
        />

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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = value ? new Date(value + "T00:00:00") : null;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handleSelect = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const displayValue = selected
    ? `${selected.getDate()} ${MONTHS[selected.getMonth()]} ${selected.getFullYear()}`
    : "";

  const isToday = (day: number) => {
    return day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
  };

  const isSelected = (day: number) => {
    return selected && day === selected.getDate() && viewMonth === selected.getMonth() && viewYear === selected.getFullYear();
  };

  return (
    <div className="relative" ref={ref}>
      <label className="block text-xs font-medium text-lockbox-text-secondary mb-1.5">
        Expiry Date <span className="text-lockbox-text-muted">(optional)</span>
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-lockbox-surface border border-lockbox-border rounded-lg px-3.5 py-2.5 text-sm text-lockbox-text focus:border-lockbox-accent transition-colors"
      >
        <span className={displayValue ? "text-lockbox-text" : "text-lockbox-text-muted"}>
          {displayValue || "Select a date..."}
        </span>
        <div className="flex items-center gap-1.5">
          {value && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="text-lockbox-text-muted hover:text-lockbox-text-secondary cursor-pointer"
            >
              <X size={14} />
            </span>
          )}
          <Calendar size={16} className="text-lockbox-text-muted" />
        </div>
      </button>

      {open && (
        <motion.div
          className="absolute z-50 mt-1 w-full bg-lockbox-surface border border-lockbox-border rounded-lg shadow-xl p-3"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Month/year nav */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-lockbox-border transition-colors cursor-pointer">
              <ChevronLeft size={16} className="text-lockbox-text-secondary" />
            </button>
            <span className="text-xs font-semibold text-lockbox-text">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-lockbox-border transition-colors cursor-pointer">
              <ChevronRight size={16} className="text-lockbox-text-secondary" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-lockbox-text-muted py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => handleSelect(day)}
                  className={`h-7 w-full rounded text-xs font-medium transition-colors cursor-pointer
                    ${isSelected(day)
                      ? "bg-lockbox-accent text-[#0f0f14]"
                      : isToday(day)
                        ? "bg-lockbox-accent/15 text-lockbox-accent"
                        : "text-lockbox-text hover:bg-lockbox-border"
                    }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
