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
        <h2>Tasks</h2>
        <p className="muted">Loading tasks...</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Tasks</h2>

      {tasks.length === 0 ? (
        <p className="muted">No tasks yet.</p>
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