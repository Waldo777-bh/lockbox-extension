import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Settings,
  Crown,
  KeyRound,
  Star,
  Clock,
  Copy,
  Check,
  Plus,
  PenLine,
  ClipboardPaste,
  FileText,
  ChevronDown,
  ChevronRight,
  Vault,
  Box,
} from "lucide-react";
import { useWalletContext } from "../App";
import { getServiceName, getServiceColor } from "@/services/serviceRegistry";
import { countAllKeys, timeAgo, maskValue } from "@/lib/utils";
import type { ApiKey } from "@/types";

type FilterTab = "all" | "favourites" | "recent";

// ── Inline Header (wallet-aware) ──
function HomeHeader({ onLock, onSettings }: { onLock: () => void; onSettings: () => void }) {
  const { config, wallet } = useWalletContext();
  const isPro = config.tier === "pro";

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-lockbox-border">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-lockbox-accent/10 border border-lockbox-accent/20 flex items-center justify-center">
          <Lock className="w-3.5 h-3.5 text-lockbox-accent" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-semibold text-lockbox-text leading-tight">
              Lockbox
            </h1>
            {isPro && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none uppercase tracking-wider"
                style={{
                  background: "linear-gradient(135deg, rgba(255,215,0,0.18), rgba(255,165,0,0.18))",
                  color: "#FFD700",
                  border: "1px solid rgba(255,215,0,0.25)",
                }}
              >
                <Crown className="w-2.5 h-2.5" />
                PRO
              </span>
            )}
          </div>
          <p className="text-[10px] text-lockbox-text-muted leading-tight">
            {wallet?.vaults.length ?? 0} vault{(wallet?.vaults.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onSettings}
          className="p-1.5 rounded-md hover:bg-lockbox-surface text-lockbox-text-muted hover:text-lockbox-text transition-colors"
          title="Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onLock}
          className="p-1.5 rounded-md hover:bg-lockbox-surface text-lockbox-text-muted hover:text-lockbox-text transition-colors"
          title="Lock wallet"
        >
          <Lock className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Account summary bar ──
function AccountSummary() {
  const { wallet } = useWalletContext();
  const totalKeys = wallet ? countAllKeys(wallet.vaults) : 0;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-lockbox-border">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
        style={{ backgroundColor: "hsl(160, 65%, 55%)", color: "#0f0f14" }}
      >
        M
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-lockbox-text truncate">My Wallet</p>
        <p className="text-xs text-lockbox-text-muted">
          {totalKeys} key{totalKeys !== 1 ? "s" : ""} secured
        </p>
      </div>
    </div>
  );
}

// ── Inline search bar ──
function InlineSearchBar({ query, onChange }: { query: string; onChange: (q: string) => void }) {
  return (
    <div className="px-3 pt-2 pb-1">
      <div className="relative">
        <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-lockbox-text-muted pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search keys..."
          className="w-full pl-8 pr-3 py-2 bg-lockbox-surface border border-lockbox-border rounded-lg text-sm text-lockbox-text placeholder:text-lockbox-text-muted focus:outline-none focus:border-lockbox-accent/50 transition-all"
        />
      </div>
    </div>
  );
}

