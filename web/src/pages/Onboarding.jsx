import { useState } from 'react';
import { 
  Rocket, 
  CheckCircle2, 
  Copy, 
  Check, 
  Terminal, 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  Globe, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isFiringTest, setIsFiringTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const ingestUrl = 'http://localhost:8080/ingest/stripe-demo';
  const installCmd = 'curl -sSL https://webhookrelay.dev/install.sh | bash';
  const connectCmd = 'relay connect --token whr_token_998877665544332211 --to http://localhost:3000';

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSendTestWebhook = async () => {
    setIsFiringTest(true);
    setTestResult(null);
    try {
      // Simulate/trigger test event
      await new Promise((resolve) => setTimeout(resolve, 800));
      setTestResult({
        success: true,
        eventId: `test_evt_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsFiringTest(false);
    }
  };

  const steps = [
    { title: 'Create Account', desc: 'Developer identity & access token' },
    { title: 'Ingest Endpoint', desc: 'Your public relay subdomain' },
    { title: 'Install CLI', desc: 'Local agent installation' },
    { title: 'Connect Tunnel', desc: 'Forward traffic to localhost' },
    { title: 'Fire Test Webhook', desc: 'Real-time delivery check' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header Banner */}
      <div className="glass-panel p-6 bg-gradient-to-r from-relay-purple/20 via-relay-purple/10 to-transparent border-relay-purple/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-relay-purple/20 text-relay-purple-light border border-relay-purple/30 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quick Start Wizard</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Rocket className="w-6 h-6 text-relay-purple-light" />
            Get Started with WebhookRelay
          </h1>
          <p className="text-relay-subtext text-xs md:text-sm">
            Complete this 5-step interactive setup to start inspecting and relaying webhooks locally.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-relay-muted">Step {currentStep} of 5</span>
          <div className="w-32 bg-relay-dark border border-relay-border rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-relay-purple to-relay-purple-light h-full transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="grid grid-cols-5 gap-2 font-sans">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <button
              key={step.title}
              onClick={() => setCurrentStep(stepNum)}
              className={`p-3 rounded-xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-relay-purple-light ${
                isCurrent
                  ? 'bg-relay-purple/20 border-relay-purple text-white shadow-md'
                  : isDone
                  ? 'bg-relay-card/80 border-emerald-500/40 text-slate-200 hover:bg-relay-card'
                  : 'bg-relay-dark/60 border-relay-border/60 text-relay-muted hover:bg-relay-card/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-mono font-bold uppercase ${isCurrent ? 'text-relay-purple-light' : isDone ? 'text-emerald-400' : 'text-relay-muted'}`}>
                  Step {stepNum}
                </span>
                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-xs font-bold truncate">{step.title}</p>
            </button>
          );
        })}
      </div>

      {/* Main Step Cards */}
      <div className="glass-panel p-8 space-y-6">
        {/* STEP 1: ACCOUNT */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-relay-purple/20 border border-relay-purple/40 flex items-center justify-center text-relay-purple-light">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Step 1: Account Authenticated</h2>
                <p className="text-xs text-relay-subtext">Your developer identity and authentication token are active.</p>
              </div>
            </div>

            <div className="bg-relay-dark/90 border border-relay-border rounded-xl p-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-relay-border/60 pb-2">
                <span className="text-relay-muted">Account Email</span>
                <span className="text-slate-200 font-semibold">demo@webhookrelay.dev</span>
              </div>
              <div className="flex justify-between items-center border-b border-relay-border/60 pb-2">
                <span className="text-relay-muted">Subscription Plan</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Team Developer Tier</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-relay-muted">API Token</span>
                <span className="text-slate-400">whr_token_998877665544332211</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ENDPOINT URL */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-relay-purple/20 border border-relay-purple/40 flex items-center justify-center text-relay-purple-light">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Step 2: Copy Ingest Webhook URL</h2>
                <p className="text-xs text-relay-subtext">Paste this public URL into your Stripe, GitHub, or WhatsApp developer dashboard.</p>
              </div>
            </div>

            <div className="bg-relay-dark/90 border border-relay-border rounded-xl p-4 flex items-center justify-between gap-4 font-mono text-xs">
              <span className="text-relay-purple-light font-semibold truncate">{ingestUrl}</span>
              <button
                onClick={() => handleCopy(ingestUrl, 2)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-relay-purple/20 hover:bg-relay-purple/30 border border-relay-purple/40 text-relay-purple-light rounded-lg font-sans font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-relay-purple-light"
              >
                {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-relay-green" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 2 ? 'Copied!' : 'Copy Ingest URL'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: INSTALL CLI */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-relay-purple/20 border border-relay-purple/40 flex items-center justify-center text-relay-purple-light">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Step 3: Install WebhookRelay CLI</h2>
                <p className="text-xs text-relay-subtext">Install the lightweight local agent binary on your development machine (macOS / Linux / WSL).</p>
              </div>
            </div>

            <div className="bg-relay-dark/90 border border-relay-border rounded-xl p-4 flex items-center justify-between gap-4 font-mono text-xs">
              <span className="text-emerald-400 font-semibold truncate">{installCmd}</span>
              <button
                onClick={() => handleCopy(installCmd, 3)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-relay-purple/20 hover:bg-relay-purple/30 border border-relay-purple/40 text-relay-purple-light rounded-lg font-sans font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-relay-purple-light"
              >
                {copiedIndex === 3 ? <Check className="w-3.5 h-3.5 text-relay-green" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 3 ? 'Copied!' : 'Copy Command'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CONNECT TUNNEL */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-relay-purple/20 border border-relay-purple/40 flex items-center justify-center text-relay-purple-light">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Step 4: Connect Local Tunnel</h2>
                <p className="text-xs text-relay-subtext">Run this command in your local terminal to forward incoming webhooks to your local app port 3000.</p>
              </div>
            </div>

            <div className="bg-relay-dark/90 border border-relay-border rounded-xl p-4 flex items-center justify-between gap-4 font-mono text-xs">
              <span className="text-slate-200 font-semibold truncate">{connectCmd}</span>
              <button
                onClick={() => handleCopy(connectCmd, 4)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-relay-purple/20 hover:bg-relay-purple/30 border border-relay-purple/40 text-relay-purple-light rounded-lg font-sans font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-relay-purple-light"
              >
                {copiedIndex === 4 ? <Check className="w-3.5 h-3.5 text-relay-green" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 4 ? 'Copied!' : 'Copy Command'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: FIRE TEST WEBHOOK */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-relay-purple/20 border border-relay-purple/40 flex items-center justify-center text-relay-purple-light">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Step 5: Fire Synthetic Test Webhook</h2>
                <p className="text-xs text-relay-subtext">Test end-to-end ingestion and verify real-time event streaming into your live feed.</p>
              </div>
            </div>

            <div className="bg-relay-dark/90 border border-relay-border rounded-xl p-6 flex flex-col items-center justify-center space-y-4 text-center">
              <p className="text-xs text-relay-subtext max-w-md">
                Click the button below to dispatch a synthetic JSON webhook payload to your ingest gateway endpoint.
              </p>

              <button
                onClick={handleSendTestWebhook}
                disabled={isFiringTest}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-relay-purple to-relay-purple-dark hover:brightness-110 text-white text-xs font-bold rounded-xl shadow-lg shadow-relay-purple/30 transition-all focus:outline-none focus:ring-2 focus:ring-relay-purple-light"
              >
                <Zap className={`w-4 h-4 ${isFiringTest ? 'animate-spin' : ''}`} />
                <span>{isFiringTest ? 'Dispatching Test Webhook...' : 'Fire Test Webhook Event'}</span>
              </button>

              {testResult && testResult.success && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl p-4 w-full text-left font-mono text-xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold">Test Webhook Delivered Successfully!</p>
                      <p className="text-[11px] text-emerald-400/80">Event ID: {testResult.eventId} • Timestamp: {testResult.timestamp}</p>
                    </div>
                  </div>
                  <a
                    href="/events"
                    className="flex items-center gap-1 text-xs font-sans font-bold text-white hover:underline shrink-0"
                  >
                    <span>View in Inspector</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Stepper Controls */}
        <div className="pt-6 border-t border-relay-border/60 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 bg-relay-dark hover:bg-relay-card border border-relay-border text-slate-300 text-xs font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-relay-purple-light"
          >
            Back
          </button>

          {currentStep < 5 ? (
            <button
              onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
              className="flex items-center gap-1.5 px-5 py-2 bg-relay-purple hover:bg-relay-purple-dark text-white text-xs font-bold rounded-lg shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-relay-purple-light"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <a
              href="/events"
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <span>Go to Inspector Feed</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
