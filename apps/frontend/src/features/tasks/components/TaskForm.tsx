import "./TaskForm.css";
import { FormEvent, useState } from "react";
import type { TaskStatus } from "../types";

type TaskFormProps = {
  isSubmitting: boolean;
  isReadOnly?: boolean;
  readOnlyReason?: string;
  onCreateTask: (title: string, status: TaskStatus) => Promise<void>;
};

const DEFAULT_TITLE = "Created from React frontend";

export function TaskForm({
  isSubmitting,
  isReadOnly = false,
  readOnlyReason,
  onCreateTask
}: TaskFormProps) {
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [status, setStatus] = useState<TaskStatus>("open");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (isReadOnly) {
      return;
    }

    if (!trimmedTitle) {
      return;
    }

    await onCreateTask(trimmedTitle, status);
    setTitle("");
    setStatus("open");
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Create Task</h2>
          <p className="card-subtitle">
            New tasks are attached to the selected workspace.
          </p>
        </div>
      </div>

      <form className="form-row task-form" onSubmit={handleSubmit}>
        <label className="form-field task-title-field">
          Title
          <input
            type="text"
            maxLength={200}
            placeholder="Task title"
            value={title}
            disabled={isReadOnly || isSubmitting}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label className="form-field task-status-field">
          Status
          <select
            value={status}
            disabled={isReadOnly || isSubmitting}
            onChange={(event) => setStatus(event.target.value as TaskStatus)}
          >
            <option value="open">open</option>
            <option value="in_progress">in_progress</option>
            <option value="done">done</option>
          </select>
        </label>

        <button type="submit" disabled={isReadOnly || isSubmitting || !title.trim()}>
          {isReadOnly ? "Read-only" : isSubmitting ? "Creating..." : "Create task"}
        </button>
      </form>
    </section>
  );
}