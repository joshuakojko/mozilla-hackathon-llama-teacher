import { Card, CardContent } from "@/components/ui/card"
import { User, Bot, Terminal } from 'lucide-react'

interface ChatMessageProps {
  role: "assistant" | "user" | "system"
  content: string
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div className={`flex items-start gap-3 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {role === 'assistant' && (
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10">
          <Bot className="w-5 h-5 text-primary" />
        </div>
      )}
      {role === 'system' && (
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
          <Terminal className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <div className={`
        rounded-lg px-4 py-2 max-w-[85%] break-words
        ${role === 'user' 
          ? 'bg-primary text-primary-foreground' 
          : role === 'system'
            ? 'bg-muted/50 text-muted-foreground'
            : 'bg-muted'
        }
      `}>
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
      {role === 'user' && (
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary">
          <User className="w-5 h-5 text-primary-foreground" />
        </div>
      )}
    </div>
  )
}