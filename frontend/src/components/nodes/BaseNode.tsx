import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Database, Filter, BarChart3, Table, Brain } from 'lucide-react';
import { useFlowStore } from '../../stores/flowStore';
import type { NodeData } from '../../types/flow';

interface Props {
  id: string;
  data: NodeData;
  selected?: boolean;
}

const iconMap = {
  dataSource: Database,
  filter: Filter,
  chart: BarChart3,
  table: Table,
  transform: Filter,
  aiProcessor: Brain,
};

const statusColors = {
  idle: 'bg-gray-400',
  running: 'bg-blue-500 animate-pulse',
  success: 'bg-green-500',
  error: 'bg-red-500',
};

export const BaseNode = memo(({ id, data, selected }: Props) => {
  const Icon = iconMap[data.config?.nodeType as keyof typeof iconMap] || Database;
  const { setSelectedNodeId, executeNode } = useFlowStore();
  const status = data.status || 'idle';

  const outputData = data.output as any;
  const hasData = outputData?.rows?.length > 0 || outputData?.type;

  return (
    <div
      onClick={() => setSelectedNodeId(id)}
      onDoubleClick={() => executeNode(id)}
      className={`px-4 py-3 bg-white rounded-lg border-2 shadow-sm min-w-[180px] max-w-[240px] cursor-pointer ${
        selected ? 'border-blue-500' : 'border-gray-300'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
        <Icon size={16} className="text-gray-600" />
        <span className="text-sm font-medium truncate">{data.label}</span>
      </div>

      {data.error && (
        <div className="text-xs text-red-600 mb-1 truncate">⚠️ {data.error}</div>
      )}

      {hasData && (
        <div className="text-xs text-gray-500 mt-1 pt-1 border-t border-gray-200">
          {outputData.rows ? `${outputData.rows.length} 行` : outputData.type || '数据'}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

BaseNode.displayName = 'BaseNode';
