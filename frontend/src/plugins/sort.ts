import type { IAnalysisPlugin } from '../types/flow';

export const sortPlugin: IAnalysisPlugin = {
  id: 'sort',
  name: '排序',
  type: 'transform',
  execute: async (input, config) => {
    const { sortField, order } = config;
    const data = input as any;

    if (!data?.rows) return data;

    const sorted = [...data.rows].sort((a, b) => {
      const aVal = a[sortField as string];
      const bVal = b[sortField as string];
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return order === 'desc' ? -comparison : comparison;
    });

    return { ...data, rows: sorted };
  },
  configSchema: {
    sortField: { type: 'text', label: '排序字段', required: true },
    order: {
      type: 'select',
      label: '排序方式',
      required: true,
      options: [
        { value: 'asc', label: '升序' },
        { value: 'desc', label: '降序' },
      ],
    },
  },
};
