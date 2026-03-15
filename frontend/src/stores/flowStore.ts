import { create } from 'zustand';
import type { Node, Edge } from 'reactflow';
import type { NodeData } from '../types/flow';
import { pluginRegistry } from '../plugins';

interface FlowState {
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;

  setNodes: (nodes: Node<NodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  setSelectedNodeId: (id: string | null) => void;
  executeNode: (nodeId: string) => Promise<void>;
  saveWorkflow: () => string;
  loadWorkflow: (data: string) => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
    })),

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  executeNode: async (nodeId) => {
    const { nodes, edges, updateNodeData } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    // 递归执行上游节点
    const executeUpstream = async (currentNodeId: string): Promise<void> => {
      const currentNode = nodes.find((n) => n.id === currentNodeId);
      if (!currentNode) return;

      // 找到所有输入节点
      const inputEdges = edges.filter((e) => e.target === currentNodeId);

      // 先执行所有上游节点
      for (const edge of inputEdges) {
        const upstreamNode = nodes.find((n) => n.id === edge.source);
        if (upstreamNode && upstreamNode.data.status !== 'success') {
          await executeUpstream(edge.source);
        }
      }

      // 执行当前节点
      const nodeType = currentNode.data.config?.nodeType as string;
      const plugin = pluginRegistry.get(nodeType);
      if (!plugin) {
        updateNodeData(currentNodeId, { status: 'error' });
        return;
      }

      updateNodeData(currentNodeId, { status: 'running', error: undefined });

      try {
        // 收集输入数据
        const inputNode = inputEdges[0] ? nodes.find((n) => n.id === inputEdges[0].source) : null;
        const inputData = inputNode?.data.output;

        // 验证必填配置
        if (plugin.configSchema) {
          for (const [key, schema] of Object.entries(plugin.configSchema)) {
            if ((schema as any).required && !currentNode.data.config?.[key]) {
              throw new Error(`缺少必填字段: ${(schema as any).label}`);
            }
          }
        }

        const output = await plugin.execute(inputData, currentNode.data.config || {});
        updateNodeData(currentNodeId, { output, status: 'success', error: undefined });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '执行失败';
        console.error('Node execution failed:', error);
        updateNodeData(currentNodeId, { status: 'error', error: errorMsg });
      }
    };

    await executeUpstream(nodeId);
  },

  saveWorkflow: () => {
    const { nodes, edges } = get();
    return JSON.stringify({ nodes, edges });
  },

  loadWorkflow: (data) => {
    try {
      const { nodes, edges } = JSON.parse(data);
      set({ nodes, edges });
    } catch (error) {
      console.error('Failed to load workflow:', error);
    }
  },
}));
