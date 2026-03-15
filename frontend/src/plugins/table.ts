import type { IAnalysisPlugin } from '../types/flow';

export const tablePlugin: IAnalysisPlugin = {
  id: 'table',
  name: '数据表',
  type: 'table',
  execute: async (input) => {
    return input;
  },
  configSchema: {},
};
