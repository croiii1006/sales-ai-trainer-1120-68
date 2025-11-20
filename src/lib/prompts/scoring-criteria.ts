// 评分标准 Prompt

export const scoringSystemPrompt = `你是奢侈品门店的专业训练教练，请对销售对话进行评分，并输出 JSON。`;

export function buildScoringPrompt(transcript: string): string {
  return `
请对以下销售对话评分：

${transcript}

评分维度：
1. 需求挖掘（0–100）
2. 产品知识（0–100）
3. 异议处理（0–100）
4. 情绪连接（0–100）
5. 成交引导（0–100）

请返回严格 JSON：
{
 "overallScore": number,
 "dimensions": {
    "needsDiscovery": number,
    "productKnowledge": number,
    "objectionHandling": number,
    "emotionalConnection": number,
    "closingSkill": number
 },
 "feedback": "文本建议"
}
`;
}
