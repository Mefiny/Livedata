import { useState } from 'react';
import { Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { useAppStore } from '../stores/appStore';

export function AIInsightPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [insights, setInsights] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { components, schema } = useAppStore();

  const handleAnalyze = async () => {
    if (!schema || components.length === 0) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components, schema }),
      });
      const data = await response.json();
      setInsights(data.insights);
      setIsExpanded(true);
    } catch (error) {
      console.error('分析失败:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`bg-white border-t border-gray-200 transition-all ${isExpanded ? 'h-64' : 'h-14'}`}>
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-purple-500" />
          <span className="font-medium text-sm">AI 数据洞察</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || components.length === 0}
            className="px-4 py-1.5 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {isAnalyzing ? '分析中...' : '生成洞察'}
          </button>
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-500">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="p-4 h-[calc(100%-56px)] overflow-auto">
          {insights ? (
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{insights}</div>
          ) : (
            <p className="text-sm text-gray-400">点击"生成洞察"让 AI 分析你的数据</p>
          )}
        </div>
      )}
    </div>
  );
}
