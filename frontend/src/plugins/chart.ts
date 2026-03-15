import type { IAnalysisPlugin } from '../types/flow';

export const chartPlugin: IAnalysisPlugin = {
  id: 'chart',
  name: '图表',
  type: 'chart',
  execute: async (input, config) => {
    const { chartType, xField, yField } = config;
    const data = input as any;

    if (!data?.rows) return null;

    // 生成图表配置
    const chartConfig = {
      type: chartType,
      xAxis: { type: 'category', data: data.rows.map((r: any) => r[xField as string]) },
      yAxis: { type: 'value' },
      series: [{ data: data.rows.map((r: any) => r[yField as string]), type: chartType }],
    };

    return chartConfig;
  },
  configSchema: {
    chartType: {
      type: 'select',
      label: '图表类型',
      required: true,
      options: [
        { value: 'line', label: '折线图' },
        { value: 'bar', label: '柱状图' },
        { value: 'pie', label: '饼图' },
      ],
    },
    xField: { type: 'text', label: 'X轴字段', required: true },
    yField: { type: 'text', label: 'Y轴字段', required: true },
  },
};
