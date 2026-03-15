import { useAppStore } from '../stores/appStore';
import { ChartCard } from './ChartCard';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

export function ChartDashboard() {
  const { charts, reorderCharts } = useAppStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderCharts(String(active.id), String(over.id));
    }
  };

  if (charts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="w-14 h-14 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" x2="18" y1="20" y2="10" />
              <line x1="12" x2="12" y1="20" y2="4" />
              <line x1="6" x2="6" y1="20" y2="14" />
            </svg>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">Charts will appear here</p>
          <p className="text-xs mt-1 text-[var(--text-tertiary)]">Ask about trends, categories, or anomalies</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg-primary)]">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={charts.map((c) => c.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {charts.map((chart) => (
              <ChartCard
                key={chart.id}
                id={chart.id}
                config={chart.config}
                summary={chart.summary}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
