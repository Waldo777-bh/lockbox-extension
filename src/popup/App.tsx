import React, { createContext, useContext, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWallet } from "./hooks/useWallet";
import { Welcome } from "./pages/Welcome";
import { CreateWallet } from "./pages/CreateWallet";
import { RecoveryPhrase } from "./pages/RecoveryPhrase";
import { ConfirmPhrase } from "./pages/ConfirmPhrase";
import { WalletReady } from "./pages/WalletReady";
import { LockScreen } from "./pages/LockScreen";
import { WalletHome } from "./pages/WalletHome";
import { AddKey } from "./pages/AddKey";
import { QuickPaste } from "./pages/QuickPaste";
import { ImportEnv } from "./pages/ImportEnv";
import { KeyDetail } from "./pages/KeyDetail";
import { VaultList } from "./pages/VaultList";
import { Settings } from "./pages/Settings";
import { Upgrade } from "./pages/Upgrade";
import { ImportWallet } from "./pages/ImportWallet";
import type { PopupPage, ApiKey } from "@/types";

type WalletContextType = ReturnType<typeof useWallet> & {
  selectedKey: ApiKey | null;
  setSelectedKey: (key: ApiKey | null) => void;
};

const WalletContext = createContext<WalletContextType>(null!);
export const useWalletContext = () => useContext(WalletContext);

const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.2, ease: "easeOut" as const },
};

// Detect if running in side panel (set via data attribute on #root)
function useIsSidePanel() {
  const root = document.getElementById("root");
  return root?.dataset.mode === "sidepanel";
}

export default function App() {
  const wallet = useWallet();
  const [selectedKey, setSelectedKey] = React.useState<ApiKey | null>(null);
  const isSidePanel = useIsSidePanel();

  // Apply theme class to root element
  useEffect(() => {
    const root = document.documentElement;
    const theme = wallet.config?.theme ?? "dark";

    root.classList.remove("theme-dark", "theme-light");

    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(prefersDark ? "theme-dark" : "theme-light");

      const handler = (e: MediaQueryListEvent) => {
        root.classList.remove("theme-dark", "theme-light");
        root.classList.add(e.matches ? "theme-dark" : "theme-light");
      };
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      root.classList.add(`theme-${theme}`);
    }
  }, [wallet.config?.theme]);

  const sizeClass = isSidePanel ? "w-full h-full" : "w-[420px] h-[640px]";

  if (wallet.loading) {
    return (
      <div className={`${sizeClass} bg-lockbox-bg flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-lockbox-accent border-t-transparent animate-spin" />
          <span className="text-lockbox-text-muted text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (wallet.page) {
      case "welcome":
        return <Welcome key="welcome" />;
      case "create-wallet":
        return <CreateWallet key="create-wallet" />;
      case "import-wallet":
        return <ImportWallet key="import-wallet" />;
      case "recovery-phrase":
        return <RecoveryPhrase key="recovery-phrase" />;
      case "confirm-phrase":
        return <ConfirmPhrase key="confirm-phrase" />;
      case "wallet-ready":
        return <WalletReady key="wallet-ready" />;
      case "lock-screen":
        return <LockScreen key="lock-screen" />;
      case "home":
        return <WalletHome key="home" />;
      case "add-key":
        return <AddKey key="add-key" />;
      case "quick-paste":
        return <QuickPaste key="quick-paste" />;
      case "import-env":
        return <ImportEnv key="import-env" />;
      case "key-detail":
        return <KeyDetail key="key-detail" />;
      case "vault-list":
        return <VaultList key="vault-list" />;
      case "settings":
        return <Settings key="settings" />;
      case "upgrade":
        return <Upgrade key="upgrade" />;
      default:
        return <WalletHome key="home-default" />;
    }
  };

  return (
    <WalletContext.Provider value={{ ...wallet, selectedKey, setSelectedKey }}>
      <div className={`${sizeClass} bg-lockbox-bg overflow-hidden flex flex-col`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={wallet.page}
            {...pageTransition}
            className="flex-1 overflow-hidden flex flex-col"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>
    </WalletContext.Provider>
  );
}
