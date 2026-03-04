import {LLMClient} from "../../core/llm";
import type {AgentRuntimeOptions, AgentRunResult} from "../types";
import {INITIAL_PROMPT_TEMPLATE, REFLECT_PROMPT_TEMPLATE, REFINE_PROMPT_TEMPLATE} from "./prompts";
import {Memory} from "./Memory";
import {formatPrompt} from "../../utils";

export class ReflectionAgent {
  private readonly memory: Memory;

  constructor(
    private readonly llmClient: LLMClient,
    private readonly maxIterations = 3,
  ) {
    this.memory = new Memory();
  }

  async run(
    task: string,
    options: AgentRuntimeOptions = {},
  ): Promise<AgentRunResult> {
    console.log(`\n--- 开始处理任务 ---\n任务: ${task}`);

    console.log("\n--- 正在进行初始尝试 ---");
    const initialPrompt = formatPrompt(INITIAL_PROMPT_TEMPLATE, {task});
    const initialCode = await this._getLLMResponse(initialPrompt, options);
    this.memory.addRecord("execution", initialCode);

    const steps: string[] = ["initial-execution"];

    for (let i = 0; i < this.maxIterations; i += 1) {
      console.log(`\n--- 第 ${i + 1}/${this.maxIterations} 轮迭代 ---`);

      console.log("\n-> 正在进行反思...");
      const lastCode = this.memory.getLastExecution() ?? "";
      const reflectPrompt = formatPrompt(REFLECT_PROMPT_TEMPLATE, {
        task,
        code: lastCode,
      });
      const feedback = await this._getLLMResponse(reflectPrompt, options);
      this.memory.addRecord("reflection", feedback);
      steps.push(`reflection-${i + 1}`);

      if (feedback.includes("无需改进")) {
        console.log("\n✅ 反思认为代码已无需改进，任务完成。");
        steps.push("early-stop");
        break;
      }

      console.log("\n-> 正在进行优化...");
      const refinePrompt = formatPrompt(REFINE_PROMPT_TEMPLATE, {
        task,
        last_code_attempt: lastCode,
        feedback,
      });
      const refinedCode = await this._getLLMResponse(refinePrompt, options);
      this.memory.addRecord("execution", refinedCode);
      steps.push(`refine-${i + 1}`);
    }

    const finalCode = this.memory.getLastExecution() ?? "";
    console.log(`\n--- 任务完成 ---\n最终生成的代码:\n\`\`\`python\n${finalCode}\n\`\`\``);

    return {
      output: finalCode,
      steps,
      messages: [
        {role: "user", content: task},
        {role: "assistant", content: finalCode},
      ],
    };
  }

  private async _getLLMResponse(
    prompt: string,
    options: AgentRuntimeOptions = {},
  ): Promise<string> {
    const messages = [{role: "user" as const, content: prompt}];
    const responseText =
      (await this.llmClient.think(messages, options.temperature ?? 0)) || "";
    return responseText;
  }
}
