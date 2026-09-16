import "./App.css";

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">WR</div>
          <div className="brand-name">Webhook Relay</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-label">Workspace</span>

            <a className="nav-item active" href="#">
              <span>⌂</span>
              Dashboard
            </a>

            <a className="nav-item" href="#">
              <span>↯</span>
              Tunnels
            </a>

            <a className="nav-item" href="#">
              <span>◷</span>
              Requests
            </a>

            <a className="nav-item" href="#">
              <span>◇</span>
              Events
            </a>
          </div>

          <div className="nav-section nav-bottom">
            <span className="nav-label">System</span>

            <a className="nav-item" href="#">
              <span>⚙</span>
              Settings
            </a>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="connection-indicator">
            <span className="status-dot" />
            <div>
              <strong>System online</strong>
              <small>All services operational</small>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace / Dashboard</span>
          </div>

          <button className="user-button">
            <span className="avatar">U</span>
            <span>Developer</span>
            <span>⌄</span>
          </button>
        </header>

        <main className="content">
          <section className="hero">
            <div>
              <h1>Dashboard</h1>
              <p>Monitor and manage your local webhook tunnels.</p>
            </div>

            <button className="primary-button">+ New tunnel</button>
          </section>

          <section className="stats">
            <div className="stat-card">
              <div className="stat-label">Active tunnels</div>
              <div className="stat-value">0</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Requests today</div>
              <div className="stat-value">0</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Connected clients</div>
              <div className="stat-value">0</div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Active Tunnels</h2>
                <span>Local endpoints connected to Relay</span>
              </div>

              <span className="live-badge">
                <span className="status-dot" />
                Live
              </span>
            </div>

            <div className="empty-state">
              <div className="empty-icon">↯</div>
              <h3>No active tunnels</h3>
              <p>
                Start the Relay CLI and connect a tunnel to begin receiving
                webhooks in your local environment.
              </p>

              <button className="secondary-button">
                View CLI instructions
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
