import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  KeyRound,
  Crown,
  Loader2,
  Box,
  Shield,
  Briefcase,
  Folder,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { useWalletContext } from "../App";
import { getServiceName, getServiceColor } from "@/services/serviceRegistry";
import { timeAgo, maskValue } from "@/lib/utils";
import { FREE_TIER_LIMITS } from "@/lib/constants";
import type { Vault as VaultType, ApiKey } from "@/types";

const VAULT_ICONS = [
  { value: "vault", label: "Vault", Icon: Box },
  { value: "shield", label: "Shield", Icon: Shield },
  { value: "briefcase", label: "Briefcase", Icon: Briefcase },
  { value: "folder", label: "Folder", Icon: Folder },
];

function getVaultIcon(icon: string) {
  const match = VAULT_ICONS.find((i) => i.value === icon);
  return match?.Icon ?? Box;
}

// ── Individual vault card ──
function VaultCard({
  vault,
  onKeyClick,
  onRename,
  onDelete,
  canDelete,
}: {
  vault: VaultType;
  onKeyClick: (key: ApiKey) => void;
  onRename: (vaultId: string, name: string) => void;
  onDelete: (vaultId: string) => void;
  canDelete: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(vault.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const IconComponent = getVaultIcon(vault.icon);

  const handleSaveRename = () => {
    if (editName.trim() && editName.trim() !== vault.name) {
      onRename(vault.id, editName.trim());
    }
    setEditing(false);
  };

  const handleCancelRename = () => {
    setEditName(vault.name);
    setEditing(false);
  };

  return (
    <motion.div
      className="border border-lockbox-border rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Vault header */}
      <div className="flex items-center gap-3 px-3.5 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-9 h-9 rounded-lg bg-lockbox-accent/10 border border-lockbox-accent/20 flex items-center justify-center flex-shrink-0 hover:bg-lockbox-accent/15 transition-colors"
        >
          <IconComponent className="w-4 h-4 text-lockbox-accent" />
        </button>
        <div className="flex-1 min-w-0" onClick={() => !editing && setExpanded(!expanded)}>
          {editing ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveRename();
                  if (e.key === "Escape") handleCancelRename();
                }}
                autoFocus
                className="flex-1 bg-lockbox-surface border border-lockbox-accent rounded px-2 py-1 text-sm text-lockbox-text focus:outline-none"
              />
              <button onClick={handleSaveRename} className="p-1 rounded hover:bg-lockbox-surface transition-colors text-lockbox-accent cursor-pointer">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleCancelRename} className="p-1 rounded hover:bg-lockbox-surface transition-colors text-lockbox-text-muted cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-lockbox-text truncate cursor-pointer">{vault.name}</p>
              <p className="text-[10px] text-lockbox-text-muted">
                {vault.keys.length} key{vault.keys.length !== 1 ? "s" : ""} &middot; Updated{" "}
                {timeAgo(vault.updatedAt)}
              </p>
            </>
          )}
        </div>
        {!editing && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true); }}
              className="p-1.5 rounded-md hover:bg-lockbox-surface transition-colors text-lockbox-text-muted hover:text-lockbox-text-secondary cursor-pointer flex-shrink-0"
              title="Rename vault"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmingDelete(true); }}
              className="p-1.5 rounded-md hover:bg-lockbox-danger/10 transition-colors text-lockbox-text-muted hover:text-lockbox-danger cursor-pointer flex-shrink-0"
              title="Delete vault"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 p-1 cursor-pointer"
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-lockbox-text-muted" />
          ) : (
            <ChevronRight className="w-4 h-4 text-lockbox-text-muted" />
          )}
        </button>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmingDelete && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-lockbox-border bg-lockbox-danger/5 px-3.5 py-2.5">
              {!canDelete ? (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-lockbox-danger flex-shrink-0" />
                  <p className="text-xs text-lockbox-danger flex-1">Cannot delete the last vault.</p>
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    className="px-2 py-1 rounded-md text-xs font-medium text-lockbox-text-secondary hover:bg-lockbox-surface transition-colors border border-lockbox-border"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-lockbox-danger flex-shrink-0" />
                    <p className="text-xs text-lockbox-danger">
                      Delete {vault.name}? This will remove all keys in this vault.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmingDelete(false)}
                      className="flex-1 py-1.5 rounded-md text-xs font-medium text-lockbox-text-secondary hover:bg-lockbox-surface transition-colors border border-lockbox-border"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onDelete(vault.id);
                        setConfirmingDelete(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-lockbox-danger text-white text-xs font-semibold hover:bg-lockbox-danger/90 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded key list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-lockbox-border">
              {vault.keys.length > 0 ? (
                vault.keys.map((key) => {
                  const color = getServiceColor(key.service);
                  const svcName = getServiceName(key.service);
                  return (
                    <button
                      key={key.id}
                      onClick={() => onKeyClick(key)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-lockbox-surface/60 transition-colors text-left"
                    >
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {svcName[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-lockbox-text truncate">
                          {key.name}
                        </p>
                        <p className="text-[10px] text-lockbox-text-muted truncate">
                          {svcName} &middot; {maskValue(key.value)}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-4 text-center">
                  <p className="text-xs text-lockbox-text-muted">No keys in this vault</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Create vault form ──
function CreateVaultForm({
  onSave,
  onCancel,
  saving,
}: {
  onSave: (name: string, description: string, icon: string) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("vault");

  const canSave = name.trim() && !saving;

  return (
    <motion.div
      className="border border-lockbox-accent/30 rounded-lg p-3.5 bg-lockbox-accent/5"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="text-xs font-semibold text-lockbox-text mb-3">New Vault</p>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Vault name"
          autoFocus
          className="w-full bg-lockbox-surface border border-lockbox-border rounded-lg px-3 py-2 text-sm text-lockbox-text placeholder:text-lockbox-text-muted focus:border-lockbox-accent transition-colors"
        />

        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full bg-lockbox-surface border border-lockbox-border rounded-lg px-3 py-2 text-xs text-lockbox-text placeholder:text-lockbox-text-muted focus:border-lockbox-accent transition-colors"
        />

        {/* Icon selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-lockbox-text-muted mr-1">Icon:</span>
          {VAULT_ICONS.map((item) => {
            const Icon = item.Icon;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setIcon(item.value)}
                className={`p-1.5 rounded-md transition-colors ${
                  icon === item.value
                    ? "bg-lockbox-accent/15 text-lockbox-accent border border-lockbox-accent/30"
                    : "bg-lockbox-surface text-lockbox-text-muted hover:text-lockbox-text border border-lockbox-border"
                }`}
                title={item.label}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-lockbox-border text-xs font-medium text-lockbox-text-secondary hover:bg-lockbox-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => canSave && onSave(name.trim(), description.trim(), icon)}
            disabled={!canSave}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold text-xs
                       transition-all duration-200 cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#00d87a", color: "#0f0f14" }}
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              "Create"
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main VaultList ──
export function VaultList() {
  const { navigate, wallet, config, addVault, updateVault, deleteVault, setSelectedKey, error, setError } = useWalletContext();
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const vaults = wallet?.vaults ?? [];
  const isFree = config.tier === "free";
  const atVaultLimit = isFree && vaults.length >= FREE_TIER_LIMITS.maxVaults;

  const handleCreateAttempt = () => {
    if (atVaultLimit) {
      setError(`Free tier: ${FREE_TIER_LIMITS.maxVaults} vault maximum. Upgrade to Pro for unlimited vaults.`);
      return;
    }
    setShowCreate(true);
  };

  const handleCreateVault = async (name: string, description: string, icon: string) => {
    setSaving(true);
    setError(null);
    try {
      await addVault(name, description, icon);
      setShowCreate(false);
    } catch (err: any) {
      setError(err.message || "Failed to create vault");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyClick = (key: ApiKey) => {
    setSelectedKey(key);
    navigate("key-detail");
  };

  const handleRenameVault = async (vaultId: string, newName: string) => {
    try {
      await updateVault(vaultId, { name: newName });
    } catch (err: any) {
      setError(err.message || "Failed to rename vault");
    }
  };

  const handleDeleteVault = async (vaultId: string) => {
    try {
      await deleteVault(vaultId);
    } catch (err: any) {
      setError(err.message || "Failed to delete vault");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between px-4 py-3 border-b border-lockbox-border"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("home")}
            className="p-1.5 rounded-lg hover:bg-lockbox-surface transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} className="text-lockbox-text-secondary" />
          </button>
          <h1 className="text-lg font-semibold text-lockbox-text">Vaults</h1>
        </div>
        <button
          onClick={handleCreateAttempt}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-lockbox-accent/10 text-lockbox-accent text-xs font-medium hover:bg-lockbox-accent/15 transition-colors border border-lockbox-accent/20"
        >
          <Plus className="w-3 h-3" />
          Create
        </button>
      </motion.div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 flex flex-col gap-3">
        {/* Upgrade prompt if at limit */}
        {atVaultLimit && showCreate && (
          <motion.div
            className="bg-lockbox-pro/5 border border-lockbox-pro/20 rounded-lg p-3.5 flex items-start gap-2.5"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Crown className="w-4 h-4 text-lockbox-pro flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-lockbox-pro">Vault limit reached</p>
              <p className="text-[10px] text-lockbox-text-muted mt-0.5">
                Free tier supports {FREE_TIER_LIMITS.maxVaults} vault. Upgrade to Pro for unlimited vaults.
              </p>
              <button
                onClick={() => navigate("upgrade")}
                className="mt-2 text-[10px] font-semibold text-lockbox-accent hover:underline"
              >
                Upgrade to Pro
              </button>
            </div>
          </motion.div>
        )}

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

        {/* Create vault form */}
        {showCreate && !atVaultLimit && (
          <CreateVaultForm
            onSave={handleCreateVault}
            onCancel={() => setShowCreate(false)}
            saving={saving}
          />
        )}

        {/* Vault list */}
        {vaults.length > 0 ? (
          vaults.map((vault) => (
            <VaultCard
              key={vault.id}
              vault={vault}
              onKeyClick={handleKeyClick}
              onRename={handleRenameVault}
              onDelete={handleDeleteVault}
              canDelete={vaults.length > 1}
            />
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-12 h-12 rounded-xl bg-lockbox-surface border border-lockbox-border flex items-center justify-center mb-3">
              <KeyRound className="w-5 h-5 text-lockbox-text-muted" />
            </div>
            <p className="text-sm text-lockbox-text-secondary mb-1">No vaults</p>
            <p className="text-xs text-lockbox-text-muted">Create a vault to organize your keys</p>
          </div>
        )}
      </div>
    </div>
  );
}
