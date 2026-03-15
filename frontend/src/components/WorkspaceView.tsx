import { NodePanel } from './NodePanel';
import { FlowCanvas } from './FlowCanvas';
import { ConfigPanel } from './ConfigPanel';
import { AIInsightPanel } from './AIInsightPanel';
import { useFlowStore } from '../stores/flowStore';
import { Save, Upload } from 'lucide-react';

export function WorkspaceView() {
  const { saveWorkflow, loadWorkflow } = useFlowStore();

  const handleSave = () => {
    const data = saveWorkflow();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
  };

  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result as string;
      loadWorkflow(data);
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white">LiveData OS</h1>
          <span className="text-sm text-gray-300">逻辑布分析平台</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
            <Save size={16} />
            保存
          </button>
          <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm cursor-pointer">
            <Upload size={16} />
            加载
            <input type="file" accept=".json" onChange={handleLoad} className="hidden" />
          </label>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <NodePanel />
        <FlowCanvas />
        <ConfigPanel />
      </div>

      <AIInsightPanel />
    </div>
  );
}
