import { useState } from "react";
import { getHealth, getVersion } from "../../features/system/api";
import { getErrorMessage } from "../../shared/api/errors";

export function useSystemStatus() {
  const [health, setHealth] = useState("loading...");
  const [version, setVersion] = useState("loading...");

  async function loadSystemStatus(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const [healthResponse, versionResponse] = await Promise.all([
        getHealth(),
        getVersion()
      ]);

      setHealth(healthResponse.status);
      setVersion(versionResponse.version);

      return {
        success: true,
        message: "System status loaded successfully."
      };
    } catch (error) {
      setHealth("error");
      setVersion("error");

      return {
        success: false,
        message: getErrorMessage(error)
      };
    }
  }

  return {
    health,
    version,
    loadSystemStatus
  };
}
