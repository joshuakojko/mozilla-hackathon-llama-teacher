import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Send, Loader2, GitBranch } from 'lucide-react'
import { FileUpload } from "@/components/file-upload";

interface ChatInputProps {
  onSendMessage: (message: string) => void
  onGenerateRoadmap: () => void
  isLoading?: boolean
}

export function ChatInput({ 
  onSendMessage, 
  onGenerateRoadmap, 
  isLoading = false 
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[60px] max-h-[200px] resize-none flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            disabled={isLoading}
          />
          <div className="flex flex-col gap-2">
            <Button 
              type="submit" 
              className="w-auto"
              disabled={!message.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="ml-2">Send</span>
            </Button>
            <Button 
              type="button"
              variant="outline" 
              onClick={onGenerateRoadmap}
              className="w-auto"
              disabled={isLoading}
            >
              <GitBranch className="w-4 h-4 mr-2" />
              Roadmap
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

