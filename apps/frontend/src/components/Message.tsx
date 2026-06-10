export type MessageType = "muted" | "success" | "error";

export type MessageState = {
  text: string;
  type: MessageType;
};

type MessageProps = {
  message: MessageState;
};

export function Message({ message }: MessageProps) {
  if (!message.text) {
    return null;
  }

  return <p className={`message ${message.type}`}>{message.text}</p>;
}