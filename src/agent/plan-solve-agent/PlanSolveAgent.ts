import {LLMClient} from "../../core/llm";
import type {AgentRunResult, AgentRuntimeOptions} from "../types";
import {Plan} from "./Plan";
import {Executor} from "./Executor";

export class PlanSolveAgent {
  private readonly planner: Plan;
  private readonly executor: Executor;

  constructor(private readonly llmClient: LLMClient) {
    this.planner = new Plan(this.llmClient);
    this.executor = new Executor(this.llmClient);
  }

  async run(
    question: string,
    options: AgentRuntimeOptions = {},
  ): Promise<AgentRunResult> {
    console.log(`\n--- 开始处理问题 ---\n问题: ${question}`);

    const plan = await this.planner.run(question, options);

    if (!plan || plan.length === 0) {
      console.error("\n--- 任务终止 --- \n无法生成有效的行动计划。");
      return {
        output: "",
        steps: [],
        messages: [
          {
            role: "user",
            content: question,
          },
        ],
      };
    }

    const finalAnswer = await this.executor.execute(question, plan, options);

    console.log(`\n--- 任务完成 ---\n最终答案: ${finalAnswer}`);

    return {
      output: finalAnswer,
      steps: plan,
      messages: [
        {
          role: "user",
          content: question,
        },
        {
          role: "assistant",
          content: finalAnswer,
        },
      ],
    };
  }
}

