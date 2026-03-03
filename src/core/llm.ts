import OpenAI from "openai";
import type {ChatCompletionMessageParam} from "openai/resources/chat/completions";
import type {LLMMessage, LLMOptions} from "./types";

function toChatMessages(messages: LLMMessage[]): ChatCompletionMessageParam[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export class LLMClient {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(options: LLMOptions = {}) {
    const model = options.model ?? process.env.LLM_MODEL_ID;
    const apiKey = options.apiKey ?? process.env.LLM_API_KEY;
    const baseURL = options.baseURL ?? process.env.LLM_BASE_URL;
    const timeoutMs =
      options.timeoutMs ?? Number(process.env.LLM_TIMEOUT ?? 60) * 1000;

    if (!model || !apiKey || !baseURL) {
      throw new Error(
        "LLM_MODEL_ID, LLM_API_KEY, LLM_BASE_URL 必须在参数或 .env 中提供",
      );
    }

    this.model = model;
    this.client = new OpenAI({
      apiKey,
      baseURL,
      timeout: timeoutMs,
    });
  }

  async think(messages: LLMMessage[], temperature = 0): Promise<string> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: toChatMessages(messages),
      temperature,
      stream: true,
    });

    let fullText = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      fullText += delta;
    }

    return fullText;
  }
}
