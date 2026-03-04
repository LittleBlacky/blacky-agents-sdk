export type MemoryRecordType = "execution" | "reflection";

export interface MemoryRecord {
  type: MemoryRecordType;
  content: string;
}

/**
 * 一个简单的短期记忆模块，用于存储智能体的行动与反思轨迹。
 */
export class Memory {
  private readonly records: MemoryRecord[] = [];

  /**
   * 向记忆中添加一条新记录。
   * @param recordType 记录的类型（"execution" 或 "reflection"）
   * @param content 记录的具体内容
   */
  addRecord(recordType: MemoryRecordType, content: string): void {
    const record: MemoryRecord = {type: recordType, content};
    this.records.push(record);
    console.log(`记忆已更新，新增一条 '${recordType}' 记录。`);
  }

  /**
   * 将所有记忆记录格式化为一个连贯文本，用于构建提示词。
   */
  getTrajectory(): string {
    const trajectoryParts: string[] = [];

    for (const record of this.records) {
      if (record.type === "execution") {
        trajectoryParts.push(`--- 上一轮尝试 (代码) ---\n${record.content}`);
      } else if (record.type === "reflection") {
        trajectoryParts.push(`--- 评审员反馈 ---\n${record.content}`);
      }
    }

    return trajectoryParts.join("\n\n");
  }

  /**
   * 获取最近一次执行结果（例如最新生成的代码）。
   * 如果不存在，则返回 null。
   */
  getLastExecution(): string | null {
    for (let i = this.records.length - 1; i >= 0; i -= 1) {
      const record = this.records[i];
      if (record.type === "execution") {
        return record.content;
      }
    }
    return null;
  }
}
