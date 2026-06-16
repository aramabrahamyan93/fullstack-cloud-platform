import { TasksPage } from "../../features/tasks/components/TasksPage";
import type { AppController } from "../hooks/useAppController";

type TasksRouteContentProps = {
  controller: AppController;
  currentUserExists?: boolean;
};

export function TasksRouteContent({
  controller,
  currentUserExists = Boolean(controller.currentUser)
}: TasksRouteContentProps) {
  return (
    <TasksPage
      currentUserExists={currentUserExists}
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
