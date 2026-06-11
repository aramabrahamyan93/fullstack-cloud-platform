import { useState } from "react";
import type {
  MessageState,
  MessageType
} from "../../shared/components/Message";

const INITIAL_MESSAGE: MessageState = {
  text: "",
  type: "muted"
};

export function useAppMessage() {
  const [message, setMessage] = useState<MessageState>(INITIAL_MESSAGE);

  function showMessage(text: string, type: MessageType): void {
    setMessage({
      text,
      type
    });
  }

  function clearMessage(): void {
    setMessage(INITIAL_MESSAGE);
  }

  return {
    message,
    showMessage,
    clearMessage
  };
}
