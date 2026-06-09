import { TaskItem } from "./TaskItem";
import type {
  Task,
  TaskPageSize,
  TaskStatus,
  TaskStatusFilter
} from "../types/task";

type TaskListProps = {
  tasks: Task[];
  activeFilter: TaskStatusFilter;
  currentPage: number;
  pageSize: TaskPageSize;
  pageSizeOptions: TaskPageSize[];
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  isLoading: boolean;
  isMutating: boolean;
  onPreviousPage: () => Promise<void>;
  onNextPage: () => Promise<void>;
  onPageSizeChange: (pageSize: TaskPageSize) => Promise<void>;
  onUpdateTask: (
    taskId: number,
    title: string,
    status: TaskStatus
  ) => Promise<void>;
  onDeleteTask: (taskId: number) => Promise<void>;
};

const FILTER_LABELS: Record<TaskStatusFilter, string> = {
  all: "all",
  open: "open",
  in_progress: "in progress",
  done: "done"
};

export function TaskList({
  tasks,
  activeFilter,
  currentPage,
  pageSize,
  pageSizeOptions,
  totalItems,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  isLoading,
  isMutating,
  onPreviousPage,
  onNextPage,
  onPageSizeChange,
  onUpdateTask,
  onDeleteTask
}: TaskListProps) {
  if (isLoading) {
    return (
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Tasks</h2>
            <p className="card-subtitle">Loading your protected task list...</p>
          </div>
        </div>

        <p className="muted">Loading tasks...</p>
      </section>
    );
  }

  const firstVisibleItemNumber = (currentPage - 1) * pageSize + 1;
  const lastVisibleItemNumber = Math.min(
    firstVisibleItemNumber + tasks.length - 1,
    totalItems
  );

  function handlePageSizeChange(value: string) {
    const nextPageSize = Number(value) as TaskPageSize;

    void onPageSizeChange(nextPageSize);
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Tasks</h2>
          <p className="card-subtitle">
            Showing {FILTER_LABELS[activeFilter]} tasks owned by the signed-in user.
          </p>
        </div>

        <div className="pagination-summary">
          Page {currentPage} of {totalPages}
          {tasks.length > 0
            ? ` · items ${firstVisibleItemNumber}-${lastVisibleItemNumber} of ${totalItems}`
            : ` · ${totalItems} items`}
        </div>
      </div>

      <div className="pagination-toolbar">
        <label className="page-size-selector">
          <span>Page size</span>
          <select
            value={pageSize}
            disabled={isMutating}
            onChange={(event) => handlePageSizeChange(event.target.value)}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          No tasks found for this filter.
        </div>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isMutating={isMutating}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </ul>
      )}

      <div className="pagination-actions">
        <button
          type="button"
          className="secondary"
          disabled={!hasPreviousPage || isMutating}
          onClick={onPreviousPage}
        >
          Previous
        </button>

        <button
          type="button"
          className="secondary"
          disabled={!hasNextPage || isMutating}
          onClick={onNextPage}
        >
          Next
        </button>
      </div>
    </section>
  );
}