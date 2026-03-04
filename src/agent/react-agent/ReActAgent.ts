import {ToolExecutor} from "../../tools/ToolExecutor";
import {LLMClient} from "../../core/llm";
import type {AgentRuntimeOptions} from "../types";

function createReactPrompt(tools: string, question: string, history: string) {
  return `
  请注意，你是一个有能力调用外部工具的智能助手。

  可用工具如下:
  ${tools}

  请严格按照以下格式进行回应:

  Thought: 你的思考过程，用于分析问题、拆解任务和规划下一步行动。
  Action: 你决定采取的行动，必须是以下格式之一:
  - {tool_name}[{tool_input}]:调用一个可用工具。
  - Finish[{final_answer}]:当你认为已经获得最终答案时。
  - 当你收集到足够的信息，能够回答用户的最终问题时，你必须在Action:字段后使用 Finish[{final_answer}] 来输出最终答案。
  Observation: 这是执行Action后从外部工具返回的结果。

  现在，请开始解决以下问题:
  Question: ${question}
  History: ${history}
  `;
}

export class ReActAgent {
  constructor(
    private readonly llmClient: LLMClient,
    private readonly toolExecutor: ToolExecutor,
    private readonly maxSteps: number = 100,
    private history: string[] = [],
  ) {}

  /**
   * 解析LLM的输出，提取Thought和Action。
   * @param text LLM返回的原始文本
   * @returns [thought, action] 元组，若未匹配到则对应值为 null
   */
  private _parseOutput(text: string): [string | null, string | null] {
    // Thought: 匹配到 Action: 或文本末尾（使用前瞻 (?=\nAction:|$)）
    const thoughtMatch = text.match(/Thought:\s*(.*?)(?=\nAction:|$)/s);
    // Action: 匹配到文本末尾（直接使用 $ 匹配结尾）
    const actionMatch = text.match(/Action:\s*(.*?)$/s);

    const thought = thoughtMatch ? thoughtMatch[1].trim() : null;
    const action = actionMatch ? actionMatch[1].trim() : null;
    return [thought, action];
  }

  /**
   * 解析Action字符串，提取工具名称和输入。
   * @param actionText Action: 后面的字符串
   * @returns [toolName, toolInput] 元组，若格式错误则均为 null
   */
  private _parseAction(actionText: string): [string | null, string | null] {
    const match = actionText.match(/^(\w+)\[(.*)\]$/s);
    if (match) {
      return [match[1], match[2]];
    }
    return [null, null];
  }

  /**
   * 执行工具
   * @param tool_name 工具名称
   * @param tool_input 工具输入
   * @returns 工具返回结果
   */
  private async _execute_action(
    tool_name: string,
    tool_input: string,
  ): Promise<string> {
    const tool = this.toolExecutor.getTool(tool_name);
    if (!tool) {
      console.error(`工具 ${tool_name} 未找到`);
      return `工具 ${tool_name} 未找到，请检查工具名称是否正确`;
    }
    const result = await tool.execute(tool_input);
    return result;
  }

  /**
   * 运行ReactAgent
   * @param input 输入问题
   * @param options 运行选项
   */
  async run(input: string, options: AgentRuntimeOptions = {}): Promise<void> {
    let currentStep = 0;
    this.history = [];
    while (currentStep < this.maxSteps) {
      currentStep += 1;
      console.log(`--- 第 ${currentStep} 步 ---`);
      const toolsDesc = this.toolExecutor.getAvailableTools();
      const historyStr = this.history.join("\n");
      const prompt = createReactPrompt(toolsDesc, input, historyStr);
      const response = await this.llmClient.think(
        [
          {
            role: "user",
            content: prompt,
          },
        ],
        options.temperature ?? 0,
      );
      const [thought, action] = this._parseOutput(response);
      if (thought) {
        console.log(`Thought: ${thought}`);
      }
      if (!action) {
        console.error("错误:未能解析出有效Action，流程终止");
        break;
      }
      if (action.startsWith("Finish")) {
        const final_answer = action.split("[")[1].split("]")[0];
        console.log(`最终答案: ${final_answer}`);
        break;
      }
      const [tool_name, tool_input] = this._parseAction(action);
      if (!tool_name || !tool_input) {
        console.error("错误:LLM未能返回有效响应。");
        continue;
      }
      console.log(`调用工具: ${tool_name}，输入: ${tool_input}`);
      const observation = await this._execute_action(tool_name, tool_input);
      console.log(`工具返回结果: ${observation}`);
      this.history.push(`Action: ${action}`);
      this.history.push(`Observation: ${observation}`);
    }
  }
}

