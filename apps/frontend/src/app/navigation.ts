export type AppRouteId = "dashboard" | "workspaces" | "tasks" | "system";

export type NavigationItem = {
  id: AppRouteId;
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
    description: "Workspace tasks"
  },
  {
    id: "workspaces",
    label: "Workspaces",
    description: "Organizations"
  },
  {
    id: "system",
    label: "System Status",
    description: "Health and version"
  }
];
