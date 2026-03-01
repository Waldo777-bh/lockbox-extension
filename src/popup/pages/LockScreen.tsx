import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useWalletContext } from "../App";

function LockboxLogo() {
  return (
    <motion.div
      className="relative"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ backgroundColor: "rgba(0, 216, 122, 0.15)" }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <svg
        width="72"
        height="72"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* Outer circle */}
        <circle
          cx="40"
          cy="40"
          r="38"
          stroke="#00d87a"
          strokeWidth="2"
          fill="rgba(0, 216, 122, 0.05)"
        />
        {/* Lock body */}
        <rect
          x="26"
          y="36"
          width="28"
          height="22"
          rx="4"
          fill="#00d87a"
        />
        {/* Lock shackle */}
        <path
          d="M30 36V28C30 22.4772 34.4772 18 40 18C45.5228 18 50 22.4772 50 28V36"
          stroke="#00d87a"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Keyhole */}
        <circle cx="40" cy="45" r="3" fill="#0f0f14" />
        <rect x="39" y="45" width="2" height="5" rx="1" fill="#0f0f14" />
      </svg>
    </motion.div>
  );
}

export function LockScreen() {
  const { unlock, loading, error, setError, navigate } = useWalletContext();
  const [password, setPassword] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus the password input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;
    setError(null);
    await unlock(password);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-10">
      <LockboxLogo />

      <motion.div
        className="mt-6 text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <h1 className="text-xl font-bold text-lockbox-text tracking-tight">
          Welcome back
        </h1>
        <p className="mt-1 text-lockbox-text-secondary text-sm">
          Enter your password to unlock
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        className="mt-8 w-full flex flex-col gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div>
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Master password"
            autoFocus
            className="w-full bg-lockbox-surface border border-lockbox-border rounded-xl px-4 py-3
                       text-sm text-lockbox-text placeholder:text-lockbox-text-muted
                       focus:border-lockbox-accent transition-colors"
          />
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            className="bg-lockbox-danger/10 border border-lockbox-danger/30 rounded-lg px-3.5 py-2.5"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs text-lockbox-danger text-center">{error}</p>
          </motion.div>
        )}

        <button
          type="submit"
          disabled={!password.trim() || loading}
          className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide
                     transition-all duration-200 cursor-pointer
                     disabled:opacity-40 disabled:cursor-not-allowed
                     hover:shadow-lg hover:shadow-lockbox-accent/20 active:scale-[0.98]"
          style={{ backgroundColor: "#00d87a", color: "#0f0f14" }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Unlocking...
            </span>
          ) : (
            "Unlock"
          )}
        </button>
      </motion.form>

      <motion.button
        onClick={() => setShowForgot(!showForgot)}
        className="mt-4 text-xs text-lockbox-text-muted hover:text-lockbox-accent transition-colors cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        Forgot password?
      </motion.button>

      {/* Forgot password recovery panel */}
      {showForgot && (
        <motion.div
          className="mt-3 w-full bg-lockbox-surface border border-lockbox-border rounded-xl p-4"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <p className="text-xs text-lockbox-text-secondary leading-relaxed mb-3">
            To reset your wallet, you will need your <strong className="text-lockbox-text">12-word recovery phrase</strong>.
            Without it, your encrypted data cannot be recovered.
          </p>
          <button
            type="button"
            onClick={() => navigate("import-wallet")}
            className="w-full py-2.5 rounded-lg font-semibold text-xs tracking-wide
                       transition-all duration-200 cursor-pointer
                       hover:shadow-md active:scale-[0.98]
                       bg-lockbox-accent/15 text-lockbox-accent border border-lockbox-accent/30
                       hover:bg-lockbox-accent/25"
          >
            Restore with Recovery Phrase
          </button>
        </motion.div>
      )}

      <motion.p
        className="mt-auto pt-6 text-lockbox-text-muted text-[10px] text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        Your keys never leave your device
      </motion.p>
    </div>
  );
}
