import type { IAnalysisPlugin } from '../types/flow';

export const dataCleaningPlugin: IAnalysisPlugin = {
  id: 'dataCleaning',
  name: '数据清理',
  type: 'transform',
  execute: async (input: any, config) => {
    if (!input?.rows) return input;

    const { handleNull, removeDuplicates } = config;
    let rows = [...input.rows];

    // 处理空值
    if (handleNull === 'remove') {
      rows = rows.filter((row: any) =>
        Object.values(row).every(val => val !== null && val !== undefined && val !== '')
      );
    } else if (handleNull === 'fillZero') {
      rows = rows.map((row: any) => {
        const newRow = { ...row };
        Object.keys(newRow).forEach(key => {
          if (newRow[key] === null || newRow[key] === undefined || newRow[key] === '') {
            newRow[key] = 0;
          }
        });
        return newRow;
      });
    }

    // 去重
    if (removeDuplicates) {
      const seen = new Set();
      rows = rows.filter((row: any) => {
        const key = JSON.stringify(row);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    return { ...input, rows };
  },
  configSchema: {
    handleNull: {
      type: 'select',
      label: '空值处理',
      options: [
        { value: 'keep', label: '保留' },
        { value: 'remove', label: '删除行' },
        { value: 'fillZero', label: '填充0' }
      ]
    },
    removeDuplicates: { type: 'checkbox', label: '去除重复行' },
  },
};
