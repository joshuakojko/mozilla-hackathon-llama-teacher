'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { uploadDocument } from '@/lib/api';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('File selected:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    setIsLoading(true);
    try {
      console.log('Starting file upload...');
      const result = await uploadDocument(file);
      console.log('Upload result:', result);
      
      await onUpload(file);
      console.log('onUpload callback completed');
      
      toast({
        title: 'Success',
        description: result.message || 'File uploaded and processed successfully',
      });
    } catch (error) {
      console.error('Failed to process file:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process file',
        variant: 'destructive',
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
      {isLoading && <span className="text-sm text-muted-foreground">Processing...</span>}
    </div>
  );
} 