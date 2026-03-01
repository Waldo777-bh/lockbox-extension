import { motion } from "framer-motion";
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
        width="80"
        height="80"
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

export function Welcome() {
  const { navigate } = useWalletContext();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-10">
      <LockboxLogo />

      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-lockbox-text tracking-tight">
          Welcome to Lockbox
        </h1>
        <p className="mt-2 text-lockbox-text-secondary text-sm leading-relaxed">
          The secure wallet for your API keys
        </p>
      </motion.div>

      <motion.div
        className="mt-10 w-full flex flex-col gap-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <button
          onClick={() => navigate("create-wallet")}
          className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide
                     transition-all duration-200 cursor-pointer
                     hover:shadow-lg hover:shadow-lockbox-accent/20 active:scale-[0.98]"
          style={{ backgroundColor: "#00d87a", color: "#0f0f14" }}
        >
          Create New Wallet
        </button>

        <button
          onClick={() => navigate("import-wallet")}
          className="w-full py-3 rounded-xl font-medium text-sm
                     border border-lockbox-border text-lockbox-text-secondary
                     hover:border-lockbox-border-hover hover:text-lockbox-text
                     transition-all duration-200 cursor-pointer active:scale-[0.98]
                     bg-transparent"
        >
          Import Existing Wallet
        </button>
      </motion.div>

      <motion.p
        className="mt-auto pt-6 text-lockbox-text-muted text-xs text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        Your keys never leave your device
      </motion.p>
    </div>
  );
}
