import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  Globe, 
  Settings, 
  Zap 
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Events Log', path: '/events', icon: Activity },
  { name: 'Endpoints', path: '/endpoints', icon: Globe },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-relay-dark border-r border-relay-border flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-relay-border/60">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-relay-purple-dark via-relay-purple to-purple-400 flex items-center justify-center text-white shadow-lg shadow-relay-purple/20">
          <Zap className="w-5 h-5 fill-white text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            Webhook<span className="text-relay-purple-light">Relay</span>
          </span>
          <span className="text-[10px] text-relay-muted font-mono tracking-wider uppercase">
            Inspector v1.0
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-relay-muted uppercase tracking-wider">
          Menu
        </div>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 group ${
                  isActive
                    ? 'bg-relay-purple/15 text-relay-purple-light border border-relay-purple/30 shadow-sm'
                    : 'text-relay-subtext hover:text-white hover:bg-relay-card/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-relay-purple-light' : 'text-relay-muted group-hover:text-relay-subtext'
                    }`}
                  />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Connection Status Footer */}
      <div className="p-4 m-3 rounded-xl bg-relay-card/70 border border-relay-border/80">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-relay-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-relay-green"></span>
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
              Gateway Connected
            </span>
            <span className="text-[11px] text-relay-muted font-mono">
              wss://relay.local:8080
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
