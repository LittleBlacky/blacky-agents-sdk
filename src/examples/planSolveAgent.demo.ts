import "dotenv/config";
import {LLMClient} from "../core/llm";
import {PlanSolveAgent} from "../agent/plan-solve-agent/PlanSolveAgent";
import * as readline from "node:readline/promises";
import {stdin as input, stdout as output} from "node:process";

async function main() {
  const llmClient = new LLMClient({
    model: process.env.LLM_MODEL,
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_BASE_URL,
  });

  const agent = new PlanSolveAgent(llmClient);
  const rl = readline.createInterface({input, output});

  while (true) {
    const question = await rl.question("请输入问题(回车退出): ");
    if (!question.trim()) {
      break;
    }
    await agent.run(question);
  }

  rl.close();
}

main().catch((error) => {
  console.error("运行失败:", error);
  process.exitCode = 1;
});
