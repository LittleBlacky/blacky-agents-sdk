import {Message} from "./message";
import {LLMClient} from "./llm";
import {Config} from "./config";

/** Agent 基类 */
export abstract class Agent {
  protected readonly name: string;
  protected readonly llm: LLMClient;
  protected readonly systemPrompt?: string;
  protected readonly config: Config;
  protected readonly history: Message[] = [];

  constructor(params: {
    name: string;
    llm: LLMClient;
    systemPrompt?: string;
    config?: Config;
  }) {
    this.name = params.name;
    this.llm = params.llm;
    this.systemPrompt = params.systemPrompt;
    this.config = params.config ?? new Config();
  }

  /** 运行 Agent */
  abstract run(inputText: string, ...args: unknown[]): Promise<string> | string;

  /** 添加消息到历史记录 */
  addMessage(message: Message): void {
    this.history.push(message);
  }

  /** 清空历史记录 */
  clearHistory(): void {
    this.history.length = 0;
  }

  /** 获取历史记录 */
  getHistory(): Message[] {
    return [...this.history];
  }

  toString(): string {
    const provider = this.config.defaultProvider;
    return `Agent(name=${this.name}, provider=${provider})`;
  }
}
