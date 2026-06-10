import { useState } from "react";
import {
  createTask,
  deleteTask,
  getPaginatedTasks,
  getTaskStats,
  updateTask
} from "../api";
import { getErrorMessage } from "../../../shared/api/errors";
import type {
  Task,
  TaskPageSize,
  TaskStatus,
  TaskStatusCounters,
  TaskStatusFilter
} from "../types";

export type TaskActionResult = {
  success: boolean;
  message: string;
};

type LoadTasksOptions = {
  statusFilter?: TaskStatusFilter;
  page?: number;
  refreshCounters?: boolean;
  pageSize?: TaskPageSize;
  search?: string;
};

export type UseTasksResult = {
  tasks: Task[];
  taskStatusFilter: TaskStatusFilter;
  taskSearch: string;
  taskCounters: TaskStatusCounters;
  currentPage: number;
  pageSize: TaskPageSize;
  pageSizeOptions: TaskPageSize[];
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  isTasksLoading: boolean;
  isSubmitting: boolean;
  isMutating: boolean;
  changeTaskStatusFilter: (
    statusFilter: TaskStatusFilter
  ) => Promise<TaskActionResult>;
  changeTaskPageSize: (pageSize: TaskPageSize) => Promise<TaskActionResult>;
  changeTaskSearch: (search: string) => Promise<TaskActionResult>;
  clearTaskSearch: () => Promise<TaskActionResult>;
  goToPreviousTaskPage: () => Promise<TaskActionResult>;
  goToNextTaskPage: () => Promise<TaskActionResult>;
  loadTasks: (options?: LoadTasksOptions) => Promise<TaskActionResult>;
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

const DEFAULT_PAGE_SIZE: TaskPageSize = 5;
const PAGE_SIZE_OPTIONS: TaskPageSize[] = [5, 10, 20];

export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskCounters, setTaskCounters] =
    useState<TaskStatusCounters>(INITIAL_TASK_COUNTERS);
  const [taskStatusFilter, setTaskStatusFilter] =
    useState<TaskStatusFilter>("all");
  const [taskSearch, setTaskSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<TaskPageSize>(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  async function loadTasks(
    options: LoadTasksOptions = {}
  ): Promise<TaskActionResult> {
    const nextStatusFilter = options.statusFilter ?? taskStatusFilter;
    const nextPage = options.page ?? currentPage;
    const shouldRefreshCounters = options.refreshCounters ?? true;
    const nextPageSize = options.pageSize ?? pageSize;
    const nextSearch = options.search ?? taskSearch;

    setIsTasksLoading(true);

    try {
      const normalizedPage = Math.max(1, nextPage);
      const normalizedSearch = nextSearch.trim();
      const offset = (normalizedPage - 1) * nextPageSize;

      const paginatedTasksPromise = getPaginatedTasks({
        statusFilter: nextStatusFilter,
        search: normalizedSearch,
        limit: nextPageSize,
        offset
      });

      const taskStatsPromise = shouldRefreshCounters
        ? getTaskStats()
        : Promise.resolve(taskCounters);

      const [paginatedTasks, stats] = await Promise.all([
        paginatedTasksPromise,
        taskStatsPromise
      ]);

      setTasks(paginatedTasks.items);
      setTaskCounters(stats);
      setTaskStatusFilter(nextStatusFilter);
      setTaskSearch(normalizedSearch);
      setCurrentPage(normalizedPage);
      setPageSize(nextPageSize);
      setTotalItems(paginatedTasks.total);

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
    return loadTasks({
      statusFilter,
      page: 1,
      refreshCounters: false
    });
  }

  async function changeTaskPageSize(
    nextPageSize: TaskPageSize
  ): Promise<TaskActionResult> {
    return loadTasks({
      page: 1,
      refreshCounters: false,
      pageSize: nextPageSize
    });
  }

  async function changeTaskSearch(search: string): Promise<TaskActionResult> {
    return loadTasks({
      page: 1,
      refreshCounters: false,
      search
    });
  }

  async function clearTaskSearch(): Promise<TaskActionResult> {
    return loadTasks({
      page: 1,
      refreshCounters: false,
      search: ""
    });
  }

  async function goToPreviousTaskPage(): Promise<TaskActionResult> {
    if (!hasPreviousPage) {
      return {
        success: true,
        message: "Already on the first page."
      };
    }

    return loadTasks({
      page: currentPage - 1,
      refreshCounters: false
    });
  }

  async function goToNextTaskPage(): Promise<TaskActionResult> {
    if (!hasNextPage) {
      return {
        success: true,
        message: "Already on the last page."
      };
    }

    return loadTasks({
      page: currentPage + 1,
      refreshCounters: false
    });
  }

  function clearTasks(): void {
    setTasks([]);
    setTaskCounters(INITIAL_TASK_COUNTERS);
    setTaskStatusFilter("all");
    setTaskSearch("");
    setCurrentPage(1);
    setPageSize(DEFAULT_PAGE_SIZE);
    setTotalItems(0);
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

      await loadTasks({
        refreshCounters: true
      });

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

      await loadTasks({
        refreshCounters: true
      });

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

      const shouldMoveToPreviousPage = tasks.length === 1 && currentPage > 1;

      await loadTasks({
        page: shouldMoveToPreviousPage ? currentPage - 1 : currentPage,
        refreshCounters: true
      });

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
    taskSearch,
    taskCounters,
    currentPage,
    pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    totalItems,
    totalPages,
    hasPreviousPage,
    hasNextPage,
    isTasksLoading,
    isSubmitting,
    isMutating,
    changeTaskStatusFilter,
    changeTaskPageSize,
    changeTaskSearch,
    clearTaskSearch,
    goToPreviousTaskPage,
    goToNextTaskPage,
    loadTasks,
    clearTasks,
    createUserTask,
    updateUserTask,
    deleteUserTask
  };
}