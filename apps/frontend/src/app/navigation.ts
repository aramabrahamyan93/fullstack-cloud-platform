export type AppRouteId =
  | "global_dashboard"
  | "dashboard"
  | "tasks"
  | "members"
  | "settings"
  | "activity"
  | "workspaces"
  | "system";

export type NavigationGroupId = "global" | "workspace";

export type NavigationItem = {
  id: AppRouteId;
  label: string;
  description: string;
  group: NavigationGroupId;
};

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: "global_dashboard",
    label: "Global Dashboard",
    description: "Account overview",
    group: "global"
  },
  {
    id: "system",
    label: "System Status",
    description: "API health",
    group: "global"
  },
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Workspace overview",
    group: "workspace"
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "Workspace tasks",
    group: "workspace"
  },
  {
    id: "members",
    label: "Members",
    description: "Workspace access",
    group: "workspace"
  },
  {
    id: "settings",
    label: "Settings",
    description: "Configuration",
    group: "workspace"
  },
  {
    id: "activity",
    label: "Activity",
    description: "Audit history",
    group: "workspace"
  },
  {
    id: "workspaces",
    label: "Workspaces",
    description: "Create and switch",
    group: "workspace"
  }
];
