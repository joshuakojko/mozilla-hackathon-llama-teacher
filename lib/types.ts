export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatCompletionRequest = {
  model: string;
  messages: Message[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
};

export interface ChatCompletionResponse {
  message: {
    role: string;
    content: string;
  };
}

export interface UploadResponse {
  success: boolean;
  message: string;
}