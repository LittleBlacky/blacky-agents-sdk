export type LLMRole = "system" | "user" | "assistant";

export interface LLMMessage {
  role: LLMRole;
  content: string;
}

export interface LLMOptions {
  model?: string;
  apiKey?: string;
  baseURL?: string;
  timeoutMs?: number;
}

