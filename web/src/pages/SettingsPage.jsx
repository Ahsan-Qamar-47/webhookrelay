import { Settings, Key, Shield } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-relay-purple-light" />
          Settings
        </h1>
        <p className="text-relay-subtext text-sm mt-1">
          Configure API tokens, gateway connections, and retention rules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-3 text-white font-semibold">
            <Key className="w-5 h-5 text-relay-purple-light" />
            API Authentication Token
          </div>
          <p className="text-xs text-relay-subtext">
            Use this token to authenticate CLI clients and secure tunnel creation.
          </p>
          <div className="bg-relay-dark border border-relay-border p-3 rounded-lg font-mono text-xs text-slate-300">
            wr_live_8f9a2b1c4e7d3f0a9b8c7d6e
          </div>
        </div>

        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-3 text-white font-semibold">
            <Shield className="w-5 h-5 text-relay-green" />
            Security & Data Retention
          </div>
          <p className="text-xs text-relay-subtext">
            Sensitive headers masking and event body retention settings.
          </p>
          <div className="text-xs text-relay-subtext space-y-2">
            <div className="flex justify-between py-1 border-b border-relay-border/60">
              <span>Mask Authorization Headers:</span>
              <span className="text-relay-green font-mono font-semibold">Enabled</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Payload Log Retention:</span>
              <span className="text-slate-300 font-mono">30 Days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
