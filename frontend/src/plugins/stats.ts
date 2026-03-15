import type { IAnalysisPlugin } from '../types/flow';

export const statsPlugin: IAnalysisPlugin = {
  id: 'stats',
  name: '统计摘要',
  type: 'transform',
  execute: async (input, config) => {
    const { field } = config;
    const data = input as any;

    if (!data?.rows) return data;

    const values = data.rows.map((r: any) => Number(r[field as string])).filter((v: number) => !isNaN(v));
    const sum = values.reduce((a: number, b: number) => a + b, 0);
    const avg = sum / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    return {
      columns: ['指标', '值'],
      rows: [
        { 指标: '总数', 值: values.length },
        { 指标: '总和', 值: sum.toFixed(2) },
        { 指标: '平均值', 值: avg.toFixed(2) },
        { 指标: '中位数', 值: median.toFixed(2) },
        { 指标: '最大值', 值: Math.max(...values).toFixed(2) },
        { 指标: '最小值', 值: Math.min(...values).toFixed(2) },
      ],
    };
  },
  configSchema: {
    field: { type: 'text', label: '分析字段', required: true },
  },
};
