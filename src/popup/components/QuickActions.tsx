import React from "react";
import { Plus, ExternalLink } from "lucide-react";
import { DASHBOARD_URL } from "../../lib/constants";

export function QuickActions() {
  const openDashboard = (path = "") => {
    chrome.tabs.create({ url: `${DASHBOARD_URL}${path}` });
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border-t border-lockbox-border">
      <button
        onClick={() => openDashboard("/dashboard")}
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-lockbox-accent bg-lockbox-accent/10 hover:bg-lockbox-accent/15 border border-lockbox-accent/20 rounded-md transition-colors"
      >
        <Plus className="w-3 h-3" />
        Add Key
      </button>
      <button
        onClick={() => openDashboard("/dashboard")}
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-lockbox-text-secondary hover:text-lockbox-text bg-lockbox-surface hover:bg-lockbox-border border border-lockbox-border rounded-md transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        Dashboard
      </button>
    </div>
  );
}
