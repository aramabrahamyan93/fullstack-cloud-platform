import { fetchJson } from "./client";
import type { CreateTaskRequest, Task } from "../types/task";

export function getTasks(): Promise<Task[]> {
  return fetchJson<Task[]>("/tasks");
}

export function createTask(payload: CreateTaskRequest): Promise<Task> {
  return fetchJson<Task>("/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}