import type { IAnalysisPlugin } from '../types/flow';

export const groupByPlugin: IAnalysisPlugin = {
  id: 'groupBy',
  name: '分组聚合',
  type: 'transform',
  execute: async (input, config) => {
    const { groupField, aggField, aggType } = config;
    const data = input as any;

    if (!data?.rows) return data;

    const groups = new Map<string, any[]>();
    data.rows.forEach((row: any) => {
      const key = row[groupField as string];
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    });

    const rows = Array.from(groups.entries()).map(([key, items]) => {
      const values = items.map((item) => Number(item[aggField as string]));
      let aggValue = 0;
      if (aggType === 'sum') aggValue = values.reduce((a, b) => a + b, 0);
      else if (aggType === 'avg') aggValue = values.reduce((a, b) => a + b, 0) / values.length;
      else if (aggType === 'count') aggValue = values.length;
      else if (aggType === 'max') aggValue = Math.max(...values);
      else if (aggType === 'min') aggValue = Math.min(...values);
      return { [groupField as string]: key, [aggField as string]: aggValue };
    });

    return { columns: [groupField as string, aggField as string], rows };
  },
  configSchema: {
    groupField: { type: 'text', label: '分组字段', required: true },
    aggField: { type: 'text', label: '聚合字段', required: true },
    aggType: {
      type: 'select',
      label: '聚合方式',
      required: true,
      options: [
        { value: 'sum', label: '求和' },
        { value: 'avg', label: '平均值' },
        { value: 'count', label: '计数' },
        { value: 'max', label: '最大值' },
        { value: 'min', label: '最小值' },
      ],
    },
  },
};
