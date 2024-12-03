'use server';

import { Message, ChatHistory, ChatCompletionResponse } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getUserChats(): Promise<ChatHistory[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/chats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Failed to get user chats: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(message);
  }
}

export async function getChatHistory(chatId: string): Promise<ChatHistory> {
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to get chat history');
  }

  return response.json();
}

export async function createChat(title: string): Promise<ChatHistory> {
  console.log(`Creating chat with title: ${title}`);
  const response = await fetch(`${API_BASE_URL}/chats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to create chat');
  }

  const data = await response.json();
  return {
    chat_id: data.chat_id,
    title: data.title,
    created_at: data.created_at,
    updated_at: data.updated_at,
    messages: data.messages || []
  };
}

export async function getChatMessages(chatId: string): Promise<Message[]> {
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to get chat messages');
  }

  return response.json();
}

export async function chatCompletion(chatId: string, messages: Message[]): Promise<ChatCompletionResponse> {
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}/completion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'default',
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to create chat completion');
  }

  return response.json();
}

export async function embedDocument(chatId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/chats/${chatId}/embed`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to embed document');
  }

  return response.json();
}

export async function generateRoadmap(chatId: string) {
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}/generate-mindmap`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to generate mindmap');
  }

  return response.json();
}