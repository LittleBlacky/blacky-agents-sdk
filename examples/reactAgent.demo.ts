import {ReActAgent} from "../agent/react-agent/ReActAgent";
import {LLMClient} from "../core/llm";
import {ToolExecutor} from "../tools/ToolExecutor";
import {search} from "../tools/builtin/search";
import * as readline from "node:readline/promises";
import {stdin as input, stdout as output} from "node:process";

async function main() {
  const llmClient = new LLMClient({
    model: process.env.LLM_MODEL,
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_BASE_URL,
  });

  const toolExecutor = new ToolExecutor();

  toolExecutor.registerTool({
    name: "search",
    description: "Search the web for information",
    execute: search,
  });

  const reactAgent = new ReActAgent(llmClient, toolExecutor);

  const rl = readline.createInterface({input, output});

  while (true) {
    const input = await rl.question("请输入问题: ");
    if (!input) {
      break;
    }
    await reactAgent.run(input);
  }
  rl.close();
}

main().catch((error) => {
  console.error("运行失败:", error);
  process.exitCode = 1;
});
