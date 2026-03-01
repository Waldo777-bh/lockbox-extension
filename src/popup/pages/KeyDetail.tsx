import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  Check,
  Pencil,
  Trash2,
  Star,
  Clock,
  Calendar,
  StickyNote,
  Link,
  AlertTriangle,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { useWalletContext } from "../App";
import { getServiceName, getServiceColor } from "@/services/serviceRegistry";
import { formatDate, maskValue } from "@/lib/utils";

// ── Confirm dialog ──
function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
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
          <h3 className="text-sm font-semibold text-lockbox-text">{title}</h3>
        </div>
        <p className="text-xs text-lockbox-text-secondary mb-5">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-lockbox-border text-xs font-medium text-lockbox-text-secondary hover:bg-lockbox-border transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg bg-lockbox-danger text-white text-xs font-semibold hover:bg-lockbox-danger/90 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Key value reveal ──
function KeyValueReveal({
  value,
  revealed,
  onToggle,
  onCopy,
  copied,
}: {
  value: string;
  revealed: boolean;
  onToggle: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="bg-lockbox-surface border border-lockbox-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-lockbox-text-muted uppercase tracking-wider">
          Key Value
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-lockbox-border transition-colors"
            title={revealed ? "Hide" : "Reveal"}
          >
            {revealed ? (
              <EyeOff className="w-3.5 h-3.5 text-lockbox-accent" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-lockbox-text-muted" />
            )}
          </button>
          <button
            onClick={onCopy}
            className="p-1 rounded hover:bg-lockbox-border transition-colors"
            title="Copy"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-lockbox-accent" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-lockbox-text-muted" />
            )}
          </button>
        </div>
      </div>
      <div className="font-mono text-xs break-all select-all">
        {revealed ? (
          <span className="text-lockbox-accent">{value}</span>
        ) : (
          <span className="text-lockbox-text-muted">{maskValue(value)}</span>
        )}
      </div>
    </div>
  );
}

