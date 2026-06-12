import "./TaskList.css";
import { useEffect, useState } from "react";
import { TaskItem } from "./TaskItem";
import type {
  Task,
  TaskPageSize,
  TaskStatus,
  TaskStatusFilter
} from "../types";

type TaskListProps = {
  tasks: Task[];
  activeFilter: TaskStatusFilter;
  search: string;
  currentPage: number;
  pageSize: TaskPageSize;
  pageSizeOptions: TaskPageSize[];
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  isLoading: boolean;
  isMutating: boolean;
  onPreviousPage: () => Promise<void>;
  onNextPage: () => Promise<void>;
  onPageSizeChange: (pageSize: TaskPageSize) => Promise<void>;
  onSearch: (search: string) => Promise<void>;
  onClearSearch: () => Promise<void>;
  onUpdateTask: (
    taskId: number,
    title: string,
    status: TaskStatus
  ) => Promise<void>;
  onDeleteTask: (taskId: number) => Promise<void>;
};

const FILTER_LABELS: Record<TaskStatusFilter, string> = {
  all: "all",
  open: "open",
  in_progress: "in progress",
  done: "done"
};

export function TaskList({
  tasks,
  activeFilter,
  search,
  currentPage,
  pageSize,
  pageSizeOptions,
  totalItems,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  isLoading,
  isMutating,
  onPreviousPage,
  onNextPage,
  onPageSizeChange,
  onSearch,
  onClearSearch,
  onUpdateTask,
  onDeleteTask
}: TaskListProps) {
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  if (isLoading) {
    return (
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Tasks</h2>
            <p className="card-subtitle">Loading your protected task list...</p>
          </div>
        </div>

        <p className="muted">Loading tasks...</p>
      </section>
    );
  }

  const firstVisibleItemNumber = (currentPage - 1) * pageSize + 1;
  const lastVisibleItemNumber = Math.min(
    firstVisibleItemNumber + tasks.length - 1,
    totalItems
  );

  const isSearchActive = search.trim().length > 0;

  function handlePageSizeChange(value: string) {
    const nextPageSize = Number(value) as TaskPageSize;

    void onPageSizeChange(nextPageSize);
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void onSearch(searchInput);
  }

  function handleClearSearch() {
    setSearchInput("");

    void onClearSearch();
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Tasks</h2>
          <p className="card-subtitle">
            Showing {FILTER_LABELS[activeFilter]} tasks for the current workspace.
          </p>
        </div>

        <div className="pagination-summary">
          Page {currentPage} of {totalPages}
          {tasks.length > 0
            ? ` · items ${firstVisibleItemNumber}-${lastVisibleItemNumber} of ${totalItems}`
            : ` · ${totalItems} items`}
        </div>
      </div>

      <div className="task-list-toolbar">
        <form className="task-search-form" onSubmit={handleSearchSubmit}>
          <label className="task-search-field">
            <span>Search by title</span>
            <input
              type="search"
              value={searchInput}
              placeholder="Example: docker"
              disabled={isMutating}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>

          <button type="submit" disabled={isMutating}>
            Search
          </button>

          <button
            type="button"
            className="secondary"
            disabled={isMutating || !isSearchActive}
            onClick={handleClearSearch}
          >
            Clear
          </button>
        </form>

        <label className="page-size-selector">
          <span>Page size</span>
          <select
            value={pageSize}
            disabled={isMutating}
            onChange={(event) => handlePageSizeChange(event.target.value)}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isSearchActive ? (
        <p className="task-search-summary">
          Search results for <strong>{search}</strong>
        </p>
      ) : null}

      {tasks.length === 0 ? (
        <div className="empty-state">
          No tasks found for this filter.
        </div>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isMutating={isMutating}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </ul>
      )}

      <div className="pagination-actions">
        <button
          type="button"
          className="secondary"
          disabled={!hasPreviousPage || isMutating}
          onClick={onPreviousPage}
        >
          Previous
        </button>

        <button
          type="button"
          className="secondary"
          disabled={!hasNextPage || isMutating}
          onClick={onNextPage}
        >
          Next
        </button>
      </div>
    </section>
  );
}