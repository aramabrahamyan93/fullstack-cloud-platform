import { useMemo, useState } from "react";
import {
  createTask,
  deleteTask,
  getTasks,
  updateTask
} from "../api/tasks";
import { getErrorMessage } from "../api/errors";
import type {
  Task,
  TaskStatus,
  TaskStatusCounters,
  TaskStatusFilter
} from "../types/task";

export type TaskActionResult = {
  success: boolean;
  message: string;
};

export type UseTasksResult = {
  tasks: Task[];
  filteredTasks: Task[];
  taskStatusFilter: TaskStatusFilter;
  taskCounters: TaskStatusCounters;
  isTasksLoading: boolean;
  isSubmitting: boolean;
  isMutating: boolean;
  setTaskStatusFilter: (statusFilter: TaskStatusFilter) => void;
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

const INITIAL_TASK_COUNTERS: TaskStatusCounters = {
  all: 0,
  open: 0,
  in_progress: 0,
  done: 0
};

export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStatusFilter, setTaskStatusFilter] =
    useState<TaskStatusFilter>("all");
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const taskCounters = useMemo(() => {
    return tasks.reduce<TaskStatusCounters>(
      (counters, task) => {
        counters.all += 1;
        counters[task.status] += 1;

        return counters;
      },
      { ...INITIAL_TASK_COUNTERS }
    );
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (taskStatusFilter === "all") {
      return tasks;
    }

    return tasks.filter((task) => task.status === taskStatusFilter);
  }, [tasks, taskStatusFilter]);

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
    setTaskStatusFilter("all");
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
    filteredTasks,
    taskStatusFilter,
    taskCounters,
    isTasksLoading,
    isSubmitting,
    isMutating,
    setTaskStatusFilter,
    loadTasks,
    clearTasks,
    createUserTask,
    updateUserTask,
    deleteUserTask
  };
}