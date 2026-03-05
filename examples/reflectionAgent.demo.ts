import "dotenv/config";
import {LLMClient} from "../core/llm";
import {ReflectionAgent} from "../agent/reflection-agent/ReflectionAgent";
import * as readline from "node:readline/promises";
import {stdin as input, stdout as output} from "node:process";

async function main() {
  const llmClient = new LLMClient({
    model: process.env.LLM_MODEL,
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_BASE_URL,
  });

  const agent = new ReflectionAgent(llmClient, 3);
  const rl = readline.createInterface({input, output});

  while (true) {
    const task = await rl.question("请输入任务(回车退出): ");
    if (!task.trim()) {
      break;
    }

    await agent.run(task);
  }

  rl.close();
}

main().catch((error) => {
  console.error("运行失败:", error);
  process.exitCode = 1;
});
