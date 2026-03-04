import {LLMClient} from "../../core/llm";
import type {AgentRuntimeOptions} from "../types";
import type {LLMMessage} from "../../core/types";

const createExecutorPrompt = (
  question: string,
  plan: string[],
  history: string,
  currentStep: string,
) => {
  return `
你是一位顶级的 AI 执行专家。你的任务是严格按照给定的计划，一步步地解决问题。
你将收到原始问题、完整计划、以及到目前为止已完成步骤和结果。
请你专注于解决“当前步骤”，并仅输出该步骤的最终答案，不要输出任何额外解释或对话。

# 原始问题:
${question}

# 完整计划:
${JSON.stringify(plan, null, 2)}

# 历史步骤与结果:
${history || "无"}

# 当前步骤:
${currentStep}

请仅输出针对“当前步骤”的回答:
`;
};

export class Executor {
  constructor(private readonly llmClient: LLMClient) {}

  async execute(
    question: string,
    plan: string[],
    options: AgentRuntimeOptions = {},
  ): Promise<string> {
    let history = "";
    let responseText = "";

    console.log("\n--- 正在执行计划 ---");

    for (const [index, step] of plan.entries()) {
      console.log(`\n-> 正在执行步骤 ${index + 1}/${plan.length}: ${step}`);

      const prompt = createExecutorPrompt(
        question,
        plan,
        history || "无",
        step,
      );

      const messages: LLMMessage[] = [{role: "user", content: prompt}];
      responseText = (await this.llmClient.think(messages, options.temperature ?? 0)) || "";

      history += `步骤 ${index + 1}: ${step}\n结果: ${responseText}\n\n`;

      console.log(`✅ 步骤 ${index + 1} 已完成，结果: ${responseText}`);
    }

    return responseText;
  }
}


