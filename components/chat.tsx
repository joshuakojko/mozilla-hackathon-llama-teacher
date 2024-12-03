import { useChat, Message as AiMessage } from "ai/react";
import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkmapComponent } from "./mindmap-view";
import { ChatSidebar } from "./chat-sidebar";
import { ChatHistory, Message } from "@/lib/types";
import * as api from "@/lib/actions/chat";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "./file-upload";

export function Chat() {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const { messages, append, setMessages } = useChat({});
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [roadmapData, setRoadmapData] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    console.log("Component mounted, loading chat history");
    loadChatHistory();
    setIsInitialLoad(false);
  }, []);

  const loadChatHistory = async () => {
    try {
      const chats = await api.getUserChats();
      if (Array.isArray(chats) && chats.length > 0) {
        console.log("Chat successfully initialized", chats);
        setChatHistory(chats);
        if (isInitialLoad && !currentChatId) {
          await handleSelectChat(chats[0].chat_id);
        }
      } else {
        console.log("No existing chats found, creating new chat...");
        const newChat = await api.createChat(new Date().toLocaleDateString());
        console.log("New chat created:", newChat);
        await loadChatHistory();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load chat history";
      console.error("Error loading chat history:", errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSelectChat = async (id: string) => {
    try {
      if (!id) {
        console.error("Invalid chat ID:", id);
        return;
      }

      console.log("Selected chat ID:", id);
      setCurrentChatId(id);

      const dbMessages = await api.getChatMessages(id);
      console.log("Loaded messages:", dbMessages);

      if (Array.isArray(dbMessages) && dbMessages.length > 0) {
        const formattedMessages = dbMessages.map(
          (msg) =>
            ({
              id: msg.message_id.toString(),
              role: msg.role,
              content: msg.content,
            } as AiMessage)
        );

        setMessages(formattedMessages);
      }

      if (!isInitialLoad) {
        await loadChatHistory();
      }
    } catch (error) {
      console.error("Error loading chat:", error);
      toast({
        title: "Error",
        description: "Failed to load chat",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (message: string) => {
    try {
      if (!currentChatId) {
        const newChat = await api.createChat("New Chat");
        setCurrentChatId(newChat.chat_id);
        await loadChatHistory();
      }

      const userMessage: Message = {
        role: "user",
        content: message,
      };

      await append({
        role: "user",
        content: message,
      } as AiMessage);

      const chatId = currentChatId!;
      const response = await api.chatCompletion(chatId, [
        ...messages.map(
          (msg) =>
            ({
              role: msg.role === "data" ? "system" : msg.role,
              content: msg.content,
            } as Message)
        ),
        userMessage,
      ]);

      await append({
        role: "assistant",
        content: response.message,
      } as AiMessage);

      await loadChatHistory();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleNewChat = async () => {
    try {
      const newChat = await api.createChat("New Chat");
      console.log("Created new chat:", newChat);

      if (newChat && newChat.chat_id) {
        await loadChatHistory();
      } else {
        throw new Error("Failed to create new chat");
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, roadmapData]);

  const handleGenerateRoadmap = async () => {
    try {
      if (!currentChatId) {
        toast({
          title: "Error",
          description: "Please start a chat first",
          variant: "destructive",
        });
        return;
      }

      const response = await api.generateRoadmap(currentChatId);

      setRoadmapData(response.message);
      await append({
        role: "assistant",
        content: "Here's your learning roadmap:",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate roadmap",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative flex h-full flex-col">
      <ChatSidebar
        chatHistory={chatHistory}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />
      <div className="min-h-screen bg-background flex flex-col items-center px-4">
        <header className="w-full max-w-3xl text-center py-8 space-y-2">
          <h1 className="text-4xl font-bold">Llama Teacher</h1>
          <p className="text-lg text-muted-foreground">
            Your personalized AI learning assistant. Completely local.
          </p>
        </header>
        <main className="w-full max-w-3xl flex-1 flex flex-col">
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-6 pb-6">
              {messages.map((message) => {
                const isRoadmapMessage =
                  message.content === "Here's your learning roadmap:";
                return (
                  <div key={message.id}>
                    <ChatMessage
                      role={message.role as "assistant" | "user"}
                      content={message.content}
                    />
                    {isRoadmapMessage && roadmapData && (
                      <div className="mt-4">
                        <MarkmapComponent markdown={roadmapData} />
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm p-4">
            <ChatInput
              onSendMessage={handleSendMessage}
              onGenerateRoadmap={handleGenerateRoadmap}
            />
            <FileUpload currentChatId={currentChatId} />
          </div>
        </main>
      </div>
    </div>
  );
}
