import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg p-4',
        message.role === 'user'
          ? 'bg-primary/10 ml-auto max-w-[80%]'
          : message.role === 'assistant'
          ? 'bg-muted mr-auto max-w-[80%]'
          : 'bg-secondary/10 max-w-[80%]'
      )}
    >
      <div className="text-xs font-medium text-muted-foreground">
        {message.role.charAt(0).toUpperCase() + message.role.slice(1)}
      </div>
      <div className="whitespace-pre-wrap break-words text-sm">
        {message.content || '...'}
      </div>
    </div>
  );
} 