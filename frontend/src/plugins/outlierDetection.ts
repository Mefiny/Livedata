import type { IAnalysisPlugin } from '../types/flow';

export const outlierDetectionPlugin: IAnalysisPlugin = {
  id: 'outlierDetection',
  name: '异常值检测',
  type: 'transform',
  execute: async (input: any, config) => {
    if (!input?.rows) return input;

    const { field, method, action } = config;
    const rows = [...input.rows];

    // 提取数值
    const values = rows.map((row: any) => Number(row[field as string])).filter(v => !isNaN(v));
    if (values.length === 0) return input;

    let outlierIndices = new Set<number>();

    if (method === 'zscore') {
      // Z-Score方法
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);

      rows.forEach((row: any, i: number) => {
        const val = Number(row[field as string]);
        if (!isNaN(val) && Math.abs((val - mean) / std) > 3) {
          outlierIndices.add(i);
        }
      });
    } else if (method === 'iqr') {
      // IQR方法
      const sorted = [...values].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;

      rows.forEach((row: any, i: number) => {
        const val = Number(row[field as string]);
        if (!isNaN(val) && (val < lower || val > upper)) {
          outlierIndices.add(i);
        }
      });
    }

    // 处理异常值
    let resultRows = rows;
    if (action === 'remove') {
      resultRows = rows.filter((_, i) => !outlierIndices.has(i));
    } else if (action === 'mark') {
      resultRows = rows.map((row: any, i: number) => ({
        ...row,
        _isOutlier: outlierIndices.has(i)
      }));
    }

    return { ...input, rows: resultRows };
  },
  configSchema: {
    field: { type: 'text', label: '检测字段', required: true },
    method: {
      type: 'select',
      label: '检测方法',
      options: [
        { value: 'zscore', label: 'Z-Score' },
        { value: 'iqr', label: 'IQR四分位距' }
      ]
    },
    action: {
      type: 'select',
      label: '处理方式',
      options: [
        { value: 'mark', label: '标记' },
        { value: 'remove', label: '删除' }
      ]
    }
  },
};
