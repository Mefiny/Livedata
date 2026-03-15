import type { IAnalysisPlugin } from '../types/flow';

export const sharpeRatioPlugin: IAnalysisPlugin = {
  id: 'sharpeRatio',
  name: '夏普比率',
  type: 'transform',
  execute: async (input: any, config) => {
    if (!input?.rows) return input;

    const { returnField, riskFreeRate = 0 } = config;
    const rows = [...input.rows];

    // 提取收益率数据
    const returns = rows
      .map((row: any) => Number(row[returnField as string]))
      .filter(r => !isNaN(r));

    if (returns.length === 0) {
      return { ...input, summary: { sharpeRatio: 'N/A' } };
    }

    // 计算平均收益率
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;

    // 计算标准差
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // 计算夏普比率
    const rf = Number(riskFreeRate);
    const sharpeRatio = stdDev > 0 ? (avgReturn - rf) / stdDev : 0;

    return {
      ...input,
      summary: {
        avgReturn: avgReturn.toFixed(4),
        stdDev: stdDev.toFixed(4),
        sharpeRatio: sharpeRatio.toFixed(4)
      }
    };
  },
  configSchema: {
    returnField: { type: 'text', label: '收益率字段', required: true },
    riskFreeRate: { type: 'text', label: '无风险利率(%)', required: false }
  },
};
