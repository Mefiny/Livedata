import { useRef, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppStore } from '../stores/appStore';

const DARK_THEME = {
  backgroundColor: 'transparent',
  textStyle: { color: '#7C9A8A' },
  title: { textStyle: { color: '#E8EDE9' }, subtextStyle: { color: '#7C9A8A' } },
  legend: { textStyle: { color: '#7C9A8A' } },
  tooltip: {
    backgroundColor: '#111A16',
    borderColor: '#1E3A2E',
    textStyle: { color: '#E8EDE9' },
  },
  xAxis: {
    axisLine: { lineStyle: { color: '#1E3A2E' } },
    axisLabel: { color: '#7C9A8A' },
    splitLine: { lineStyle: { color: '#1E3A2E' } },
  },
  yAxis: {
    axisLine: { lineStyle: { color: '#1E3A2E' } },
    axisLabel: { color: '#7C9A8A' },
    splitLine: { lineStyle: { color: '#1E3A2E' } },
  },
};

function applyDarkTheme(config: Record<string, unknown>): Record<string, unknown> {
  return {
    ...config,
    backgroundColor: 'transparent',
    textStyle: { ...(config.textStyle as object || {}), ...DARK_THEME.textStyle },
    tooltip: { ...(config.tooltip as object || {}), ...DARK_THEME.tooltip },
    xAxis: config.xAxis
      ? Array.isArray(config.xAxis)
        ? (config.xAxis as object[]).map((ax) => ({ ...ax, ...DARK_THEME.xAxis }))
        : { ...(config.xAxis as object), ...DARK_THEME.xAxis }
      : undefined,
    yAxis: config.yAxis
      ? Array.isArray(config.yAxis)
        ? (config.yAxis as object[]).map((ax) => ({ ...ax, ...DARK_THEME.yAxis }))
        : { ...(config.yAxis as object), ...DARK_THEME.yAxis }
      : undefined,
    legend: config.legend
      ? { ...(config.legend as object), ...DARK_THEME.legend }
      : undefined,
  };
}

interface ChartCardProps {
  id: string;
  config: Record<string, unknown>;
  summary?: string;
}

export function ChartCard({ id, config, summary }: ChartCardProps) {
  const chartRef = useRef<ReactECharts>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { removeChart } = useAppStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    const handleResize = () => chartRef.current?.getEchartsInstance().resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Resize chart when entering/exiting fullscreen
    setTimeout(() => chartRef.current?.getEchartsInstance().resize(), 50);
  }, [isFullscreen]);

  const darkConfig = applyDarkTheme(config);

  const chartContent = (
    <>
      <div className="flex items-center justify-between px-3 pt-2.5">
        <div className="flex items-center gap-2">
          {!isFullscreen && (
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              title="Drag to reorder"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/>
                <circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/>
                <circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>
              </svg>
            </button>
          )}
          {summary && (
            <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed truncate max-w-[280px]">
              {summary}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="14" x2="21" y1="10" y2="3" />
                <line x1="3" x2="10" y1="21" y2="14" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" x2="14" y1="3" y2="10" />
                <line x1="3" x2="10" y1="21" y2="14" />
              </svg>
            )}
          </button>
          <button
            onClick={() => removeChart(id)}
            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors cursor-pointer"
            title="Remove chart"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      <ReactECharts
        ref={chartRef}
        option={darkConfig}
        style={{ height: isFullscreen ? 'calc(100vh - 60px)' : '320px', width: '100%' }}
        opts={{ renderer: 'canvas' }}
        lazyUpdate={true}
      />
    </>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--bg-primary)] overflow-auto">
        {chartContent}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden hover:border-[var(--text-tertiary)] transition-colors"
    >
      {chartContent}
    </div>
  );
}
