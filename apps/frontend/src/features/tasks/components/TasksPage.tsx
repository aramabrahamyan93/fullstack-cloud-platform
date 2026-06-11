import { Message, type MessageState } from "../../../shared/components/Message";
import { TaskDashboard } from "./TaskDashboard";
import { TaskForm } from "./TaskForm";
import { TaskList } from "./TaskList";
import type {
  Task,
  TaskPageSize,
  TaskStatus,
  TaskStatusCounters,
  TaskStatusFilter
} from "../types";

type TasksPageProps = {
  currentUserExists: boolean;
  message: MessageState;
  tasks: Task[];
  taskStatusFilter: TaskStatusFilter;
  taskSearch: string;
  taskCounters: TaskStatusCounters;
  currentPage: number;
  pageSize: TaskPageSize;
  pageSizeOptions: TaskPageSize[];
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  isTasksLoading: boolean;
  isSubmitting: boolean;
  isMutating: boolean;
  onCreateTask: (title: string, status: TaskStatus) => Promise<void>;
  onFilterChange: (statusFilter: TaskStatusFilter) => Promise<void>;
  onPreviousPage: () => Promise<void>;
  onNextPage: () => Promise<void>;
  onPageSizeChange: (pageSize: TaskPageSize) => Promise<void>;
  onSearch: (search: string) => Promise<void>;
  onClearSearch: () => Promise<void>;
  onUpdateTask: (
    taskId: number,
    title: string,
    status: TaskStatus
  ) => Promise<void>;
  onDeleteTask: (taskId: number) => Promise<void>;
};

export function TasksPage({
  currentUserExists,
  message,
  tasks,
  taskStatusFilter,
  taskSearch,
  taskCounters,
  currentPage,
  pageSize,
  pageSizeOptions,
  totalItems,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  isTasksLoading,
  isSubmitting,
  isMutating,
  onCreateTask,
  onFilterChange,
  onPreviousPage,
  onNextPage,
  onPageSizeChange,
  onSearch,
  onClearSearch,
  onUpdateTask,
  onDeleteTask
}: TasksPageProps) {
  if (!currentUserExists) {
    return (
      <>
        <Message message={message} />

        <section className="card">
          <div className="card-header">
            <div>
              <h1>Tasks</h1>
              <p className="card-subtitle">
                Protected task management is available after login.
              </p>
            </div>
          </div>

          <div className="empty-state">
            Please login or register to manage your tasks.
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="page-header">
        <div>
          <h1>Tasks</h1>
          <p className="card-subtitle">
            Create, filter, update, and delete protected tasks.
          </p>
        </div>
      </section>

      <TaskForm
        isSubmitting={isSubmitting}
        onCreateTask={onCreateTask}
      />

      <TaskDashboard
        counters={taskCounters}
        activeFilter={taskStatusFilter}
        onFilterChange={onFilterChange}
      />

      <Message message={message} />

      <TaskList
        tasks={tasks}
        activeFilter={taskStatusFilter}
        search={taskSearch}
        currentPage={currentPage}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        totalItems={totalItems}
        totalPages={totalPages}
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        isLoading={isTasksLoading}
        isMutating={isMutating}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
        onPageSizeChange={onPageSizeChange}
        onSearch={onSearch}
        onClearSearch={onClearSearch}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
      />
    </>
  );
}
