import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Loader2, Check } from "lucide-react";
import { useWalletContext } from "../../App";
import { getRecoveryVault } from "@/lib/storage";
import { validateRecoveryPhrase } from "@/crypto/recovery";

export function SetUpRecoverySection() {
  const { wallet, setupRecovery } = useWalletContext();
  const [expanded, setExpanded] = useState(false);
  const [phraseInput, setPhraseInput] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [hasRecoveryVault, setHasRecoveryVault] = useState<boolean | null>(null);

  useState(() => {
    getRecoveryVault().then((rv) => {
      setHasRecoveryVault(rv !== null);
    });
  });

  const isSetUp = wallet?._recoveryKeyB64 || hasRecoveryVault;

  const phrase = phraseInput.trim().toLowerCase().replace(/\s+/g, " ");
  const isPhraseValid = validateRecoveryPhrase(phrase);

  const handleSetup = async () => {
    if (!isPhraseValid) return;
    setStatus("saving");
    setErrorMsg("");
    try {
      await setupRecovery(phrase);
      setStatus("success");
      setPhraseInput("");
      setHasRecoveryVault(true);
      setTimeout(() => {
        setExpanded(false);
        setStatus("idle");
      }, 2000);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Failed to set up recovery");
    }
  };

  if (isSetUp) {
    return (
      <div className="py-2.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-lockbox-text">Recovery Backup</p>
            <p className="text-[10px] text-lockbox-text-muted mt-0.5">
              Phrase-based recovery is enabled
            </p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-lockbox-accent/10 text-lockbox-accent text-xs font-medium border border-lockbox-accent/20">
            <Check size={12} />
            Active
          </div>
        </div>
      </div>
    );
  }

  if (!expanded) {
    return (
      <div className="py-2.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-lockbox-text">Recovery Backup</p>
            <p className="text-[10px] text-lockbox-danger mt-0.5">
              Not set up — recovery phrase won't work
            </p>
          </div>
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-lockbox-accent/10 text-lockbox-accent text-xs font-medium hover:bg-lockbox-accent/15 border border-lockbox-accent/20 transition-colors"
          >
            <Shield className="w-3 h-3" />
            Set Up
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
      <p className="text-xs font-medium text-lockbox-text mb-1">Set Up Recovery Backup</p>
      <p className="text-[10px] text-lockbox-text-muted mb-3 leading-relaxed">
        Enter the 12-word recovery phrase you were given when you created this wallet.
        This will enable phrase-based wallet recovery.
      </p>

      <textarea
        value={phraseInput}
        onChange={(e) => setPhraseInput(e.target.value)}
        placeholder="Enter your 12-word recovery phrase"
        rows={3}
        className="w-full bg-lockbox-bg border border-lockbox-border rounded-lg px-3 py-2
                   text-xs text-lockbox-text placeholder:text-lockbox-text-muted
                   focus:border-lockbox-accent transition-colors resize-none font-mono"
        spellCheck={false}
        autoComplete="off"
      />

      <div className="flex items-center justify-between mt-1.5 mb-3">
        <p className={`text-[10px] ${isPhraseValid ? "text-lockbox-accent" : "text-lockbox-text-muted"}`}>
          {phrase.split(" ").filter((w) => w.length > 0).length}/12 words
        </p>
        {isPhraseValid && (
          <p className="text-[10px] text-lockbox-accent flex items-center gap-1">
            <Check size={10} /> Valid phrase
          </p>
        )}
      </div>

      {status === "error" && errorMsg && (
        <motion.div
          className="mb-3 bg-lockbox-danger/10 border border-lockbox-danger/30 rounded-lg px-3 py-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-[10px] text-lockbox-danger">{errorMsg}</p>
        </motion.div>
      )}

      {status === "success" && (
        <motion.div
          className="mb-3 bg-lockbox-accent/10 border border-lockbox-accent/30 rounded-lg px-3 py-2 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Check className="w-3.5 h-3.5 text-lockbox-accent" />
          <p className="text-[10px] text-lockbox-accent font-medium">Recovery backup enabled!</p>
        </motion.div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => { setExpanded(false); setPhraseInput(""); setStatus("idle"); }}
          className="flex-1 py-1.5 rounded-lg border border-lockbox-border text-xs font-medium text-lockbox-text-secondary hover:bg-lockbox-border transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSetup}
          disabled={!isPhraseValid || status === "saving"}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#00d87a", color: "#0f0f14" }}
        >
          {status === "saving" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              <Shield size={12} />
              Enable Recovery
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
