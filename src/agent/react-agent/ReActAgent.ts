import {ToolExecutor} from "../../tools/ToolExecutor";
import {LLMClient} from "../../core/llm";
import type {AgentRuntimeOptions, AgentRunResult} from "../types";
import {formatPrompt} from "../../utils";
import {REACT_PROMPT_TEMPLATE} from "./prompts";

export class ReActAgent {
  constructor(
    private readonly llmClient: LLMClient,
    private readonly toolExecutor: ToolExecutor,
    private readonly maxSteps = 100,
  ) {}

  private parseOutput(text: string): {thought: string | null; action: string | null} {
    const thoughtMatch = text.match(/Thought:\s*(.*?)(?=\nAction:|$)/s);
    const actionMatch = text.match(/Action:\s*(.*?)$/s);

    return {
      thought: thoughtMatch ? thoughtMatch[1].trim() : null,
      action: actionMatch ? actionMatch[1].trim() : null,
    };
  }

  private parseAction(actionText: string): {name: string | null; input: string | null} {
    const match = actionText.match(/^(\w+)\[(.*)\]$/s);
    if (!match) {
      return {name: null, input: null};
    }

    return {name: match[1], input: match[2]};
  }

  private parseFinish(actionText: string): string | null {
    const match = actionText.match(/^Finish\[(.*)\]$/s);
    return match ? match[1].trim() : null;
  }

  private async executeAction(toolName: string, toolInput: string): Promise<string> {
    const tool = this.toolExecutor.getTool(toolName);
    if (!tool) {
      const message = `工具 ${toolName} 未找到，请检查工具名称是否正确`;
      console.error(message);
      return message;
    }
    return tool.execute(toolInput);
  }

  async run(
    question: string,
    options: AgentRuntimeOptions = {},
  ): Promise<AgentRunResult> {
    const history: string[] = [];
    const messages: AgentRunResult["messages"] = [{role: "user", content: question}];
    const steps: string[] = [];

    for (let currentStep = 1; currentStep <= this.maxSteps; currentStep += 1) {
      console.log(`--- 第 ${currentStep} 步 ---`);

      const prompt = formatPrompt(REACT_PROMPT_TEMPLATE, {
        tools: this.toolExecutor.getAvailableTools() || "无可用工具",
        question,
        history: history.length ? history.join("\n") : "无",
      });

      const response = await this.llmClient.think(
        [{role: "user", content: prompt}],
        options.temperature ?? 0,
      );
      messages.push({role: "assistant", content: response});

      const {thought, action} = this.parseOutput(response);
      if (thought) {
        console.log(`Thought: ${thought}`);
      }

      if (!action) {
        console.error("错误: 未能解析出有效 Action，流程终止");
        steps.push("parse-action-failed");
        break;
      }

      const finalAnswer = this.parseFinish(action);
      if (finalAnswer !== null) {
        console.log(`最终答案: ${finalAnswer}`);
        steps.push("finished");
        return {
          output: finalAnswer,
          steps,
          messages,
        };
      }

      const {name: toolName, input: toolInput} = this.parseAction(action);
      if (!toolName || toolInput === null) {
        console.error("错误: LLM 未能返回有效工具调用格式。");
        history.push(`Action: ${action}`);
        history.push("Observation: 工具调用格式错误");
        steps.push("invalid-tool-action");
        continue;
      }

      console.log(`调用工具: ${toolName}，输入: ${toolInput}`);
      const observation = await this.executeAction(toolName, toolInput);
      console.log(`工具返回结果: ${observation}`);

      history.push(`Action: ${action}`);
      history.push(`Observation: ${observation}`);
      steps.push(`tool:${toolName}`);
    }

    const fallback = "达到最大迭代次数，未能生成最终答案。";
    console.error(fallback);
    return {
      output: fallback,
      steps,
      messages,
    };
  }
}
