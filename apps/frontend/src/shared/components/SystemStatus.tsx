import "./SystemStatus.css";
import { API_BASE_URL } from "../api/client";

type SystemStatusProps = {
  health: string;
  version: string;
};

export function SystemStatus({ health, version }: SystemStatusProps) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>System Status</h2>
          <p className="card-subtitle">Local frontend and backend connectivity.</p>
        </div>
      </div>

      <div className="status-grid">
        <div className="status-item">
          <span className="status-label">API URL</span>
          <span className="status-value">{API_BASE_URL}</span>
        </div>

        <div className="status-item">
          <span className="status-label">Backend Health</span>
          <span className="status-value">{health}</span>
        </div>

        <div className="status-item">
          <span className="status-label">Backend Version</span>
          <span className="status-value">{version}</span>
        </div>
      </div>
    </section>
  );
}