import { Message } from "../../shared/components/Message";
import type { AppController } from "../hooks/useAppController";
import { TasksRouteContent } from "./TasksRouteContent";
import { useWorkspaceRouteContext } from "./useWorkspaceRouteContext";

type WorkspaceTasksRouteProps = {
  controller: AppController;
};

export function WorkspaceTasksRoute({ controller }: WorkspaceTasksRouteProps) {
  const { routeWorkspace, isLoadingWorkspaceContext } =
    useWorkspaceRouteContext({
      controller,
      loadTasks: true,
      loadMembers: false
    });

  if (isLoadingWorkspaceContext) {
    return (
      <section className="card">
        <div className="card-header">
          <div>
            <h1>Tasks</h1>
            <p className="card-subtitle">Loading workspace context...</p>
          </div>
        </div>

        <div className="empty-state">Please wait...</div>
      </section>
    );
  }

  if (!controller.currentUser) {
    return (
      <TasksRouteContent
        controller={controller}
        currentUserExists={false}
      />
    );
  }

  if (!routeWorkspace) {
    return (
      <>
        <Message message={controller.message} />

        <section className="card">
          <div className="card-header">
            <div>
              <h1>Tasks</h1>
              <p className="card-subtitle">
                Select a workspace before managing tasks.
              </p>
            </div>
          </div>

          <div className="empty-state">
            Please create or select a workspace first.
          </div>
        </section>
      </>
    );
  }

  return <TasksRouteContent controller={controller} />;
}
