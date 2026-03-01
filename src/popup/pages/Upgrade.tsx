import { motion } from "framer-motion";
import {
  ArrowLeft,
  Crown,
  Check,
  X,
  KeyRound,
  Shield,
  Users,
  RefreshCw,
  Zap,
  ExternalLink,
  Box,
} from "lucide-react";
import { useWalletContext } from "../App";
import { DASHBOARD_URL, FREE_TIER_LIMITS } from "@/lib/constants";

interface FeatureRow {
  label: string;
  free: string | boolean;
  pro: string | boolean;
  icon: React.ReactNode;
}

const features: FeatureRow[] = [
  {
    label: "Vaults",
    free: `${FREE_TIER_LIMITS.maxVaults} vault`,
    pro: "Unlimited",
    icon: <Box className="w-3.5 h-3.5" />,
  },
  {
    label: "API Keys",
    free: `${FREE_TIER_LIMITS.maxKeys} keys`,
    pro: "Unlimited",
    icon: <KeyRound className="w-3.5 h-3.5" />,
  },
  {
    label: "End-to-end encryption",
    free: true,
    pro: true,
    icon: <Shield className="w-3.5 h-3.5" />,
  },
  {
    label: "Auto-fill",
    free: true,
    pro: true,
    icon: <Zap className="w-3.5 h-3.5" />,
  },
  {
    label: "Team sharing",
    free: false,
    pro: true,
    icon: <Users className="w-3.5 h-3.5" />,
  },
  {
    label: "Cross-device sync",
    free: false,
    pro: true,
    icon: <RefreshCw className="w-3.5 h-3.5" />,
  },
];

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="w-4 h-4 text-lockbox-accent" />
    ) : (
      <X className="w-4 h-4 text-lockbox-text-muted/40" />
    );
  }
  return <span className="text-xs text-lockbox-text-secondary">{value}</span>;
}

export function Upgrade() {
  const { navigate, config } = useWalletContext();
  const isPro = config.tier === "pro";

  const handleUpgrade = () => {
    chrome.tabs.create({ url: `${DASHBOARD_URL}/pricing` });
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
        <h1 className="text-lg font-semibold text-lockbox-text">Upgrade to Pro</h1>
      </motion.div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 flex flex-col">
        {/* Hero */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-lockbox-pro/10 border border-lockbox-pro/20 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-lockbox-pro" />
          </div>
          <h2 className="text-xl font-bold text-lockbox-text mb-1">
            {isPro ? "You're on Pro!" : "Unlock the full power"}
          </h2>
          <p className="text-xs text-lockbox-text-secondary">
            {isPro
              ? "Thank you for supporting Lockbox"
              : "Unlimited vaults, keys, team sharing & more"}
          </p>
        </motion.div>

        {/* Feature comparison table */}
        <motion.div
          className="bg-lockbox-surface border border-lockbox-border rounded-lg overflow-hidden mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {/* Table header */}
          <div className="grid grid-cols-3 gap-2 px-3.5 py-2.5 border-b border-lockbox-border bg-lockbox-bg/50">
            <div className="text-[10px] font-semibold text-lockbox-text-muted uppercase tracking-wider">
              Feature
            </div>
            <div className="text-[10px] font-semibold text-lockbox-text-muted uppercase tracking-wider text-center">
              Free
            </div>
            <div className="text-[10px] font-semibold text-lockbox-pro uppercase tracking-wider text-center">
              Pro
            </div>
          </div>

          {/* Table rows */}
          {features.map((feature, i) => (
            <div
              key={feature.label}
              className={`grid grid-cols-3 gap-2 px-3.5 py-2.5 items-center ${
                i < features.length - 1 ? "border-b border-lockbox-border" : ""
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-lockbox-text-muted">{feature.icon}</span>
                <span className="text-xs text-lockbox-text">{feature.label}</span>
              </div>
              <div className="flex justify-center">
                <FeatureValue value={feature.free} />
              </div>
              <div className="flex justify-center">
                <FeatureValue value={feature.pro} />
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="mt-auto pb-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {isPro ? (
            <div className="text-center py-3">
              <p className="text-xs text-lockbox-text-muted">
                Manage your subscription on the dashboard
              </p>
              <button
                onClick={() => chrome.tabs.create({ url: `${DASHBOARD_URL}/account` })}
                className="mt-2 text-xs text-lockbox-accent hover:underline flex items-center gap-1 mx-auto"
              >
                Open Dashboard
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={handleUpgrade}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm
                           transition-all duration-200 cursor-pointer
                           hover:shadow-lg hover:shadow-lockbox-pro/20 active:scale-[0.98]"
                style={{ backgroundColor: "#FFD700", color: "#0f0f14" }}
              >
                <Crown size={16} />
                Upgrade to Pro
                <ExternalLink size={14} />
              </button>
              <p className="text-[10px] text-lockbox-text-muted text-center mt-2">
                Opens the Lockbox dashboard to complete upgrade
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
