/** 配置管理 */

export interface ConfigShape {
  defaultModel: string;
  defaultProvider: string;
  temperature: number;
  maxTokens: number | null;
  debug: boolean;
  logLevel: string;
  maxHistoryLength: number;
}

export class Config implements ConfigShape {
  // LLM 配置
  defaultModel = "gpt-3.5-turbo";
  defaultProvider = "openai";
  temperature = 0.7;
  maxTokens: number | null = null;

  // 系统配置
  debug = false;
  logLevel = "INFO";

  // 其他配置
  maxHistoryLength = 100;

  constructor(overrides: Partial<ConfigShape> = {}) {
    Object.assign(this, overrides);
  }

  /** 从环境变量创建配置 */
  static fromEnv(env: NodeJS.ProcessEnv = process.env): Config {
    const maxTokensRaw = env.MAX_TOKENS;

    return new Config({
      debug: (env.DEBUG ?? "false").toLowerCase() === "true",
      logLevel: env.LOG_LEVEL ?? "INFO",
      temperature: Number.parseFloat(env.TEMPERATURE ?? "0.7"),
      maxTokens: maxTokensRaw ? Number.parseInt(maxTokensRaw, 10) : null,
    });
  }

  /** 转换为字典 */
  toDict(): ConfigShape {
    return {
      defaultModel: this.defaultModel,
      defaultProvider: this.defaultProvider,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      debug: this.debug,
      logLevel: this.logLevel,
      maxHistoryLength: this.maxHistoryLength,
    };
  }
}
