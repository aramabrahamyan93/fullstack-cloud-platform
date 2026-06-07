import type { Task } from "../types/task";

type TaskListProps = {
  tasks: Task[];
  isLoading: boolean;
};

export function TaskList({ tasks, isLoading }: TaskListProps) {
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
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              #{task.id} - {task.title} ({task.status})
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}