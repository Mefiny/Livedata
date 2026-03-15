import { useAppStore } from '../stores/appStore';

export function DataOverview() {
  const { schema } = useAppStore();

  if (!schema) return null;

  const numericCols = schema.columns.filter((c) => c.semantic_type === 'numeric' && c.stats);

  const cards: Array<{ label: string; value: string; sub?: string }> = [
    { label: 'Rows', value: schema.row_count.toLocaleString() },
    { label: 'Columns', value: String(schema.column_count) },
  ];

  // Add up to 3 numeric column stats
  for (const col of numericCols.slice(0, 3)) {
    if (col.stats) {
      cards.push({
        label: col.name,
        value: col.stats.mean.toLocaleString(undefined, { maximumFractionDigits: 1 }),
        sub: `${col.stats.min.toLocaleString()} - ${col.stats.max.toLocaleString()}`,
      });
    }
  }

  return (
    <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="flex gap-3 overflow-x-auto">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex-shrink-0 px-4 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] min-w-[120px]"
          >
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
              {card.label}
            </div>
            <div className="text-lg font-bold text-[var(--accent)]">{card.value}</div>
            {card.sub && (
              <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{card.sub}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
