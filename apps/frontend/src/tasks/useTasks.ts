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
  taskStatusFilter: TaskStatusFilter;
  taskCounters: TaskStatusCounters;
  currentPage: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  isTasksLoading: boolean;
  isSubmitting: boolean;
  isMutating: boolean;
  changeTaskStatusFilter: (
    statusFilter: TaskStatusFilter
  ) => Promise<TaskActionResult>;
  goToPreviousTaskPage: () => Promise<TaskActionResult>;
  goToNextTaskPage: () => Promise<TaskActionResult>;
  loadTasks: (
    statusFilter?: TaskStatusFilter,
    page?: number,
    refreshCounters?: boolean
  ) => Promise<TaskActionResult>;
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

const DEFAULT_PAGE_SIZE = 5;
const COUNTER_TASK_LIMIT = 100;

export function useTasks(): UseTasksResult {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStatusFilter, setTaskStatusFilter] =
    useState<TaskStatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const taskCounters = useMemo(() => {
    return allTasks.reduce<TaskStatusCounters>(
      (counters, task) => {
        counters.all += 1;
        counters[task.status] += 1;

        return counters;
      },
      { ...INITIAL_TASK_COUNTERS }
    );
  }, [allTasks]);

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = tasks.length === DEFAULT_PAGE_SIZE;

  async function loadTasks(
    statusFilter: TaskStatusFilter = taskStatusFilter,
    page: number = currentPage,
    refreshCounters: boolean = true
  ): Promise<TaskActionResult> {
    setIsTasksLoading(true);

    try {
      const offset = (page - 1) * DEFAULT_PAGE_SIZE;

      const visibleTaskListPromise = getTasks({
        statusFilter,
        limit: DEFAULT_PAGE_SIZE,
        offset
      });

      const allTaskListPromise = refreshCounters
        ? getTasks({
            statusFilter: "all",
            limit: COUNTER_TASK_LIMIT,
            offset: 0
          })
        : Promise.resolve(allTasks);

      const [visibleTaskList, allTaskList] = await Promise.all([
        visibleTaskListPromise,
        allTaskListPromise
      ]);

      setTasks(visibleTaskList);
      setAllTasks(allTaskList);
      setTaskStatusFilter(statusFilter);
      setCurrentPage(page);

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

  async function changeTaskStatusFilter(
    statusFilter: TaskStatusFilter
  ): Promise<TaskActionResult> {
    return loadTasks(statusFilter, 1, false);
  }

  async function goToPreviousTaskPage(): Promise<TaskActionResult> {
    if (!hasPreviousPage) {
      return {
        success: true,
        message: "Already on the first page."
      };
    }

    return loadTasks(taskStatusFilter, currentPage - 1, false);
  }

  async function goToNextTaskPage(): Promise<TaskActionResult> {
    if (!hasNextPage) {
      return {
        success: true,
        message: "Already on the last loaded page."
      };
    }

    return loadTasks(taskStatusFilter, currentPage + 1, false);
  }

  function clearTasks(): void {
    setAllTasks([]);
    setTasks([]);
    setTaskStatusFilter("all");
    setCurrentPage(1);
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

      await loadTasks(taskStatusFilter, currentPage, true);

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

      await loadTasks(taskStatusFilter, currentPage, true);

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
      await loadTasks(taskStatusFilter, currentPage, true);

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
    taskStatusFilter,
    taskCounters,
    currentPage,
    pageSize: DEFAULT_PAGE_SIZE,
    hasPreviousPage,
    hasNextPage,
    isTasksLoading,
    isSubmitting,
    isMutating,
    changeTaskStatusFilter,
    goToPreviousTaskPage,
    goToNextTaskPage,
    loadTasks,
    clearTasks,
    createUserTask,
    updateUserTask,
    deleteUserTask
  };
}