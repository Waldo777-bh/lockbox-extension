import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, KeyRound, Loader2, Check, X } from "lucide-react";
import { useWalletContext } from "../../App";
import { getPasswordStrength } from "@/lib/utils";

export function ChangePasswordSection() {
  const { changePassword } = useWalletContext();
  const [expanded, setExpanded] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const strength = getPasswordStrength(newPassword);
  const strengthPercent =
    strength.score === 1 ? 25 : strength.score === 2 ? 50 : strength.score === 3 ? 75 : 100;
  const hasMinLength = newPassword.length >= 8;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFairOrBetter =
    strength.label === "fair" || strength.label === "strong" || strength.label === "very strong";
  const canSubmit =
    currentPassword.length > 0 && hasMinLength && passwordsMatch && isFairOrBetter && status !== "saving";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setStatus("saving");
    setErrorMsg("");
    try {
      await changePassword(currentPassword, newPassword);
      setStatus("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setExpanded(false);
        setStatus("idle");
      }, 2000);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(
        err.message === "Invalid key"
          ? "Current password is incorrect"
          : err.message || "Failed to change password"
      );
    }
  };

  const handleCancel = () => {
    setExpanded(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setStatus("idle");
    setErrorMsg("");
  };

  if (!expanded) {
    return (
      <div className="py-2.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-lockbox-text">Change Password</p>
            <p className="text-[10px] text-lockbox-text-muted mt-0.5">
              Update your master password
            </p>
          </div>
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-lockbox-accent/10 text-lockbox-accent text-xs font-medium hover:bg-lockbox-accent/15 border border-lockbox-accent/20 transition-colors"
          >
            <KeyRound className="w-3 h-3" />
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="py-2.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <p className="text-xs font-medium text-lockbox-text mb-3">Change Password</p>

      <div className="flex flex-col gap-3">
        {/* Current password */}
        <div>
          <label className="block text-[10px] font-medium text-lockbox-text-secondary mb-1">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (status === "error") { setStatus("idle"); setErrorMsg(""); }
              }}
              placeholder="Enter current password"
              className="w-full bg-lockbox-bg border border-lockbox-border rounded-lg px-3 py-2 pr-9 text-xs text-lockbox-text placeholder:text-lockbox-text-muted focus:border-lockbox-accent transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lockbox-text-muted hover:text-lockbox-text-secondary transition-colors cursor-pointer"
            >
              {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div>
          <label className="block text-[10px] font-medium text-lockbox-text-secondary mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full bg-lockbox-bg border border-lockbox-border rounded-lg px-3 py-2 pr-9 text-xs text-lockbox-text placeholder:text-lockbox-text-muted focus:border-lockbox-accent transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lockbox-text-muted hover:text-lockbox-text-secondary transition-colors cursor-pointer"
            >
              {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {newPassword.length > 0 && (
            <motion.div
              className="mt-1.5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
            >
              <div className="h-1 w-full bg-lockbox-bg rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: strength.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${strengthPercent}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <p
                className="text-[10px] mt-0.5 font-medium capitalize"
                style={{ color: strength.color }}
              >
                {strength.label}
              </p>
            </motion.div>
          )}
        </div>

        {/* Confirm new password */}
        <div>
          <label className="block text-[10px] font-medium text-lockbox-text-secondary mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full bg-lockbox-bg border border-lockbox-border rounded-lg px-3 py-2 pr-9 text-xs text-lockbox-text placeholder:text-lockbox-text-muted focus:border-lockbox-accent transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lockbox-text-muted hover:text-lockbox-text-secondary transition-colors cursor-pointer"
            >
              {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-[10px] mt-0.5 text-lockbox-danger">Passwords do not match</p>
          )}
        </div>

        {/* Validation hints */}
        {newPassword.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: hasMinLength ? "rgba(0, 216, 122, 0.15)" : "rgba(107, 114, 128, 0.15)",
                }}
              >
                {hasMinLength ? (
                  <Check size={8} className="text-lockbox-accent" />
                ) : (
                  <X size={8} className="text-lockbox-text-muted" />
                )}
              </div>
              <span className={`text-[10px] ${hasMinLength ? "text-lockbox-text-secondary" : "text-lockbox-text-muted"}`}>
                At least 8 characters
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: isFairOrBetter ? "rgba(0, 216, 122, 0.15)" : "rgba(107, 114, 128, 0.15)",
                }}
              >
                {isFairOrBetter ? (
                  <Check size={8} className="text-lockbox-accent" />
                ) : (
                  <X size={8} className="text-lockbox-text-muted" />
                )}
              </div>
              <span className={`text-[10px] ${isFairOrBetter ? "text-lockbox-text-secondary" : "text-lockbox-text-muted"}`}>
                Strength at least fair
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {status === "error" && errorMsg && (
          <motion.div
            className="bg-lockbox-danger/10 border border-lockbox-danger/30 rounded-lg px-3 py-2"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-[10px] text-lockbox-danger">{errorMsg}</p>
          </motion.div>
        )}

        {/* Success */}
        {status === "success" && (
          <motion.div
            className="bg-lockbox-accent/10 border border-lockbox-accent/30 rounded-lg px-3 py-2 flex items-center gap-2"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Check className="w-3.5 h-3.5 text-lockbox-accent" />
            <p className="text-[10px] text-lockbox-accent font-medium">Password changed successfully</p>
          </motion.div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 py-1.5 rounded-lg border border-lockbox-border text-xs font-medium text-lockbox-text-secondary hover:bg-lockbox-border transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#00d87a", color: "#0f0f14" }}
          >
            {status === "saving" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                <KeyRound size={12} />
                Update Password
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
