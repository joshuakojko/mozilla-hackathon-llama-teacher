export interface ChatHistory {
  chat_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface Message {
  message_id: number;
  chat_id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  created_at: string;
  id?: string;
}

export interface ChatCompletionResponse {
  message: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
}