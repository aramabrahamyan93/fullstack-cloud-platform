import type { User } from "../../auth/types";
import type { OrganizationDashboardSummary } from "../../organizations/types";
import type { TaskStatusCounters } from "../../tasks/types";

type DashboardPageProps = {
  currentUser: User | null;
  taskCounters: TaskStatusCounters;
  workspaceSummary?: OrganizationDashboardSummary | null;
  isWorkspaceSummaryLoading?: boolean;
};

export function DashboardPage({
  currentUser,
  taskCounters,
  workspaceSummary = null,
  isWorkspaceSummaryLoading = false
}: DashboardPageProps) {
  const taskSummary = workspaceSummary?.task_counts ?? taskCounters;

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h1>Dashboard</h1>
          <p className="card-subtitle">
            High-level overview of your workspace activity and workload.
          </p>
        </div>
      </div>

      {currentUser ? (
        <>
          {isWorkspaceSummaryLoading ? (
            <div className="empty-state">Loading workspace dashboard...</div>
          ) : null}

          <div className="dashboard-grid">
            <div className="dashboard-card">
              <span className="dashboard-label">Current user</span>
              <strong>{currentUser.email}</strong>
            </div>

            <div className="dashboard-card">
              <span className="dashboard-label">All tasks</span>
              <strong>{taskSummary.all}</strong>
            </div>

            <div className="dashboard-card">
              <span className="dashboard-label">Open</span>
              <strong>{taskSummary.open}</strong>
            </div>

            <div className="dashboard-card">
              <span className="dashboard-label">In progress</span>
              <strong>{taskSummary.in_progress}</strong>
            </div>

            <div className="dashboard-card">
              <span className="dashboard-label">Done</span>
              <strong>{taskSummary.done}</strong>
            </div>

            <div className="dashboard-card">
              <span className="dashboard-label">Members</span>
              <strong>{workspaceSummary?.members_count ?? "—"}</strong>
            </div>

            <div className="dashboard-card">
              <span className="dashboard-label">Pending invitations</span>
              <strong>{workspaceSummary?.pending_invitations_count ?? "—"}</strong>
            </div>

            <div className="dashboard-card">
              <span className="dashboard-label">Recent activity</span>
              <strong>{workspaceSummary?.recent_activity_count ?? "—"}</strong>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          Login or register to see your workspace dashboard.
        </div>
      )}
    </section>
  );
}
