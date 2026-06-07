import { API_BASE_URL } from "../api/client";

type SystemStatusProps = {
  health: string;
  version: string;
};

export function SystemStatus({ health, version }: SystemStatusProps) {
  return (
    <section className="card">
      <p>
        <strong>API URL:</strong> <span>{API_BASE_URL}</span>
      </p>
      <p>
        <strong>Backend Health:</strong> <span>{health}</span>
      </p>
      <p>
        <strong>Backend Version:</strong> <span>{version}</span>
      </p>
    </section>
  );
}