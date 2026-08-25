import "./TaskItem.css";
import { useState } from "react";
import type { Task, TaskStatus } from "../types";

type TaskItemProps = {
  task: Task;
  isMutating: boolean;
  isReadOnly?: boolean;
  readOnlyReason?: string;
  onUpdateTask: (
    taskId: number,
    title: string,
    status: TaskStatus
  ) => Promise<void>;
  onDeleteTask: (taskId: number) => Promise<void>;
};

export function TaskItem({
  task,
  isMutating,
  isReadOnly = false,
  readOnlyReason,
  onUpdateTask,
  onDeleteTask
}: TaskItemProps) {
  const [title, setTitle] = useState(task.title);
  const [status, setStatus] = useState<TaskStatus>(task.status);

  const hasChanges = title.trim() !== task.title || status !== task.status;
  const canSave =
    title.trim().length > 0 && hasChanges && !isMutating && !isReadOnly;

  async function handleSave() {
    if (isReadOnly) {
      return;
    }

    await onUpdateTask(task.id, title.trim(), status);
  }

  async function handleDelete() {
    if (isReadOnly) {
      return;
    }

    await onDeleteTask(task.id);
  }

  return (
    <li className="task-item" title={isReadOnly ? readOnlyReason : undefined}>
      <span className="task-id">#{task.id}</span>

      <input
        type="text"
        maxLength={200}
        value={title}
        disabled={isMutating || isReadOnly}
        onChange={(event) => setTitle(event.target.value)}
      />

      <select
        value={status}
        disabled={isMutating || isReadOnly}
        onChange={(event) => setStatus(event.target.value as TaskStatus)}
      >
        <option value="open">open</option>
        <option value="in_progress">in_progress</option>
        <option value="done">done</option>
      </select>

      <div className="task-actions">
        <button type="button" disabled={!canSave} onClick={handleSave}>
          Save
        </button>

        <button
          type="button"
          className="danger"
          disabled={isMutating || isReadOnly}
          onClick={handleDelete}
        >
          {isReadOnly ? "Read-only" : "Delete"}
        </button>
      </div>
    </li>
  );
}