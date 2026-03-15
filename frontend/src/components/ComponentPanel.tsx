import { BarChart3, LineChart, PieChart, Filter, Table, Type } from 'lucide-react';
import type { ComponentType } from '../types/workspace';

interface ComponentTemplate {
  type: ComponentType;
  icon: React.ReactNode;
  label: string;
}

const templates: ComponentTemplate[] = [
  { type: 'chart', icon: <LineChart size={20} />, label: '折线图' },
  { type: 'chart', icon: <BarChart3 size={20} />, label: '柱状图' },
  { type: 'chart', icon: <PieChart size={20} />, label: '饼图' },
  { type: 'filter', icon: <Filter size={20} />, label: '筛选器' },
  { type: 'data-table', icon: <Table size={20} />, label: '数据表' },
  { type: 'text', icon: <Type size={20} />, label: '文本' },
];

export function ComponentPanel() {
  const handleDragStart = (e: React.DragEvent, type: ComponentType, label: string) => {
    e.dataTransfer.setData('componentType', type);
    e.dataTransfer.setData('componentLabel', label);
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">组件</h3>
      <div className="space-y-2">
        {templates.map((template, idx) => (
          <div
            key={idx}
            draggable
            onDragStart={(e) => handleDragStart(e, template.type, template.label)}
            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:border-blue-400 hover:shadow-sm transition-all"
          >
            <div className="text-gray-600">{template.icon}</div>
            <span className="text-sm text-gray-700">{template.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
