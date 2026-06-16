import { useEffect } from "react";
import type { MessageType } from "../../shared/components/Message";

type ActionResult = {
  success: boolean;
  message: string;
};

type UseAppBootstrapOptions = {
  loadSystemStatus: () => Promise<ActionResult>;
  restoreCurrentUser: () => Promise<void>;
  showMessage: (text: string, type: MessageType) => void;
};

export function useAppBootstrap({
  loadSystemStatus,
  restoreCurrentUser,
  showMessage
}: UseAppBootstrapOptions): void {
  useEffect(() => {
    async function loadApp(): Promise<void> {
      const [systemResult] = await Promise.all([
        loadSystemStatus(),
        restoreCurrentUser()
      ]);

      if (!systemResult.success) {
        showMessage(systemResult.message, "error");
      }
    }

    void loadApp();
  }, []);
}
