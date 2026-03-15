import { useFlowStore } from '../stores/flowStore';
import { pluginRegistry } from '../plugins';
import { Play, Upload } from 'lucide-react';
import { SimpleChart } from './SimpleChart';

export function ConfigPanel() {
  const { nodes, edges, selectedNodeId, updateNodeData, executeNode } = useFlowStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="w-64 bg-gray-800 border-l border-gray-700 p-4">
        <p className="text-sm text-gray-400">选择一个节点来配置</p>
      </div>
    );
  }

  const nodeType = selectedNode.data.config?.nodeType as string;
  const plugin = pluginRegistry.get(nodeType);

  // 获取上游节点的输出列
  const inputEdge = edges.find((e) => e.target === selectedNode.id);
  const upstreamNode = inputEdge ? nodes.find((n) => n.id === inputEdge.source) : null;
  const availableColumns = (upstreamNode?.data.output as any)?.columns || [];

  const handleConfigChange = (field: string, value: unknown) => {
    updateNodeData(selectedNode.id, {
      config: { ...selectedNode.data.config, [field]: value },
    });
  };

  const handleExecute = () => {
    executeNode(selectedNode.id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.trim().split('\n');
      const columns = lines[0].split(',').map((col) => col.trim());
      const rows = lines.slice(1).map((line) => {
        const values = line.split(',').map((val) => val.trim());
        const row: any = {};
        columns.forEach((col, i) => {
          row[col] = values[i];
        });
        return row;
      });

      updateNodeData(selectedNode.id, {
        output: { columns, rows },
        config: { ...selectedNode.data.config, datasetId: 'custom' },
      });
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-64 bg-gray-800 border-l border-gray-700 p-4 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-200">节点配置</h3>
        <button
          onClick={handleExecute}
          className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"
          title="执行节点"
        >
          <Play size={14} />
        </button>
      </div>

      <div className="space-y-4">
        {selectedNode.data.error && (
          <div className="p-2 bg-red-900/50 border border-red-700 rounded text-xs text-red-200">
            ⚠️ {selectedNode.data.error}
          </div>
        )}

        <div>
          <label className="text-xs text-gray-300 block mb-1">节点名称</label>
          <input
            type="text"
            value={selectedNode.data.label}
            onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
            className="w-full px-2 py-1 text-sm border border-gray-600 rounded bg-gray-700 text-gray-200"
          />
        </div>

        {nodeType === 'dataSource' && (
          <div>
            <label className="text-xs text-gray-300 block mb-2">上传CSV文件</label>
            <label className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded cursor-pointer hover:bg-gray-600 transition-colors">
              <Upload size={16} className="text-gray-300" />
              <span className="text-sm text-gray-200">选择文件</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {plugin?.configSchema &&
          Object.entries(plugin.configSchema).map(([key, schema]: [string, any]) => {
            const isFieldSelector = key.includes('Field') || key.includes('Column');
            const showDropdown = isFieldSelector && availableColumns.length > 0;

            return (
              <div key={key}>
                <label className="text-xs text-gray-300 block mb-1">{schema.label}</label>
                {schema.type === 'select' ? (
                  <select
                    value={(selectedNode.data.config?.[key] as string) || ''}
                    onChange={(e) => handleConfigChange(key, e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-600 rounded bg-gray-700 text-gray-200"
                  >
                    <option value="">选择...</option>
                    {schema.options?.map((opt: any) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : schema.type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={(selectedNode.data.config?.[key] as boolean) || false}
                    onChange={(e) => handleConfigChange(key, e.target.checked)}
                    className="w-4 h-4"
                  />
                ) : showDropdown ? (
                  <select
                    value={(selectedNode.data.config?.[key] as string) || ''}
                    onChange={(e) => handleConfigChange(key, e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-600 rounded bg-gray-700 text-gray-200"
                  >
                    <option value="">选择字段...</option>
                    {availableColumns.map((col: string) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={(selectedNode.data.config?.[key] as string) || ''}
                    onChange={(e) => handleConfigChange(key, e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-600 rounded bg-gray-700 text-gray-200"
                  />
                )}
              </div>
            );
          })}

        {selectedNode.data.output ? (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-xs font-semibold text-gray-200 mb-2">
              {nodeType === 'chart' ? '图表预览' : '数据预览'}
            </h4>
            {nodeType === 'chart' && (selectedNode.data.output as any)?.type ? (
              <div className="bg-gray-700 rounded p-2">
                <SimpleChart data={selectedNode.data.output as any} />
              </div>
            ) : Array.isArray((selectedNode.data.output as any)?.rows) ? (
              <div className="bg-gray-700 rounded text-xs overflow-auto max-h-48">
                <table className="w-full text-gray-300">
                  <thead className="bg-gray-600 sticky top-0">
                    <tr>
                      {(selectedNode.data.output as any).columns?.map((col: string) => (
                        <th key={col} className="px-2 py-1 text-left font-semibold">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedNode.data.output as any).rows.slice(0, 5).map((row: any, i: number) => (
                      <tr key={i} className="border-t border-gray-600">
                        {(selectedNode.data.output as any).columns?.map((col: string) => (
                          <td key={col} className="px-2 py-1">{row[col]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-700 p-2 rounded text-xs overflow-auto max-h-48">
                <pre className="whitespace-pre-wrap text-gray-300">
                  {JSON.stringify(selectedNode.data.output, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