// ── Filter tabs ──
function FilterTabs({ active, onChange }: { active: FilterTab; onChange: (tab: FilterTab) => void }) {
  const tabs: { id: FilterTab; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "All", icon: <KeyRound className="w-3 h-3" /> },
    { id: "favourites", label: "Favourites", icon: <Star className="w-3 h-3" /> },
    { id: "recent", label: "Recent", icon: <Clock className="w-3 h-3" /> },
  ];

  return (
    <div className="flex items-center gap-1 px-3 pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            active === tab.id
              ? "bg-lockbox-accent/15 text-lockbox-accent"
              : "text-lockbox-text-muted hover:text-lockbox-text-secondary hover:bg-lockbox-surface"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ── Service group (keys grouped by service name) ──
function ServiceGroup({
  service,
  keys,
  onKeyClick,
  onCopyKey,
}: {
  service: string;
  keys: ApiKey[];
  onKeyClick: (key: ApiKey) => void;
  onCopyKey: (key: ApiKey) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const color = getServiceColor(service);
  const name = getServiceName(service);

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-lockbox-text-muted hover:text-lockbox-text-secondary transition-colors"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="uppercase tracking-wider">{name}</span>
        <span className="text-lockbox-text-muted/60 ml-auto">{keys.length}</span>
      </button>

      {expanded && (
        <div>
          {keys.map((key) => (
            <KeyItem
              key={key.id}
              apiKey={key}
              onClick={() => onKeyClick(key)}
              onCopy={() => onCopyKey(key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Individual key row ──
function KeyItem({
  apiKey,
  onClick,
  onCopy,
}: {
  apiKey: ApiKey;
  onClick: () => void;
  onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const color = getServiceColor(apiKey.service);
  const serviceName = getServiceName(apiKey.service);
  const masked = maskValue(apiKey.value);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="group flex items-center gap-2.5 px-3 py-2 hover:bg-lockbox-surface/80 cursor-pointer transition-colors"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick();
      }}
    >
      {/* Service icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {serviceName[0]?.toUpperCase() ?? "?"}
      </div>

      {/* Key info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-lockbox-text truncate">
            {apiKey.name}
          </span>
          {apiKey.favourite && (
            <Star className="w-3 h-3 text-lockbox-warning fill-lockbox-warning flex-shrink-0" />
          )}
        </div>
        <div className="text-xs text-lockbox-text-muted truncate font-mono">
          {masked}
        </div>
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-lockbox-border transition-all"
        title="Copy key"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-lockbox-accent" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-lockbox-text-muted" />
        )}
      </button>
    </div>
  );
}

// ── Upgrade banner / Pro status ──
function UpgradeBanner({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <button
      onClick={onUpgrade}
      className="mx-3 mb-2 flex items-center gap-2 px-3 py-2 bg-lockbox-pro/5 border border-lockbox-pro/20 rounded-lg hover:bg-lockbox-pro/10 transition-colors text-left"
    >
      <Crown className="w-4 h-4 text-lockbox-pro flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-lockbox-pro">Upgrade to Pro</p>
        <p className="text-[10px] text-lockbox-text-muted">Unlimited vaults, keys & more</p>
      </div>
    </button>
  );
}

function ProStatusBanner({ onManage }: { onManage: () => void }) {
  return (
    <button
      onClick={onManage}
      className="mx-3 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all"
      style={{
        background: "linear-gradient(135deg, rgba(255,215,0,0.06), rgba(255,165,0,0.04))",
        border: "1px solid rgba(255,215,0,0.15)",
      }}
    >
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.15))",
          border: "1px solid rgba(255,215,0,0.2)",
        }}
      >
        <Crown className="w-3 h-3" style={{ color: "#FFD700" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold" style={{ color: "#FFD700" }}>
          Pro Plan Active
        </p>
        <p className="text-[10px] text-lockbox-text-muted">Unlimited vaults & keys</p>
      </div>
      <span className="text-[10px] text-lockbox-text-muted">Manage →</span>
    </button>
  );
}

// ── Empty state ──
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in">
      <div className="w-14 h-14 rounded-xl bg-lockbox-surface border border-lockbox-border flex items-center justify-center mb-4">
        <KeyRound className="w-6 h-6 text-lockbox-text-muted" />
      </div>
      <p className="text-sm font-medium text-lockbox-text-secondary mb-1">No keys yet</p>
      <p className="text-xs text-lockbox-text-muted mb-5">
        Add your first API key to get started
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 px-4 py-2 bg-lockbox-accent text-lockbox-bg text-xs font-semibold rounded-lg hover:shadow-lg hover:shadow-lockbox-accent/20 transition-all active:scale-[0.98]"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Key
      </button>
    </div>
  );
}

// ── FAB Menu ──
function FABMenu({
  open,
  onToggle,
  onManual,
  onQuickPaste,
  onImportEnv,
  onManageVaults,
}: {
  open: boolean;
  onToggle: () => void;
  onManual: () => void;
  onQuickPaste: () => void;
  onImportEnv: () => void;
  onManageVaults: () => void;
}) {
  const menuItems = [
    { label: "Manual Entry", icon: <PenLine className="w-3.5 h-3.5" />, action: onManual },
    { label: "Quick Paste", icon: <ClipboardPaste className="w-3.5 h-3.5" />, action: onQuickPaste },
    { label: "Import .env", icon: <FileText className="w-3.5 h-3.5" />, action: onImportEnv },
    { label: "Manage Vaults", icon: <Box className="w-3.5 h-3.5" />, action: onManageVaults },
  ];

  return (
    <div className="absolute bottom-4 right-4 z-40">
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
            />
            {/* Menu items */}
            <motion.div
              className="absolute bottom-14 right-0 z-40 flex flex-col gap-1.5 w-40"
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    onToggle();
                    item.action();
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-lockbox-surface border border-lockbox-border rounded-lg text-xs font-medium text-lockbox-text hover:bg-lockbox-border transition-colors shadow-lg"
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        onClick={onToggle}
        className="w-11 h-11 rounded-full bg-lockbox-accent text-lockbox-bg flex items-center justify-center shadow-lg shadow-lockbox-accent/30 hover:shadow-lockbox-accent/50 transition-shadow z-50 relative"
        whileTap={{ scale: 0.92 }}
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Plus className="w-5 h-5" />
      </motion.button>
    </div>
  );
}

// ── Quick stats footer ──
function StatsFooter() {
  const { wallet, config, navigate } = useWalletContext();
  const vaultCount = wallet?.vaults.length ?? 0;
  const keyCount = wallet ? countAllKeys(wallet.vaults) : 0;
  const lastSynced = config.lastSynced ? timeAgo(config.lastSynced) : "never";

  return (
    <button
      onClick={() => navigate("vault-list")}
      className="w-full px-4 py-2 border-t border-lockbox-border flex items-center justify-center hover:bg-lockbox-surface/50 transition-colors cursor-pointer"
    >
      <p className="text-[10px] text-lockbox-text-muted">
        {vaultCount} vault{vaultCount !== 1 ? "s" : ""} &middot; {keyCount} key{keyCount !== 1 ? "s" : ""} &middot; Last synced {lastSynced}
      </p>
    </button>
  );
}

// ── Main WalletHome ──
export function WalletHome() {
  const { wallet, config, navigate, lock, setSelectedKey, recordAccess } = useWalletContext();

  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [fabOpen, setFabOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  // Collect all keys from all vaults
  const allKeys = useMemo(() => {
    if (!wallet) return [];
    return wallet.vaults.flatMap((v) =>
      v.keys.map((k) => ({ ...k, vaultName: v.name }))
    );
  }, [wallet]);

  // Apply filter
  const filteredKeys = useMemo(() => {
    let keys = allKeys;

    if (activeFilter === "favourites") {
      keys = keys.filter((k) => k.favourite);
    } else if (activeFilter === "recent") {
      keys = keys
        .filter((k) => k.lastAccessedAt)
        .sort((a, b) => {
          const aTime = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
          const bTime = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
          return bTime - aTime;
        });
    }

    // Apply search query
    if (query.trim()) {
      const lower = query.toLowerCase().trim();
      keys = keys.filter(
        (k) =>
          k.name.toLowerCase().includes(lower) ||
          k.service.toLowerCase().includes(lower) ||
          getServiceName(k.service).toLowerCase().includes(lower)
      );
    }

    return keys;
  }, [allKeys, activeFilter, query]);

  // Group keys by service
  const groupedByService = useMemo(() => {
    const groups: Record<string, ApiKey[]> = {};
    for (const key of filteredKeys) {
      if (!groups[key.service]) groups[key.service] = [];
      groups[key.service].push(key);
    }
    return Object.entries(groups).sort(([a], [b]) =>
      getServiceName(a).localeCompare(getServiceName(b))
    );
  }, [filteredKeys]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }, []);

  const handleKeyClick = useCallback(
    (key: ApiKey) => {
      setSelectedKey(key);
      navigate("key-detail");
    },
    [setSelectedKey, navigate]
  );

  const handleCopyKey = useCallback(
    async (key: ApiKey) => {
      try {
        await navigator.clipboard.writeText(key.value);
        const clearSeconds = config.clipboardClearSeconds;
        if (clearSeconds > 0) {
          setTimeout(() => {
            navigator.clipboard.writeText("").catch(() => {});
          }, clearSeconds * 1000);
        }
        await recordAccess(key.id, "copied");
        showToast("Key copied to clipboard");
      } catch {
        showToast("Failed to copy key");
      }
    },
    [recordAccess, showToast, config.clipboardClearSeconds]
  );

  const totalKeys = allKeys.length;
  const hasKeys = totalKeys > 0;

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Header */}
      <HomeHeader
        onLock={lock}
        onSettings={() => navigate("settings")}
      />

      {/* Account summary */}
      <AccountSummary />

      {/* Search + Filters */}
      {hasKeys && (
        <>
          <InlineSearchBar query={query} onChange={setQuery} />
          <FilterTabs active={activeFilter} onChange={setActiveFilter} />
        </>
      )}

      {/* Key list or empty state */}
      {hasKeys ? (
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {groupedByService.length > 0 ? (
            groupedByService.map(([service, keys]) => (
              <ServiceGroup
                key={service}
                service={service}
                keys={keys}
                onKeyClick={handleKeyClick}
                onCopyKey={handleCopyKey}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in">
              <p className="text-sm text-lockbox-text-secondary">No matching keys</p>
              <p className="text-xs text-lockbox-text-muted mt-1">
                Try a different search term or filter
              </p>
            </div>
          )}
        </div>
      ) : (
        <EmptyState onAdd={() => navigate("add-key")} />
      )}

      {/* Tier banner */}
      {hasKeys && (
        config.tier === "pro" ? (
          <ProStatusBanner onManage={() => navigate("upgrade")} />
        ) : (
          <UpgradeBanner onUpgrade={() => navigate("upgrade")} />
        )
      )}

      {/* Quick stats footer */}
      <StatsFooter />

      {/* FAB */}
      <FABMenu
        open={fabOpen}
        onToggle={() => setFabOpen(!fabOpen)}
        onManual={() => navigate("add-key")}
        onQuickPaste={() => navigate("quick-paste")}
        onImportEnv={() => navigate("import-env")}
        onManageVaults={() => navigate("vault-list")}
      />

      {/* Toast notification */}
      {toastVisible && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-lockbox-accent text-lockbox-bg px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-slide-up">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
