export type AppView = "dashboard" | "tasks" | "organizations" | "system";

export type NavigationItem = {
  id: AppView;
  label: string;
  description: string;
};

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Overview"
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "Task management"
  },
  {
    id: "organizations",
    label: "Workspaces",
    description: "Organizations"
  },
  {
    id: "system",
    label: "System Status",
    description: "Health and version"
  }
];
