import { TasksPage } from "../../features/tasks/components/TasksPage";
import { Message } from "../../shared/components/Message";
import type { AppController } from "../hooks/useAppController";
import { useWorkspaceRouteContext } from "./useWorkspaceRouteContext";

type WorkspaceTasksRouteProps = {
  controller: AppController;
};

export function WorkspaceTasksRoute({ controller }: WorkspaceTasksRouteProps) {
  const { routeWorkspace, isLoadingWorkspaceContext } =
    useWorkspaceRouteContext({
      controller,
      loadTasks: true
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
