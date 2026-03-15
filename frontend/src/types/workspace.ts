export type ComponentType = 'chart' | 'filter' | 'data-table' | 'text';

export interface WorkspaceComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  w: number;
  h: number;
  config: Record<string, unknown>;
}

export interface FilterConfig {
  field: string;
  type: 'date-range' | 'category' | 'numeric-range';
  value: unknown;
}
