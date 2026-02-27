import React, { useState, useCallback, useEffect } from "react";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { KeyList } from "./components/KeyList";
import { QuickActions } from "./components/QuickActions";
import { LoginPrompt } from "./components/LoginPrompt";
import { Toast } from "./components/Toast";
import { useAuth } from "./hooks/useAuth";
import { useVaults } from "./hooks/useVaults";
import { useSearch } from "./hooks/useSearch";

export function Popup() {
  const { isAuthenticated, user, loading: authLoading, signOut } = useAuth();
  const { vaults, loading: vaultsLoading } = useVaults(isAuthenticated);
  const { query, setQuery, filteredVaults } = useSearch(vaults);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const handleCopy = useCallback(() => {
    setToast({ visible: true, message: "Copied!" });
  }, []);

  const hideToast = useCallback(() => {
    setToast({ visible: false, message: "" });
  }, []);

  // Flatten keys for keyboard navigation
  const allKeys = filteredVaults.flatMap((v) => v.keys);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < allKeys.length - 1 ? prev + 1 : prev,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [allKeys.length]);

  if (authLoading) {
    return (
      <div className="w-[380px] h-[300px] bg-lockbox-bg flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-lockbox-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-[380px] h-[340px] bg-lockbox-bg">
        <LoginPrompt />
      </div>
    );
  }

  const selectedKey = selectedIndex >= 0 ? allKeys[selectedIndex] : null;

  return (
    <div className="w-[380px] max-h-[500px] bg-lockbox-bg flex flex-col relative">
      <Header
        user={user}
        vaults={vaults}
        onSignOut={signOut}
      />
      <SearchBar query={query} onChange={setQuery} />
      <KeyList
        vaults={filteredVaults}
        loading={vaultsLoading}
        selectedKeyId={selectedKey?.id ?? null}
        onCopy={handleCopy}
      />
      <QuickActions />
      <Toast message={toast.message} visible={toast.visible} onHide={hideToast} />
    </div>
  );
}
