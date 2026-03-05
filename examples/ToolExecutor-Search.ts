import {ToolExecutor} from "../tools/ToolExecutor";
import {search} from "../tools/builtin/search";

console.log("初始化工具执行器...");
const toolExecutor = new ToolExecutor();
console.log("工具执行器初始化完成");

toolExecutor.registerTool({
  name: "search",
  description: "Search the web for information",
  execute: search,
});

console.log('工具 "search" 注册完成');
console.log("可用的工具列表:");
console.log(toolExecutor.getAvailableTools());

console.log("正在执行搜索工具...");
const searchTool = toolExecutor.getTool("search");
if (!searchTool) {
  console.error("搜索工具未找到");
  process.exit(1);
}

const result = await searchTool.execute("What is the capital of France?");
console.log("搜索结果:", result);
