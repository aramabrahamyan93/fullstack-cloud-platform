export type AppRouteId =
  | "global_dashboard"
  | "dashboard"
  | "tasks"
  | "members"
  | "workspaces"
  | "system";

export type NavigationItem = {
  id: AppRouteId;
  label: string;
  description: string;
};

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: "global_dashboard",
    label: "Global Dashboard",
    description: "Account overview"
  },
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Workspace overview"
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "Workspace tasks"
  },
  {
    id: "members",
    label: "Members",
    description: "Workspace access"
  },
  {
    id: "workspaces",
    label: "Workspaces",
    description: "Create and switch"
  },
  {
    id: "system",
    label: "System Status",
    description: "API health"
  }
];
