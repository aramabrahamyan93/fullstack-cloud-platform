import type { User } from "../../auth/types";
import type { TaskStatusCounters } from "../../tasks/types";

type DashboardPageProps = {
  currentUser: User | null;
  taskCounters: TaskStatusCounters;
};

export function DashboardPage({
  currentUser,
  taskCounters
}: DashboardPageProps) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h1>Dashboard</h1>
          <p className="card-subtitle">
            High-level overview of your local fullstack cloud platform.
          </p>
        </div>
      </div>

      {currentUser ? (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <span className="dashboard-label">Current user</span>
            <strong>{currentUser.email}</strong>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-label">All tasks</span>
            <strong>{taskCounters.all}</strong>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-label">Open</span>
            <strong>{taskCounters.open}</strong>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-label">Done</span>
            <strong>{taskCounters.done}</strong>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          Login or register to see your workspace dashboard.
        </div>
      )}
    </section>
  );
}
