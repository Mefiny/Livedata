import { Database, Filter, BarChart3, Table, Workflow, Brain, Eraser, AlertTriangle, TrendingUp, TrendingDown, Activity, Group, ArrowUpDown, BarChart2 } from 'lucide-react';

interface NodeTemplate {
  type: string;
  icon: React.ReactNode;
  label: string;
}

interface NodeCategory {
  name: string;
  nodes: NodeTemplate[];
}

const nodeCategories: NodeCategory[] = [
  {
    name: '📊 数据源',
    nodes: [
      { type: 'dataSource', icon: <Database size={20} />, label: '数据源' },
    ],
  },
  {
    name: '🔧 数据处理',
    nodes: [
      { type: 'filter', icon: <Filter size={20} />, label: '过滤器' },
      { type: 'dataCleaning', icon: <Eraser size={20} />, label: '数据清洗' },
      { type: 'outlierDetection', icon: <AlertTriangle size={20} />, label: '异常检测' },
      { type: 'groupBy', icon: <Group size={20} />, label: '分组聚合' },
      { type: 'sort', icon: <ArrowUpDown size={20} />, label: '排序' },
      { type: 'stats', icon: <BarChart2 size={20} />, label: '统计摘要' },
      { type: 'transform', icon: <Workflow size={20} />, label: '转换' },
    ],
  },
  {
    name: '📈 金融分析',
    nodes: [
      { type: 'returnCalculator', icon: <TrendingUp size={20} />, label: '收益率' },
      { type: 'maxDrawdown', icon: <TrendingDown size={20} />, label: '最大回撤' },
      { type: 'sharpeRatio', icon: <Activity size={20} />, label: '夏普比率' },
    ],
  },
  {
    name: '📉 可视化',
    nodes: [
      { type: 'chart', icon: <BarChart3 size={20} />, label: '图表' },
      { type: 'table', icon: <Table size={20} />, label: '数据表' },
    ],
  },
  {
    name: '🤖 AI',
    nodes: [
      { type: 'aiProcessor', icon: <Brain size={20} />, label: 'AI助手' },
    ],
  },
];

export function NodePanel() {
  const handleDragStart = (e: React.DragEvent, type: string, label: string) => {
    e.dataTransfer.setData('nodeType', type);
    e.dataTransfer.setData('nodeLabel', label);
  };

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 overflow-auto">
      <h3 className="text-sm font-semibold text-gray-200 mb-4">节点</h3>
      <div className="space-y-4">
        {nodeCategories.map((category) => (
          <div key={category.name}>
            <h4 className="text-xs font-medium text-gray-400 mb-2">{category.name}</h4>
            <div className="space-y-2">
              {category.nodes.map((template) => (
                <div
                  key={template.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, template.type, template.label)}
                  className="flex items-center gap-3 p-3 bg-gray-700 border border-gray-600 rounded-lg cursor-move hover:border-blue-500 hover:bg-gray-600 transition-all"
                >
                  <div className="text-gray-300">{template.icon}</div>
                  <span className="text-sm text-gray-200">{template.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
