import {LLMClient} from "../../core/llm";
import type {AgentRunResult, AgentRuntimeOptions} from "../types";
import type {LLMMessage} from "../../core/types";

const createPlanSolvePrompt = (input: string) => {
  return `
你是一个顶级的 AI 规划专家。你的任务是将用户提出的复杂问题分解成由多个简单步骤组成的行动计划。
请确保计划中的每个步骤都是一个独立、可执行的子任务，并且严格按照逻辑顺序排列。

问题: ${input}

请严格按照以下格式输出你的计划（必须包含代码块）：
\`\`\`javascript
["步骤1", "步骤2", "步骤3", ..., "步骤n"]
\`\`\`
`;
};

export class Plan {
  constructor(private readonly llm: LLMClient) {}

  private _parsePlan(output: string): string[] {
    const trimmed = (output || "").trim();

    const codeBlockMatch = trimmed.match(
      /```(?:python|javascript|json)?\s*([\s\S]*?)```/i,
    );
    const candidate = (codeBlockMatch?.[1] ?? trimmed).trim();

    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // ignore JSON parse error and fallback below
    }

    const oneLineArray = candidate.match(/^\[(.*)\]$/s);
    if (oneLineArray) {
      return oneLineArray[1]
        .split(",")
        .map((part) => part.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
    }

    return candidate
      .split("\n")
      .map((line) => line.trim().replace(/^[-*\d.\s]+/, ""))
      .filter(Boolean);
  }

  async run(
    input: string,
    options: AgentRuntimeOptions = {},
  ): Promise<string[]> {
    const planPrompt = createPlanSolvePrompt(input);
    const messages: LLMMessage[] = [{role: "user", content: planPrompt}];

    console.log("--- 正在生成计划 ---");
    const output =
      (await this.llm.think(messages, options.temperature ?? 0)) || "";
    console.log(`✅ 计划已生成:\n${output}`);

    const plan = this._parsePlan(output);
    if (plan.length === 0) {
      console.error("❌ 解析计划失败，返回空计划。原始响应:", output);
    }

    return plan;
  }
}
