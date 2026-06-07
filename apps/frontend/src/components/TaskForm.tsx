import { FormEvent, useState } from "react";
import type { TaskStatus } from "../types/task";

type TaskFormProps = {
  isSubmitting: boolean;
  onCreateTask: (title: string, status: TaskStatus) => Promise<void>;
};

const DEFAULT_TITLE = "Created from React frontend";

export function TaskForm({ isSubmitting, onCreateTask }: TaskFormProps) {
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [status, setStatus] = useState<TaskStatus>("open");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    await onCreateTask(trimmedTitle, status);
    setTitle("");
    setStatus("open");
  }

  return (
    <section className="card">
      <h2>Create Task</h2>

      <form className="form-row" onSubmit={handleSubmit}>
        <input
          type="text"
          maxLength={200}
          placeholder="Task title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as TaskStatus)}
        >
          <option value="open">open</option>
          <option value="in_progress">in_progress</option>
          <option value="done">done</option>
        </select>

        <button type="submit" disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? "Creating..." : "Create task"}
        </button>
      </form>
    </section>
  );
}