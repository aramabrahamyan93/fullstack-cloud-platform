import { useEffect } from "react";
import { AuthPanel } from "../../features/auth/components/AuthPanel";
import { DashboardPage } from "../../features/dashboard/components/DashboardPage";
import { MyInvitationsPanel } from "../../features/organizations/components/MyInvitationsPanel";
import { Message } from "../../shared/components/Message";
import type { AppController } from "../hooks/useAppController";

type DashboardRouteProps = {
  controller: AppController;
};

export function DashboardRoute({ controller }: DashboardRouteProps) {
  useEffect(() => {
    if (!controller.currentUser) {
      return;
    }

    void controller.loadCurrentUserInvitations();
  }, [controller.currentUser?.id]);

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

      <MyInvitationsPanel
        invitations={controller.myInvitations}
        isLoading={controller.isMyInvitationsLoading}
        isSubmitting={controller.isMyInvitationSubmitting}
        onAccept={controller.handleAcceptMyInvitation}
        onDecline={controller.handleDeclineMyInvitation}
      />

      <DashboardPage
        currentUser={controller.currentUser}
        taskCounters={controller.taskCounters}
      />
    </>
  );
}
