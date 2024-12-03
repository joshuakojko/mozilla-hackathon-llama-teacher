"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { embedDocument } from '@/lib/actions/chat';

interface FileUploadProps {
  currentChatId: string | null;
}

export function FileUpload({ currentChatId }: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!currentChatId) {
      toast({
        title: "Error",
        description: "Please start a chat first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await embedDocument(currentChatId, file);

      toast({
        title: "Success",
        description: "File uploaded and embedded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <Input
        type="file"
        accept=".txt,.md,.json,.pdf"
        onChange={handleFileChange}
        disabled={isLoading}
        className="max-w-xs"
      />
      {isLoading && (
        <span className="text-sm text-muted-foreground">Processing...</span>
      )}
    </div>
  );
}