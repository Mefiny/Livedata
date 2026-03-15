import { Play, Trash2, Copy } from 'lucide-react';

interface Props {
  x: number;
  y: number;
  nodeId: string;
  onExecute: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onClose: () => void;
}

export function ContextMenu({ x, y, onExecute, onDelete, onDuplicate, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px]"
        style={{ left: x, top: y }}
      >
        <button
          onClick={onExecute}
          className="w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
        >
          <Play size={14} />
          执行节点
        </button>
        <button
          onClick={onDuplicate}
          className="w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
        >
          <Copy size={14} />
          复制节点
        </button>
        <div className="border-t border-gray-700 my-1" />
        <button
          onClick={onDelete}
          className="w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
        >
          <Trash2 size={14} />
          删除节点
        </button>
      </div>
    </>
  );
}
