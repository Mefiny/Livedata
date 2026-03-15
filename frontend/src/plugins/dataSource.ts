import type { IAnalysisPlugin } from '../types/flow';

const SAMPLE_DATASETS: Record<string, any> = {
  stock: {
    columns: ['date', 'price', 'volume'],
    rows: [
      { date: '2024-01-01', price: 100, volume: 1000 },
      { date: '2024-01-02', price: 102, volume: 1200 },
      { date: '2024-01-03', price: 98, volume: 1500 },
      { date: '2024-01-04', price: 105, volume: 1100 },
      { date: '2024-01-05', price: 107, volume: 1300 },
    ],
  },
  sales: {
    columns: ['date', 'revenue', 'region'],
    rows: [
      { date: '2024-01-01', revenue: 5000, region: 'North' },
      { date: '2024-01-02', revenue: 6000, region: 'South' },
      { date: '2024-01-03', revenue: 5500, region: 'North' },
      { date: '2024-01-04', revenue: 7000, region: 'East' },
      { date: '2024-01-05', revenue: 6500, region: 'West' },
    ],
  },
};

export const dataSourcePlugin: IAnalysisPlugin = {
  id: 'dataSource',
  name: '数据源',
  type: 'dataSource',
  execute: async (_input, config) => {
    const { datasetId } = config;
    return SAMPLE_DATASETS[datasetId as string] || SAMPLE_DATASETS.stock;
  },
  configSchema: {
    datasetId: {
      type: 'select',
      label: '数据集',
      required: true,
      options: [
        { value: 'stock', label: '股票数据' },
        { value: 'sales', label: '销售数据' },
      ],
    },
  },
};
