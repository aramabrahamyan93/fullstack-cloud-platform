import { TaskItem } from "./TaskItem";
import type { Task, TaskStatus } from "../types/task";

type TaskListProps = {
  tasks: Task[];
  isLoading: boolean;
  isMutating: boolean;
  onUpdateTask: (
    taskId: number,
    title: string,
    status: TaskStatus
  ) => Promise<void>;
  onDeleteTask: (taskId: number) => Promise<void>;
};

export function TaskList({
  tasks,
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
            Only tasks owned by the signed-in user are shown here.
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          No tasks yet. Create your first protected task above.
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