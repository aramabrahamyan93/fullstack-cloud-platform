import { AuthPanel } from "../../features/auth/components/AuthPanel";
import { DashboardPage } from "../../features/dashboard/components/DashboardPage";
import { Message } from "../../shared/components/Message";
import type { AppController } from "../hooks/useAppController";

type DashboardRouteProps = {
  controller: AppController;
};

export function DashboardRoute({ controller }: DashboardRouteProps) {
  return (
    <>
      <AuthPanel
        currentUser={controller.currentUser}
        isLoading={controller.isAuthLoading}
        isSubmitting={controller.isAuthSubmitting}
        onLogin={controller.handleLogin}
        onRegister={controller.handleRegister}
        onLogout={controller.handleLogout}
      />

      <Message message={controller.message} />

      <DashboardPage
        currentUser={controller.currentUser}
        taskCounters={controller.taskCounters}
      />
    </>
  );
}
