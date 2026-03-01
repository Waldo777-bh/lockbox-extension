import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Check, AlertTriangle, ShieldAlert } from "lucide-react";
import { useWalletContext } from "../App";

export function RecoveryPhrase() {
  const { navigate, recoveryPhrase } = useWalletContext();
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const words = recoveryPhrase ? recoveryPhrase.split(" ") : [];

  const handleCopy = async () => {
    if (!recoveryPhrase) return;
    try {
      await navigator.clipboard.writeText(recoveryPhrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments where clipboard API is unavailable
    }
  };

  return (
    <div className="flex-1 flex flex-col px-6 py-5 overflow-y-auto">
      {/* Header */}
      <motion.div
        className="flex items-center gap-3 mb-4"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => navigate("create-wallet")}
          className="p-1.5 rounded-lg hover:bg-lockbox-surface transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} className="text-lockbox-text-secondary" />
        </button>
        <h1 className="text-lg font-semibold text-lockbox-text">
          Save your recovery phrase
        </h1>
      </motion.div>

      {/* Warning banner */}
      <motion.div
        className="bg-lockbox-warning/10 border border-lockbox-warning/30 rounded-lg px-3.5 py-3 mb-5 flex items-start gap-2.5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <ShieldAlert size={16} className="text-lockbox-warning flex-shrink-0 mt-0.5" />
        <p className="text-xs text-lockbox-warning leading-relaxed">
          This is the <strong>only way</strong> to recover your wallet if you forget
          your password. Write it down and store it somewhere safe.
        </p>
      </motion.div>

      {/* Word grid */}
      <motion.div
        className="grid grid-cols-3 gap-2 mb-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {words.map((word, i) => (
          <motion.div
            key={i}
            className="bg-lockbox-surface border border-lockbox-border rounded-lg px-3 py-2.5
                       flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 + i * 0.03, duration: 0.25 }}
          >
            <span className="text-[10px] font-medium text-lockbox-text-muted w-4 text-right flex-shrink-0">
              {i + 1}
            </span>
            <span className="text-sm font-medium text-lockbox-text truncate">
              {word}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Copy button */}
      <motion.button
        onClick={handleCopy}
        className="w-full py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-2
                   border border-lockbox-border text-lockbox-text-secondary
                   hover:border-lockbox-border-hover hover:text-lockbox-text
                   transition-all duration-200 cursor-pointer bg-transparent mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        {copied ? (
          <>
            <Check size={14} className="text-lockbox-accent" />
            <span className="text-lockbox-accent">Copied to clipboard</span>
          </>
        ) : (
          <>
            <Copy size={14} />
            Copy to clipboard
          </>
        )}
      </motion.button>

      {/* Never share warning */}
      <motion.div
        className="bg-lockbox-danger/5 border border-lockbox-danger/20 rounded-lg px-3.5 py-3 mb-5 flex items-start gap-2.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.3 }}
      >
        <AlertTriangle size={14} className="text-lockbox-danger flex-shrink-0 mt-0.5" />
        <p className="text-xs text-lockbox-danger/80 leading-relaxed">
          <strong>Never share</strong> this phrase with anyone. Anyone with these
          words can access your wallet.
        </p>
      </motion.div>

      {/* Confirmation checkbox */}
      <motion.label
        className="flex items-center gap-3 cursor-pointer select-none mb-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      >
        <div className="relative flex-shrink-0">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
              confirmed
                ? "bg-lockbox-accent border-lockbox-accent"
                : "border-lockbox-border bg-transparent hover:border-lockbox-border-hover"
            }`}
          >
            {confirmed && <Check size={12} className="text-[#0f0f14]" />}
          </div>
        </div>
        <span className="text-xs text-lockbox-text-secondary leading-relaxed">
          I have saved my recovery phrase somewhere safe
        </span>
      </motion.label>

      {/* Continue button */}
      <motion.div
        className="mt-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65, duration: 0.3 }}
      >
        <button
          onClick={() => navigate("confirm-phrase")}
          disabled={!confirmed}
          className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide
                     transition-all duration-200 cursor-pointer
                     disabled:opacity-40 disabled:cursor-not-allowed
                     hover:shadow-lg hover:shadow-lockbox-accent/20 active:scale-[0.98]"
          style={{ backgroundColor: "#00d87a", color: "#0f0f14" }}
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
}
