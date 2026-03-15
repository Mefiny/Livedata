import type { Node, Edge } from 'reactflow';

export type NodeType = 'dataSource' | 'filter' | 'transform' | 'chart' | 'table' | 'aiProcessor';
export type NodeStatus = 'idle' | 'running' | 'success' | 'error';

export interface NodeData {
  label: string;
  config?: Record<string, unknown>;
  output?: unknown;
  status?: NodeStatus;
  error?: string;
}

export type FlowNode = Node<NodeData>;
export type FlowEdge = Edge;

export interface IAnalysisPlugin {
  id: string;
  name: string;
  type: NodeType;
  icon?: string;
  execute: (input: unknown, config: Record<string, unknown>) => Promise<unknown>;
  configSchema?: Record<string, unknown>;
}
