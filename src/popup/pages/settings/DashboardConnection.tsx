import { useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { useWalletContext } from "../../App";
import { DASHBOARD_URL } from "@/lib/constants";
import { getAccount, setAccount } from "@/lib/storage";
import { SettingsSection } from "./primitives";

export function DashboardConnection() {
  const { config, updateConfig } = useWalletContext();
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const dashboardUrl = config.dashboardUrl || DASHBOARD_URL;

  // Check if already connected on mount
  useState(() => {
    getAccount().then((info) => {
      if (info?.token && info?.dashboardConnected) {
        setStatus("connected");
        setConnectedEmail(info.email);
      }
    });
  });

  const handleConnect = async () => {
    const trimmed = token.trim();
    if (!trimmed) return;

    setStatus("connecting");
    setErrorMsg("");

    try {
      const res = await fetch(`${dashboardUrl}/api/auth/extension-verify`, {
        headers: { Authorization: `Bearer ${trimmed}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Invalid token");
      }

      const data = await res.json();
      if (!data.valid) throw new Error("Token is not valid");

      const account = await getAccount();
      await setAccount({
        email: data.email ?? account?.email ?? null,
        name: account?.name ?? "",
        walletId: account?.walletId ?? "",
        createdAt: account?.createdAt ?? new Date().toISOString(),
        token: trimmed,
        dashboardConnected: true,
      });

      setStatus("connected");
      setConnectedEmail(data.email);
      setToken("");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Connection failed");
    }
  };

  const handleDisconnect = async () => {
    const account = await getAccount();
    if (account) {
      await setAccount({
        ...account,
        token: null,
        dashboardConnected: false,
      });
    }
    setStatus("idle");
    setConnectedEmail(null);
    setToken("");
  };

  return (
    <SettingsSection
      title="Dashboard Connection"
      icon={<Link2 className="w-3.5 h-3.5 text-lockbox-accent" />}
    >
      {status === "connected" ? (
        <div className="py-2.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-lockbox-accent" />
            <span className="text-xs font-medium text-lockbox-accent">Connected</span>
          </div>
          {connectedEmail && (
            <p className="text-[10px] text-lockbox-text-muted mb-2">
              Syncing with {connectedEmail}
            </p>
          )}
          <p className="text-[10px] text-lockbox-text-muted mb-2">{dashboardUrl}</p>
          <button
            onClick={handleDisconnect}
            className="text-[10px] font-medium text-lockbox-danger hover:underline"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="py-2.5">
          <p className="text-[10px] text-lockbox-text-muted mb-2">
            Paste your connection token from the dashboard to enable sync.
          </p>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              placeholder="Paste token here..."
              className="flex-1 bg-lockbox-bg border border-lockbox-border rounded-md px-2 py-1.5 text-[10px] font-mono text-lockbox-text placeholder:text-lockbox-text-muted focus:border-lockbox-accent transition-colors min-w-0"
            />
            <button
              onClick={handleConnect}
              disabled={!token.trim() || status === "connecting"}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-lockbox-accent text-lockbox-bg text-[10px] font-semibold hover:bg-lockbox-accent-hover transition-colors disabled:opacity-50"
            >
              {status === "connecting" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Link2 size={12} />
              )}
              Connect
            </button>
          </div>
          {status === "error" && (
            <p className="text-[10px] text-lockbox-danger mt-1.5">{errorMsg}</p>
          )}
          <a
            href={`${dashboardUrl}/dashboard/extension-setup`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[10px] text-lockbox-accent hover:underline mt-2"
          >
            Get a token from the dashboard &rarr;
          </a>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="block text-[10px] text-lockbox-text-muted hover:text-lockbox-text-secondary mt-2 transition-colors"
          >
            {showAdvanced ? "Hide advanced" : "Advanced"}
          </button>
          {showAdvanced && (
            <div className="mt-2">
              <label className="text-[10px] text-lockbox-text-muted block mb-1">Dashboard URL</label>
              <input
                type="text"
                value={dashboardUrl}
                onChange={(e) => updateConfig({ dashboardUrl: e.target.value })}
                placeholder="https://dashboard.yourlockbox.dev"
                className="w-full bg-lockbox-bg border border-lockbox-border rounded-md px-2 py-1.5 text-[10px] font-mono text-lockbox-text placeholder:text-lockbox-text-muted focus:border-lockbox-accent transition-colors"
              />
              <p className="text-[9px] text-lockbox-text-muted mt-1">
                For local dev: http://localhost:3000
              </p>
            </div>
          )}
        </div>
      )}
    </SettingsSection>
  );
}
