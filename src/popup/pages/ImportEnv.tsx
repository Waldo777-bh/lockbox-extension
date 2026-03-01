import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Upload,
  Loader2,
  Check,
  Square,
  CheckSquare,
  Sparkles,
} from "lucide-react";
import { useWalletContext } from "../App";
import { parseEnvFile } from "@/services/keyDetector";
import { getServiceName, getServiceColor } from "@/services/serviceRegistry";

interface ParsedEntry {
  name: string;
  value: string;
  service: string;
  selected: boolean;
}

export function ImportEnv() {
  const { navigate, wallet, addKey, error, setError } = useWalletContext();

  const [envContent, setEnvContent] = useState("");
  const [parsedEntries, setParsedEntries] = useState<ParsedEntry[]>([]);
  const [vaultId, setVaultId] = useState(wallet?.vaults[0]?.id ?? "");
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParse = () => {
    if (!envContent.trim()) return;
    const results = parseEnvFile(envContent);
    setParsedEntries(results.map((r) => ({ ...r, selected: true })));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        setEnvContent(text);
        const results = parseEnvFile(text);
        setParsedEntries(results.map((r) => ({ ...r, selected: true })));
      }
    };
    reader.readAsText(file);
  };

  const toggleEntry = (index: number) => {
    setParsedEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, selected: !entry.selected } : entry
      )
    );
  };

  const toggleAll = () => {
    const allSelected = parsedEntries.every((e) => e.selected);
    setParsedEntries((prev) =>
      prev.map((entry) => ({ ...entry, selected: !allSelected }))
    );
  };

  const selectedCount = parsedEntries.filter((e) => e.selected).length;

  const handleImport = async () => {
    const toImport = parsedEntries.filter((e) => e.selected);
    if (toImport.length === 0 || !vaultId) return;

    setImporting(true);
    setError(null);

    try {
      for (const entry of toImport) {
        await addKey(vaultId, {
          service: entry.service,
          name: entry.name,
          value: entry.value,
          notes: "Imported from .env file",
          expiresAt: null,
          favourite: false,
        });
      }
      setImported(true);
      setTimeout(() => navigate("home"), 1200);
    } catch (err: any) {
      setError(err.message || "Failed to import keys");
    } finally {
      setImporting(false);
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
          <FileText className="w-4 h-4 text-lockbox-accent" />
          <h1 className="text-lg font-semibold text-lockbox-text">Import from .env</h1>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 flex flex-col gap-4">
        {/* Success state */}
        {imported ? (
          <motion.div
            className="flex-1 flex flex-col items-center justify-center text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-14 h-14 rounded-full bg-lockbox-accent/15 flex items-center justify-center mb-4">
              <Check className="w-7 h-7 text-lockbox-accent" />
            </div>
            <p className="text-sm font-medium text-lockbox-text">
              {selectedCount} key{selectedCount !== 1 ? "s" : ""} imported!
            </p>
            <p className="text-xs text-lockbox-text-muted mt-1">Redirecting...</p>
          </motion.div>
        ) : (
          <>
            {/* File upload / textarea */}
            {parsedEntries.length === 0 && (
              <>
                <div>
                  <label className="block text-xs font-medium text-lockbox-text-secondary mb-1.5">
                    Paste .env content
                  </label>
                  <textarea
                    value={envContent}
                    onChange={(e) => setEnvContent(e.target.value)}
                    placeholder={"OPENAI_API_KEY=sk-...\nSTRIPE_SECRET_KEY=sk_test_...\nDATABASE_URL=postgres://..."}
                    rows={6}
                    autoFocus
                    className="w-full bg-lockbox-surface border border-lockbox-border rounded-lg px-3.5 py-2.5 text-xs text-lockbox-text placeholder:text-lockbox-text-muted focus:border-lockbox-accent transition-colors font-mono resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-lockbox-border" />
                  <span className="text-[10px] text-lockbox-text-muted">or</span>
                  <div className="flex-1 h-px bg-lockbox-border" />
                </div>

                {/* File picker */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-lockbox-border rounded-lg text-xs font-medium text-lockbox-text-secondary hover:border-lockbox-accent/50 hover:text-lockbox-accent transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload .env file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".env,.env.local,.env.development,.env.production,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Parse button */}
                <button
                  onClick={handleParse}
                  disabled={!envContent.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm
                             transition-all duration-200 cursor-pointer
                             disabled:opacity-40 disabled:cursor-not-allowed
                             hover:shadow-lg hover:shadow-lockbox-accent/20 active:scale-[0.98]"
                  style={{ backgroundColor: "#00d87a", color: "#0f0f14" }}
                >
                  <Sparkles size={16} />
                  Parse & Detect
                </button>
              </>
            )}

            {/* Preview table */}
            {parsedEntries.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-lockbox-text-secondary">
                    {parsedEntries.length} key{parsedEntries.length !== 1 ? "s" : ""} found
                  </p>
                  <button
                    onClick={toggleAll}
                    className="text-xs text-lockbox-accent hover:underline"
                  >
                    {parsedEntries.every((e) => e.selected) ? "Deselect all" : "Select all"}
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  {parsedEntries.map((entry, index) => {
                    const color = getServiceColor(entry.service);
                    const svcName = getServiceName(entry.service);
                    return (
                      <motion.button
                        key={index}
                        type="button"
                        onClick={() => toggleEntry(index)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors text-left ${
                          entry.selected
                            ? "bg-lockbox-accent/5 border-lockbox-accent/30"
                            : "bg-lockbox-surface border-lockbox-border opacity-60"
                        }`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        {entry.selected ? (
                          <CheckSquare className="w-4 h-4 text-lockbox-accent flex-shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-lockbox-text-muted flex-shrink-0" />
                        )}

                        <div
                          className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          {svcName[0]?.toUpperCase() ?? "?"}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-lockbox-text truncate">
                            {entry.name}
                          </p>
                          <p className="text-[10px] text-lockbox-text-muted truncate">
                            {svcName} &middot; {entry.value.slice(0, 12)}...
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Vault selector */}
                <div>
                  <label className="block text-xs font-medium text-lockbox-text-secondary mb-1.5">
                    Import to vault
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

                {/* Import button */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setParsedEntries([]);
                      setEnvContent("");
                    }}
                    className="px-4 py-2.5 rounded-lg border border-lockbox-border text-xs font-medium text-lockbox-text-secondary hover:bg-lockbox-surface transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={selectedCount === 0 || importing}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm
                               transition-all duration-200 cursor-pointer
                               disabled:opacity-40 disabled:cursor-not-allowed
                               hover:shadow-lg hover:shadow-lockbox-accent/20 active:scale-[0.98]"
                    style={{ backgroundColor: "#00d87a", color: "#0f0f14" }}
                  >
                    {importing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        Import {selectedCount} Key{selectedCount !== 1 ? "s" : ""}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
