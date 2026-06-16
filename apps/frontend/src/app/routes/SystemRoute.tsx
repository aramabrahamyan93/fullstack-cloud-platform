import { SystemStatus } from "../../shared/components/SystemStatus";
import { Message } from "../../shared/components/Message";
import type { AppController } from "../hooks/useAppController";

type SystemRouteProps = {
  controller: AppController;
};

export function SystemRoute({ controller }: SystemRouteProps) {
  return (
    <>
      <Message message={controller.message} />

      <section className="page-header">
        <div>
          <h1>System Status</h1>
          <p className="card-subtitle">
            Backend health, API base URL, and current application version.
          </p>
        </div>
      </section>

      <SystemStatus
        health={controller.health}
        version={controller.version}
      />
    </>
  );
}
