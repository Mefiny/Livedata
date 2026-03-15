import type { IAnalysisPlugin } from '../types/flow';

export const aiProcessorPlugin: IAnalysisPlugin = {
  id: 'aiProcessor',
  name: 'AI助手',
  type: 'aiProcessor',
  execute: async (input, config) => {
    const { instruction } = config;

    // TODO: 调用后端LLM API
    // 暂时返回模拟的智能建议
    return {
      suggestion: `基于指令"${instruction}"的分析建议`,
      generatedConfig: {
        action: 'filter',
        field: 'amount',
        operator: 'gt',
        value: 150,
      },
      input,
    };
  },
  configSchema: {
    instruction: { type: 'text', label: '自然语言指令', required: true },
  },
};
