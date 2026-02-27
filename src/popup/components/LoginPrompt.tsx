import React from "react";
import { Lock, ExternalLink } from "lucide-react";
import { SIGN_IN_URL } from "../../lib/constants";

export function LoginPrompt() {
  const handleSignIn = () => {
    chrome.tabs.create({ url: SIGN_IN_URL });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-10 animate-fade-in">
      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl bg-lockbox-accent/10 border border-lockbox-accent/20 flex items-center justify-center mb-6">
        <Lock className="w-8 h-8 text-lockbox-accent" />
      </div>

      <h1 className="text-xl font-semibold text-lockbox-text mb-1">Lockbox</h1>
      <p className="text-sm text-lockbox-text-secondary mb-8 text-center">
        Your encrypted API key vault
      </p>

      <button
        onClick={handleSignIn}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-lockbox-accent hover:bg-lockbox-accent-hover text-lockbox-bg font-medium rounded-lg transition-colors duration-150"
      >
        Sign in to Lockbox
        <ExternalLink className="w-4 h-4" />
      </button>

      <p className="text-xs text-lockbox-text-muted mt-4 text-center">
        Opens the Lockbox dashboard to sign in
      </p>
    </div>
  );
}
