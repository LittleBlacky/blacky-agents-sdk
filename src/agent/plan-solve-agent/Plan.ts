import {LLMClient} from "../../core/llm";
import type {AgentRuntimeOptions} from "../types";
import type {LLMMessage} from "../../core/types";
import {formatPrompt} from "../../utils";
import {PLAN_PROMPT_TEMPLATE} from "./prompts";

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
    const planPrompt = formatPrompt(PLAN_PROMPT_TEMPLATE, {question: input});
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