// ── Main KeyDetail ──
export function KeyDetail() {
  const {
    navigate,
    selectedKey,
    setSelectedKey,
    wallet,
    deleteKey,
    updateKey,
    recordAccess,
    error,
    setError,
  } = useWalletContext();

  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refCopied, setRefCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState(selectedKey?.name ?? "");
  const [editNotes, setEditNotes] = useState(selectedKey?.notes ?? "");
  const [editFavourite, setEditFavourite] = useState(selectedKey?.favourite ?? false);
  const [saving, setSaving] = useState(false);

  if (!selectedKey) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-lockbox-text-muted">No key selected</p>
      </div>
    );
  }

  const serviceName = getServiceName(selectedKey.service);
  const serviceColor = getServiceColor(selectedKey.service);
  const vaultName = wallet?.vaults.find((v) => v.id === selectedKey.vaultId)?.name ?? "Default";
  const lockboxRef = `lockbox://${vaultName}/${selectedKey.name}`;

  const handleCopyValue = async () => {
    try {
      await navigator.clipboard.writeText(selectedKey.value);
      await recordAccess(selectedKey.id, "copied");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard failed
    }
  };

  const handleCopyRef = async () => {
    try {
      await navigator.clipboard.writeText(lockboxRef);
      setRefCopied(true);
      setTimeout(() => setRefCopied(false), 2000);
    } catch {
      // clipboard failed
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteKey(selectedKey.id);
      setSelectedKey(null);
      navigate("home");
    } catch (err: any) {
      setError(err.message || "Failed to delete key");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSaveEdits = async () => {
    setSaving(true);
    try {
      await updateKey(selectedKey.id, {
        name: editName.trim(),
        notes: editNotes.trim(),
        favourite: editFavourite,
      });
      // Update selected key in context
      setSelectedKey({
        ...selectedKey,
        name: editName.trim(),
        notes: editNotes.trim(),
        favourite: editFavourite,
      });
      setEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to update key");
    } finally {
      setSaving(false);
    }
  };

  const handleGoBack = () => {
    setSelectedKey(null);
    navigate("home");
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
            onClick={handleGoBack}
            className="p-1.5 rounded-lg hover:bg-lockbox-surface transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} className="text-lockbox-text-secondary" />
          </button>
          <h1 className="text-lg font-semibold text-lockbox-text">Key Details</h1>
        </div>
        <div className="flex items-center gap-1">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-md hover:bg-lockbox-surface text-lockbox-text-muted hover:text-lockbox-accent transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 rounded-md hover:bg-lockbox-surface text-lockbox-text-muted hover:text-lockbox-danger transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 flex flex-col gap-4">
        {/* Service header */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
            style={{ backgroundColor: `${serviceColor}20`, color: serviceColor }}
          >
            {serviceName[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-lockbox-text">{serviceName}</p>
              {selectedKey.favourite && (
                <Star className="w-4 h-4 text-lockbox-warning fill-lockbox-warning" />
              )}
            </div>
            {editing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 w-full bg-lockbox-surface border border-lockbox-border rounded-md px-2.5 py-1.5 text-xs text-lockbox-text focus:border-lockbox-accent transition-colors"
              />
            ) : (
              <p className="text-sm text-lockbox-text-secondary">{selectedKey.name}</p>
            )}
          </div>
        </div>

        {/* Favourite toggle in edit mode */}
        {editing && (
          <button
            type="button"
            onClick={() => setEditFavourite(!editFavourite)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              editFavourite
                ? "border-lockbox-warning/30 bg-lockbox-warning/5"
                : "border-lockbox-border bg-lockbox-surface"
            }`}
          >
            <Star
              className={`w-4 h-4 ${
                editFavourite
                  ? "text-lockbox-warning fill-lockbox-warning"
                  : "text-lockbox-text-muted"
              }`}
            />
            <span className="text-xs font-medium text-lockbox-text-secondary">
              {editFavourite ? "Favourite" : "Add to favourites"}
            </span>
          </button>
        )}

        {/* Key value */}
        <KeyValueReveal
          value={selectedKey.value}
          revealed={revealed}
          onToggle={() => setRevealed(!revealed)}
          onCopy={handleCopyValue}
          copied={copied}
        />

        {/* Lockbox reference */}
        <div className="bg-lockbox-surface border border-lockbox-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Link className="w-3 h-3 text-lockbox-text-muted" />
              <span className="text-[10px] font-medium text-lockbox-text-muted uppercase tracking-wider">
                Reference
              </span>
            </div>
            <button
              onClick={handleCopyRef}
              className="p-1 rounded hover:bg-lockbox-border transition-colors"
              title="Copy reference"
            >
              {refCopied ? (
                <Check className="w-3.5 h-3.5 text-lockbox-accent" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-lockbox-text-muted" />
              )}
            </button>
          </div>
          <p className="text-xs font-mono text-lockbox-accent break-all">{lockboxRef}</p>
        </div>

        {/* Metadata */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-lockbox-text-muted" />
            <span className="text-xs text-lockbox-text-muted">Created:</span>
            <span className="text-xs text-lockbox-text-secondary">
              {formatDate(selectedKey.createdAt)}
            </span>
          </div>

          {selectedKey.lastAccessedAt && (
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-lockbox-text-muted" />
              <span className="text-xs text-lockbox-text-muted">Last accessed:</span>
              <span className="text-xs text-lockbox-text-secondary">
                {formatDate(selectedKey.lastAccessedAt)}
              </span>
            </div>
          )}

          {selectedKey.expiresAt && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-lockbox-warning" />
              <span className="text-xs text-lockbox-text-muted">Expires:</span>
              <span className="text-xs text-lockbox-warning">
                {formatDate(selectedKey.expiresAt)}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <StickyNote className="w-3 h-3 text-lockbox-text-muted" />
            <span className="text-[10px] font-medium text-lockbox-text-muted uppercase tracking-wider">
              Notes
            </span>
          </div>
          {editing ? (
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Add notes..."
              rows={3}
              className="w-full bg-lockbox-surface border border-lockbox-border rounded-lg px-3 py-2 text-xs text-lockbox-text placeholder:text-lockbox-text-muted focus:border-lockbox-accent transition-colors resize-none"
            />
          ) : (
            <p className="text-xs text-lockbox-text-secondary bg-lockbox-surface border border-lockbox-border rounded-lg p-3 min-h-[40px]">
              {selectedKey.notes || "No notes"}
            </p>
          )}
        </div>

        {/* Edit save / cancel buttons */}
        {editing && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setEditing(false);
                setEditName(selectedKey.name);
                setEditNotes(selectedKey.notes);
                setEditFavourite(selectedKey.favourite);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-lockbox-border text-xs font-medium text-lockbox-text-secondary hover:bg-lockbox-surface transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              onClick={handleSaveEdits}
              disabled={saving || !editName.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-xs
                         transition-all duration-200 cursor-pointer
                         disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#00d87a", color: "#0f0f14" }}
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save Changes
            </button>
          </div>
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
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        <ConfirmDialog
          open={showDeleteConfirm}
          title="Delete Key"
          message={`Are you sure you want to delete "${selectedKey.name}"? This action cannot be undone.`}
          confirmLabel={deleting ? "Deleting..." : "Delete"}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </AnimatePresence>
    </div>
  );
}
