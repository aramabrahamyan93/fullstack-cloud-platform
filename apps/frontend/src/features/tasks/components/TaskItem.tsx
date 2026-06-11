import "./TaskItem.css";
import { useState } from "react";
import type { Task, TaskStatus } from "../types";

type TaskItemProps = {
  task: Task;
  isMutating: boolean;
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
  onUpdateTask,
  onDeleteTask
}: TaskItemProps) {
  const [title, setTitle] = useState(task.title);
  const [status, setStatus] = useState<TaskStatus>(task.status);

  const hasChanges = title.trim() !== task.title || status !== task.status;
  const canSave = title.trim().length > 0 && hasChanges && !isMutating;

  async function handleSave() {
    await onUpdateTask(task.id, title.trim(), status);
  }

  async function handleDelete() {
    await onDeleteTask(task.id);
  }

  return (
    <li className="task-item">
      <span className="task-id">#{task.id}</span>

      <input
        type="text"
        maxLength={200}
        value={title}
        disabled={isMutating}
        onChange={(event) => setTitle(event.target.value)}
      />

      <select
        value={status}
        disabled={isMutating}
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
          disabled={isMutating}
          onClick={handleDelete}
        >
          Delete
        </button>
      </div>
    </li>
  );
}