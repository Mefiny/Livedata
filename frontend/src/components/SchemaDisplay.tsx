import { useAppStore } from '../stores/appStore';

const TYPE_COLORS: Record<string, string> = {
  numeric: '#00D67E',
  datetime: '#22D3EE',
  category: '#A78BFA',
  text: '#7C9A8A',
};

const TYPE_LABELS: Record<string, string> = {
  numeric: 'NUM',
  datetime: 'DATE',
  category: 'CAT',
  text: 'TXT',
};

export function SchemaDisplay() {
  const { schema } = useAppStore();

  if (!schema) return null;

  return (
    <div className="p-4">
      <div className="mb-3 text-[11px] text-[var(--text-tertiary)]">
        <span className="font-medium text-[var(--text-secondary)]">{schema.filename}</span>
        <span className="mx-1.5">|</span>
        <span>{schema.row_count.toLocaleString()} rows</span>
        <span className="mx-1.5">|</span>
        <span>{schema.column_count} cols</span>
      </div>

      <div className="space-y-1.5">
        {schema.columns.map((col) => (
          <div
            key={col.name}
            className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] hover:border-[var(--text-tertiary)] transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${TYPE_COLORS[col.semantic_type] || '#7C9A8A'}20`,
                  color: TYPE_COLORS[col.semantic_type] || '#7C9A8A',
                }}
              >
                {TYPE_LABELS[col.semantic_type] || 'UNK'}
              </span>
              <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                {col.name}
              </span>
            </div>

            <div className="text-[10px] text-[var(--text-tertiary)] space-y-0.5">
              {col.semantic_type === 'numeric' && col.stats && (
                <div>
                  Range: {col.stats.min.toLocaleString()} - {col.stats.max.toLocaleString()} |
                  Avg: {col.stats.mean.toLocaleString()}
                </div>
              )}
              {col.semantic_type === 'datetime' && col.date_info && (
                <div>
                  {col.date_info.min} to {col.date_info.max}
                  {col.date_info.frequency && ` (${col.date_info.frequency})`}
                </div>
              )}
              {col.semantic_type === 'category' && col.categories && (
                <div>
                  {col.unique_count} unique | Top: {col.categories.top_value} (
                  {col.categories.top_percentage}%)
                </div>
              )}
              {col.null_count > 0 && (
                <div className="text-[var(--warning)]">
                  {col.null_count} nulls ({col.null_percentage}%)
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
