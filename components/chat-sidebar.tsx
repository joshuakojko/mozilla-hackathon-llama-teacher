import { Button } from "./ui/button"
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChatHistory } from "@/lib/types"

interface ChatSidebarProps {
  chatHistory: ChatHistory[]
  onSelectChat: (id: string) => void
  onNewChat: () => void
}

export function ChatSidebar({ chatHistory, onSelectChat, onNewChat }: ChatSidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="fixed left-4 top-4 z-40">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-4">
        <div className="flex flex-col gap-4">
          <Button onClick={onNewChat} className="w-full">
            New Chat
          </Button>
          <div className="flex flex-col gap-2">
            {chatHistory.map((chat) => (
              <Button
                key={chat.chat_id}
                variant="ghost"
                className="justify-start text-left"
                onClick={() => onSelectChat(chat.chat_id)}
              >
                {chat.title || 'New Chat'}
              </Button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 