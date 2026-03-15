import type { IAnalysisPlugin } from '../types/flow';

export const maxDrawdownPlugin: IAnalysisPlugin = {
  id: 'maxDrawdown',
  name: '最大回撤',
  type: 'transform',
  execute: async (input: any, config) => {
    if (!input?.rows) return input;

    const { priceField } = config;
    const rows = [...input.rows];

    let maxPrice = -Infinity;
    let maxDrawdown = 0;
    let maxDrawdownPct = 0;

    const resultRows = rows.map((row: any) => {
      const price = Number(row[priceField as string]);

      if (price > maxPrice) {
        maxPrice = price;
      }

      const drawdown = maxPrice - price;
      const drawdownPct = maxPrice > 0 ? (drawdown / maxPrice) * 100 : 0;

      if (drawdownPct > maxDrawdownPct) {
        maxDrawdown = drawdown;
        maxDrawdownPct = drawdownPct;
      }

      return {
        ...row,
        drawdown: drawdown.toFixed(2),
        drawdownPct: drawdownPct.toFixed(2)
      };
    });

    return {
      columns: [...input.columns, 'drawdown', 'drawdownPct'],
      rows: resultRows,
      summary: {
        maxDrawdown: maxDrawdown.toFixed(2),
        maxDrawdownPct: maxDrawdownPct.toFixed(2) + '%'
      }
    };
  },
  configSchema: {
    priceField: { type: 'text', label: '价格字段', required: true }
  },
};
