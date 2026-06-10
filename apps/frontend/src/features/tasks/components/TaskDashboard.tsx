import type {
  TaskStatusCounters,
  TaskStatusFilter
} from "../types";

type TaskDashboardProps = {
  counters: TaskStatusCounters;
  activeFilter: TaskStatusFilter;
  onFilterChange: (statusFilter: TaskStatusFilter) => Promise<void>;
};

const FILTERS: Array<{
  label: string;
  value: TaskStatusFilter;
}> = [
  {
    label: "All",
    value: "all"
  },
  {
    label: "Open",
    value: "open"
  },
  {
    label: "In progress",
    value: "in_progress"
  },
  {
    label: "Done",
    value: "done"
  }
];

export function TaskDashboard({
  counters,
  activeFilter,
  onFilterChange
}: TaskDashboardProps) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Task Dashboard</h2>
          <p className="card-subtitle">
            Filter your protected tasks by current status.
          </p>
        </div>
      </div>

      <div className="task-filter-grid">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`task-filter-card ${
              activeFilter === filter.value ? "active" : ""
            }`}
            onClick={() => onFilterChange(filter.value)}
          >
            <span className="task-filter-label">{filter.label}</span>
            <span className="task-filter-count">{counters[filter.value]}</span>
          </button>
        ))}
      </div>
    </section>
  );
}