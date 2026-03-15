import type { IAnalysisPlugin } from '../types/flow';

export const returnCalculatorPlugin: IAnalysisPlugin = {
  id: 'returnCalculator',
  name: '收益率计算',
  type: 'transform',
  execute: async (input: any, config) => {
    if (!input?.rows) return input;

    const { priceField, dateField: _dateField, calcType } = config;
    const rows = [...input.rows];

    if (calcType === 'simple') {
      // 简单收益率
      const resultRows = rows.map((row: any, i: number) => {
        if (i === 0) return { ...row, return: 0 };
        const prevPrice = Number(rows[i - 1][priceField as string]);
        const currPrice = Number(row[priceField as string]);
        const returnRate = ((currPrice - prevPrice) / prevPrice * 100).toFixed(2);
        return { ...row, return: returnRate };
      });
      return { columns: [...input.columns, 'return'], rows: resultRows };
    } else if (calcType === 'cumulative') {
      // 累计收益率
      const firstPrice = Number(rows[0][priceField as string]);
      const resultRows = rows.map((row: any) => {
        const currPrice = Number(row[priceField as string]);
        const cumulativeReturn = ((currPrice - firstPrice) / firstPrice * 100).toFixed(2);
        return { ...row, cumulativeReturn };
      });
      return { columns: [...input.columns, 'cumulativeReturn'], rows: resultRows };
    }

    return input;
  },
  configSchema: {
    priceField: { type: 'text', label: '价格字段', required: true },
    dateField: { type: 'text', label: '日期字段' },
    calcType: {
      type: 'select',
      label: '计算类型',
      options: [
        { value: 'simple', label: '简单收益率' },
        { value: 'cumulative', label: '累计收益率' }
      ]
    }
  },
};
