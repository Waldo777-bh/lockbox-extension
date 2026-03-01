import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Check, X } from "lucide-react";
import { useWalletContext } from "../App";
import { getPasswordStrength } from "@/lib/utils";

export function CreateWallet() {
  const { navigate, createNewWallet, loading, error } = useWalletContext();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = getPasswordStrength(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const hasMinLength = password.length >= 8;
  const canSubmit =
    passwordsMatch &&
    hasMinLength &&
    (strength.label === "fair" ||
      strength.label === "strong" ||
      strength.label === "very strong") &&
    !loading;

  const strengthPercent =
    strength.score === 1 ? 25 : strength.score === 2 ? 50 : strength.score === 3 ? 75 : 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await createNewWallet(password);
  };

  return (
    <div className="flex-1 flex flex-col px-6 py-4 overflow-y-auto">
      {/* Header */}
      <motion.div
        className="flex items-center gap-3 mb-4"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => navigate("welcome")}
          className="p-1.5 rounded-lg hover:bg-lockbox-surface transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} className="text-lockbox-text-secondary" />
        </button>
        <h1 className="text-lg font-semibold text-lockbox-text">
          Set your master password
        </h1>
      </motion.div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {/* Password input */}
          <div>
            <label className="block text-xs font-medium text-lockbox-text-secondary mb-1.5">
              Master Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a strong password"
                className="w-full bg-lockbox-surface border border-lockbox-border rounded-lg px-3.5 py-2.5 pr-10
                           text-sm text-lockbox-text placeholder:text-lockbox-text-muted
                           focus:border-lockbox-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lockbox-text-muted
                           hover:text-lockbox-text-secondary transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength meter */}
            {password.length > 0 && (
              <motion.div
                className="mt-2.5"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.2 }}
              >
                <div className="h-1.5 w-full bg-lockbox-surface rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: strength.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${strengthPercent}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
                <p
                  className="text-xs mt-1 font-medium capitalize"
                  style={{ color: strength.color }}
                >
                  {strength.label}
                </p>
              </motion.div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-medium text-lockbox-text-secondary mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full bg-lockbox-surface border border-lockbox-border rounded-lg px-3.5 py-2.5 pr-10
                           text-sm text-lockbox-text placeholder:text-lockbox-text-muted
                           focus:border-lockbox-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lockbox-text-muted
                           hover:text-lockbox-text-secondary transition-colors cursor-pointer"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <motion.p
                className="text-xs mt-1 text-lockbox-danger"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Passwords do not match
              </motion.p>
            )}
          </div>

          {/* Requirements */}
          <div className="bg-lockbox-surface rounded-lg p-3.5 border border-lockbox-border">
            <p className="text-xs font-medium text-lockbox-text-secondary mb-2">
              Requirements
            </p>
            <div className="flex flex-col gap-1.5">
              <Requirement met={hasMinLength} label="At least 8 characters" />
              <Requirement
                met={
                  strength.label === "fair" ||
                  strength.label === "strong" ||
                  strength.label === "very strong"
                }
                label="Password strength at least fair"
              />
              <Requirement met={passwordsMatch} label="Passwords match" />
            </div>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            className="mt-4 bg-lockbox-danger/10 border border-lockbox-danger/30 rounded-lg px-3.5 py-2.5"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs text-lockbox-danger">{error}</p>
          </motion.div>
        )}

        {/* Submit */}
        <motion.div
          className="mt-auto pt-4 pb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 rounded-xl font-semibold text-sm tracking-wide
                       transition-all duration-200 cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed
                       hover:shadow-lg hover:shadow-lockbox-accent/20 active:scale-[0.98]"
            style={{
              backgroundColor: canSubmit ? "#00d87a" : "#00d87a",
              color: "#0f0f14",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-[#0f0f14] border-t-transparent rounded-full animate-spin" />
                Creating Wallet...
              </span>
            ) : (
              "Create Wallet"
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
}

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: met ? "rgba(0, 216, 122, 0.15)" : "rgba(107, 114, 128, 0.15)",
        }}
      >
        {met ? (
          <Check size={10} className="text-lockbox-accent" />
        ) : (
          <X size={10} className="text-lockbox-text-muted" />
        )}
      </div>
      <span
        className={`text-xs ${met ? "text-lockbox-text-secondary" : "text-lockbox-text-muted"}`}
      >
        {label}
      </span>
    </div>
  );
}
