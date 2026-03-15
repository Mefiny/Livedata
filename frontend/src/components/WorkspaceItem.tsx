import { useState, useRef, useEffect } from 'react';
import { GripVertical, X } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import type { WorkspaceComponent } from '../types/workspace';

interface Props {
  component: WorkspaceComponent;
}

export function WorkspaceItem({ component }: Props) {
  const { removeComponent, setSelectedComponentId, selectedComponentId, updateComponent } = useAppStore();
  const isSelected = selectedComponentId === component.id;
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedComponentId(component.id);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: component.x,
        initialY: component.y,
      };
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      updateComponent(component.id, {
        x: dragRef.current.initialX + dx,
        y: dragRef.current.initialY + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, component.id, updateComponent]);

  return (
    <div
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: component.x,
        top: component.y,
        width: component.w,
        height: component.h,
      }}
      className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
        isSelected ? 'border-blue-500' : 'border-gray-200'
      }`}
    >
      <div className="drag-handle flex items-center justify-between p-2 bg-gray-50 border-b cursor-move">
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-gray-400" />
          <span className="text-sm font-medium">{component.config.label as string}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeComponent(component.id);
          }}
          className="text-gray-400 hover:text-red-500"
        >
          <X size={16} />
        </button>
      </div>
      <div className="p-4 h-[calc(100%-48px)] overflow-auto">
        {component.type === 'chart' && component.config.chartConfig ? (
          <div className="text-sm text-gray-500">图表组件</div>
        ) : null}
        {component.type === 'text' && (
          <textarea
            className="w-full h-full border-none outline-none resize-none"
            placeholder="输入文本..."
            defaultValue={(component.config.text as string) || ''}
          />
        )}
        {component.type === 'filter' && (
          <div className="text-sm text-gray-500">筛选器配置</div>
        )}
        {component.type === 'data-table' && (
          <div className="text-sm text-gray-500">数据表</div>
        )}
      </div>
    </div>
  );
}
