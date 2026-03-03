import {getJson} from "serpapi";
import "dotenv/config";
type SerpApiOrganicResult = {
  title?: string;
  snippet?: string;
};

type SerpApiResponse = {
  answer_box_list?: string[];
  answer_box?: {
    answer?: string;
  };
  knowledge_graph?: {
    description?: string;
  };
  organic_results?: SerpApiOrganicResult[];
};

/**
 * 一个基于 SerpApi 的实战网页搜索工具。
 * 优先返回直接答案或知识图谱信息。
 */
export async function search(query: string): Promise<string> {
  console.log(`🔍 正在执行 [SerpApi] 网页搜索: ${query}`);

  try {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      return "错误: SERPAPI_API_KEY 未在 .env 文件中配置。";
    }

    const results = (await getJson({
      engine: "google",
      q: query,
      api_key: apiKey,
      gl: "cn",
      hl: "zh-cn",
    })) as SerpApiResponse;

    // 智能解析：优先寻找最直接答案
    if (
      Array.isArray(results.answer_box_list) &&
      results.answer_box_list.length > 0
    ) {
      return results.answer_box_list.join("\n");
    }

    if (results.answer_box?.answer) {
      return results.answer_box.answer;
    }

    if (results.knowledge_graph?.description) {
      return results.knowledge_graph.description;
    }

    if (
      Array.isArray(results.organic_results) &&
      results.organic_results.length > 0
    ) {
      const snippets = results.organic_results.slice(0, 3).map((res, index) => {
        const title = res.title ?? "";
        const snippet = res.snippet ?? "";
        return `[${index + 1}] ${title}\n${snippet}`;
      });
      return snippets.join("\n\n");
    }

    return `对不起，没有找到关于 '${query}' 的信息。`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `搜索时发生错误: ${message}`;
  }
}
