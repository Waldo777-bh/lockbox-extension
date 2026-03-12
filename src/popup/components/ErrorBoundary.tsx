import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="w-full h-full bg-lockbox-bg flex items-center justify-center p-6">
        <div className="text-center max-w-[280px]">
          <div className="w-12 h-12 rounded-full bg-lockbox-danger/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-lockbox-danger" />
          </div>
          <h2 className="text-sm font-semibold text-lockbox-text mb-2">
            Something went wrong
          </h2>
          <p className="text-xs text-lockbox-text-muted mb-4 leading-relaxed">
            Lockbox encountered an unexpected error. Your vault data is safe.
          </p>
          {this.state.error && (
            <pre className="text-[10px] text-lockbox-text-muted bg-lockbox-surface border border-lockbox-border rounded-lg p-2 mb-4 text-left overflow-auto max-h-[80px]">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-lockbox-accent text-lockbox-bg text-xs font-semibold hover:bg-lockbox-accent-hover transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reload Extension
          </button>
        </div>
      </div>
    );
  }
}
