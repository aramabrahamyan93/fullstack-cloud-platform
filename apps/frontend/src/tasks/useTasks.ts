import { useState } from "react";
import {
  createTask,
  deleteTask,
  getTasks,
  updateTask
} from "../api/tasks";
import { getErrorMessage } from "../api/errors";
import type { Task, TaskStatus } from "../types/task";

export type TaskActionResult = {
  success: boolean;
  message: string;
};

export type UseTasksResult = {
  tasks: Task[];
  isTasksLoading: boolean;
  isSubmitting: boolean;
  isMutating: boolean;
  loadTasks: () => Promise<TaskActionResult>;
  clearTasks: () => void;
  createUserTask: (
    title: string,
    status: TaskStatus
  ) => Promise<TaskActionResult>;
  updateUserTask: (
    taskId: number,
    title: string,
    status: TaskStatus
  ) => Promise<TaskActionResult>;
  deleteUserTask: (taskId: number) => Promise<TaskActionResult>;
};

export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  async function loadTasks(): Promise<TaskActionResult> {
    setIsTasksLoading(true);

    try {
      const taskList = await getTasks();
      setTasks(taskList);

      return {
        success: true,
        message: "Tasks loaded successfully."
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsTasksLoading(false);
    }
  }

  function clearTasks(): void {
    setTasks([]);
    setIsTasksLoading(false);
  }

  async function createUserTask(
    title: string,
    status: TaskStatus
  ): Promise<TaskActionResult> {
    setIsSubmitting(true);

    try {
      await createTask({
        title,
        status
      });

      await loadTasks();

      return {
        success: true,
        message: "Task created successfully."
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateUserTask(
    taskId: number,
    title: string,
    status: TaskStatus
  ): Promise<TaskActionResult> {
    setIsMutating(true);

    try {
      await updateTask(taskId, {
        title,
        status
      });

      await loadTasks();

      return {
        success: true,
        message: `Task #${taskId} updated successfully.`
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsMutating(false);
    }
  }

  async function deleteUserTask(taskId: number): Promise<TaskActionResult> {
    setIsMutating(true);

    try {
      await deleteTask(taskId);
      await loadTasks();

      return {
        success: true,
        message: `Task #${taskId} deleted successfully.`
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsMutating(false);
    }
  }

  return {
    tasks,
    isTasksLoading,
    isSubmitting,
    isMutating,
    loadTasks,
    clearTasks,
    createUserTask,
    updateUserTask,
    deleteUserTask
  };
}