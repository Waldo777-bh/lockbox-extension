import React from "react";
import { Lock, LogOut, Crown } from "lucide-react";
import type { User, Vault } from "../../types";

interface HeaderProps {
  user: User | null;
  vaults: Vault[];
  onSignOut: () => void;
}

export function Header({ user, vaults, onSignOut }: HeaderProps) {
  const isPro = user?.tier === "pro";

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-lockbox-border">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-lockbox-accent/10 border border-lockbox-accent/20 flex items-center justify-center">
          <Lock className="w-3.5 h-3.5 text-lockbox-accent" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-semibold text-lockbox-text leading-tight">
              Lockbox
            </h1>
            {isPro && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-lockbox-accent/15 text-lockbox-accent text-[9px] font-bold leading-none">
                <Crown className="w-2.5 h-2.5" />
                PRO
              </span>
            )}
          </div>
          <p className="text-[10px] text-lockbox-text-muted leading-tight">
            {vaults.length} vault{vaults.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {user && (
          <div className="flex items-center gap-2">
            {user.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.name ?? "User"}
                className="w-6 h-6 rounded-full border border-lockbox-border"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-lockbox-accent/20 flex items-center justify-center">
                <span className="text-[10px] font-medium text-lockbox-accent">
                  {(user.name ?? user.email)?.[0]?.toUpperCase() ?? "U"}
                </span>
              </div>
            )}
          </div>
        )}
        <button
          onClick={onSignOut}
          className="p-1.5 rounded-md hover:bg-lockbox-surface text-lockbox-text-muted hover:text-lockbox-text transition-colors"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
