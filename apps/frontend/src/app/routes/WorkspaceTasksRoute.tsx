import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TasksPage } from "../../features/tasks/components/TasksPage";
import { Message } from "../../shared/components/Message";
import type { AppController } from "../hooks/useAppController";

type WorkspaceTasksRouteProps = {
  controller: AppController;
};

export function WorkspaceTasksRoute({ controller }: WorkspaceTasksRouteProps) {
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const numericWorkspaceId = Number(workspaceId);
  const isValidWorkspaceId =
    Number.isInteger(numericWorkspaceId) && numericWorkspaceId > 0;

  const routeWorkspace = controller.organizations.find(
    (organization) => organization.id === numericWorkspaceId
  );

  useEffect(() => {
    if (!workspaceId || !isValidWorkspaceId) {
      controller.showMessage("Invalid workspace route.", "error");
      navigate("/workspaces", { replace: true });
      return;
    }

    if (controller.isAuthLoading || controller.isOrganizationsLoading) {
      return;
    }

    if (!controller.currentUser) {
      return;
    }

    if (controller.organizations.length === 0) {
      return;
    }

    if (!routeWorkspace) {
      controller.showMessage("Workspace was not found.", "error");
      navigate("/workspaces", { replace: true });
      return;
    }

    if (controller.selectedOrganization?.id !== routeWorkspace.id) {
      controller.selectWorkspaceFromRoute(routeWorkspace.id);
    }

    if (controller.activeTaskOrganizationId !== routeWorkspace.id) {
      void controller.loadWorkspaceTasks(routeWorkspace.id);
    }
  }, [
    workspaceId,
    isValidWorkspaceId,
    routeWorkspace?.id,
    controller.isAuthLoading,
    controller.isOrganizationsLoading,
    controller.currentUser,
    controller.organizations.length,
    controller.selectedOrganization?.id,
    controller.activeTaskOrganizationId
  ]);

  if (controller.isAuthLoading || controller.isOrganizationsLoading) {
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
      <TasksPage
        currentUserExists={false}
        message={controller.message}
        tasks={controller.tasks}
        taskStatusFilter={controller.taskStatusFilter}
        taskSearch={controller.taskSearch}
        taskCounters={controller.taskCounters}
        currentPage={controller.currentPage}
        pageSize={controller.pageSize}
        pageSizeOptions={controller.pageSizeOptions}
        totalItems={controller.totalItems}
        totalPages={controller.totalPages}
        hasPreviousPage={controller.hasPreviousPage}
        hasNextPage={controller.hasNextPage}
        isTasksLoading={controller.isTasksLoading}
        isSubmitting={controller.isSubmitting}
        isMutating={controller.isMutating}
        onCreateTask={controller.handleCreateTask}
        onFilterChange={controller.handleTaskStatusFilterChange}
        onPreviousPage={controller.handlePreviousTaskPage}
        onNextPage={controller.handleNextTaskPage}
        onPageSizeChange={controller.handleTaskPageSizeChange}
        onSearch={controller.handleTaskSearch}
        onClearSearch={controller.handleClearTaskSearch}
        onUpdateTask={controller.handleUpdateTask}
        onDeleteTask={controller.handleDeleteTask}
      />
    );
  }

  if (!controller.selectedOrganization) {
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

  return (
    <TasksPage
      currentUserExists={Boolean(controller.currentUser)}
      message={controller.message}
      tasks={controller.tasks}
      taskStatusFilter={controller.taskStatusFilter}
      taskSearch={controller.taskSearch}
      taskCounters={controller.taskCounters}
      currentPage={controller.currentPage}
      pageSize={controller.pageSize}
      pageSizeOptions={controller.pageSizeOptions}
      totalItems={controller.totalItems}
      totalPages={controller.totalPages}
      hasPreviousPage={controller.hasPreviousPage}
      hasNextPage={controller.hasNextPage}
      isTasksLoading={controller.isTasksLoading}
      isSubmitting={controller.isSubmitting}
      isMutating={controller.isMutating}
      onCreateTask={controller.handleCreateTask}
      onFilterChange={controller.handleTaskStatusFilterChange}
      onPreviousPage={controller.handlePreviousTaskPage}
      onNextPage={controller.handleNextTaskPage}
      onPageSizeChange={controller.handleTaskPageSizeChange}
      onSearch={controller.handleTaskSearch}
      onClearSearch={controller.handleClearTaskSearch}
      onUpdateTask={controller.handleUpdateTask}
      onDeleteTask={controller.handleDeleteTask}
    />
  );
}
