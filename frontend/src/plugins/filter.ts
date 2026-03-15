import type { IAnalysisPlugin } from '../types/flow';

export const filterPlugin: IAnalysisPlugin = {
  id: 'filter',
  name: '过滤器',
  type: 'filter',
  execute: async (input, config) => {
    const { field, operator, value } = config;
    const data = input as any;

    if (!data?.rows) return data;

    const filteredRows = data.rows.filter((row: any) => {
      const fieldValue = row[field as string];
      switch (operator) {
        case 'equals':
          return fieldValue === value;
        case 'contains':
          return String(fieldValue).includes(String(value));
        case 'gt':
          return Number(fieldValue) > Number(value);
        case 'lt':
          return Number(fieldValue) < Number(value);
        default:
          return true;
      }
    });

    return { ...data, rows: filteredRows };
  },
  configSchema: {
    field: { type: 'text', label: '字段', required: true },
    operator: {
      type: 'select',
      label: '操作符',
      required: true,
      options: [
        { value: 'equals', label: '等于' },
        { value: 'contains', label: '包含' },
        { value: 'gt', label: '大于' },
        { value: 'lt', label: '小于' },
      ],
    },
    value: { type: 'text', label: '值', required: true },
  },
};
