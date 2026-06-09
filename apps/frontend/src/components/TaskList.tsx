import { TaskItem } from "./TaskItem";
import type { Task, TaskStatus, TaskStatusFilter } from "../types/task";

type TaskListProps = {
  tasks: Task[];
  activeFilter: TaskStatusFilter;
  isLoading: boolean;
  isMutating: boolean;
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
  isLoading,
  isMutating,
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

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Tasks</h2>
          <p className="card-subtitle">
            Showing {FILTER_LABELS[activeFilter]} tasks owned by the signed-in user.
          </p>
        </div>
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
    </section>
  );
}