import "dotenv/config";
import {LLMClient} from "../core/llm";

async function main() {
  const llmClient = new LLMClient();

  const response = await llmClient.think([
    {
      role: "system",
      content: "You are a helpful assistant that writes TypeScript.",
    },
    {role: "user", content: "写一个 TypeScript 版快速排序函数"},
  ]);

  console.log("\n--- 完整模型响应 ---");
  console.log(response);
}

main().catch((error) => {
  console.error("运行失败:", error);
  process.exitCode = 1;
});

