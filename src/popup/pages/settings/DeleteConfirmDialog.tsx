import { motion } from "framer-motion";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

export function DeleteConfirmDialog({
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
