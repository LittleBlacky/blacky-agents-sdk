import type {LLMMessage} from "../core/types";

export interface AgentRuntimeOptions {
  maxSteps?: number;
  temperature?: number;
}

export interface AgentRunResult {
  output: string;
  steps: string[];
  messages: LLMMessage[];
}

