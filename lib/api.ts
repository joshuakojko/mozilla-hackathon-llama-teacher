import { Message, ChatCompletionRequest } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function createChatCompletion(messages: Message[]) {
  const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'default',
      messages,
      stream: false,
    } as ChatCompletionRequest),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to create chat completion');
  }

  return response.json();
}

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  console.log('Preparing to upload:', {
    fileName: file.name,
    fileSize: file.size,
    endpoint: `${API_BASE_URL}/v1/encode`
  });

  try {
    const response = await fetch(`${API_BASE_URL}/v1/encode`, {
      method: 'POST',
      body: formData,
    });

    console.log('Upload response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Upload failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.detail || 'Failed to upload document');
    }

    const result = await response.json();
    console.log('Upload success:', result);
    return result;
  } catch (error) {
    console.error('Upload error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function generateMindmap({ prompt, context }: { prompt: string; context?: string }) {
  const response = await fetch(`${API_BASE_URL}/v1/generate-mindmap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, context }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to generate mindmap');
  }

  return response.json();
} 