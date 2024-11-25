'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/file-upload';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/components/chat-message';
import { MindmapView } from '@/components/mindmap-view';
import { Message } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createChatCompletion, generateMindmap, uploadDocument } from '@/lib/api';

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Hi, I'm Llama Tutor, a personalized learning assistant. Feel free to ask me questions about homework, lecture notes, or upcoming tests!"
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mindmapMarkdown, setMindmapMarkdown] = useState('');
  const { toast } = useToast();

  const handleUpload = async (file: File) => {
    try {
      const result = await uploadDocument(file);
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Document "${file.name}" has been processed and is ready for querying.`,
      }]);
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await createChatCompletion([...messages, userMessage]);
      setMessages(prev => [...prev, result.message]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMindmap = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const result = await generateMindmap({
        prompt: input,
        context: messages.map(m => m.content).join('\n'),
      });
      setMindmapMarkdown(result.markdown);
    } catch (error) {
      console.error('Mindmap error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate mindmap',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto p-4">
      <FileUpload onUpload={handleUpload} />
      
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="mindmap">Learning Roadmap</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <ScrollArea className="h-[500px] rounded-lg border p-4">
            {messages.map((message, i) => (
              <ChatMessage key={i} message={message} />
            ))}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="mindmap" className="mt-4">
          <MindmapView markdown={mindmapMarkdown} />
        </TabsContent>

        <div className="flex gap-2 mt-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask questions or request a learning roadmap..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
            >
              Chat
            </Button>
            <Button 
              onClick={handleGenerateMindmap}
              disabled={isLoading}
              variant="secondary"
            >
              Generate Roadmap
            </Button>
          </div>
        </div>
      </Tabs>
    </div>
  );
}