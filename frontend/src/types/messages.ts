export interface WebSocketMessage {
  type: 'text' | 'audio' | 'transcript' | 'chart' | 'schema' | 'analysis_plan' | 'status' | 'error' | 'ping' | 'pong' | 'interrupted' | 'audio_stop';
}

export interface TextMessage extends WebSocketMessage {
  type: 'text';
  text: string;
}

export interface AudioMessage extends WebSocketMessage {
  type: 'audio';
  data: string; // base64 encoded PCM
  mime_type: string;
}

export interface TranscriptMessage extends WebSocketMessage {
  type: 'transcript';
  text: string;
  role: 'user' | 'agent';
}

export interface ChartMessage extends WebSocketMessage {
  type: 'chart';
  config: Record<string, unknown>; // ECharts option
  summary?: string;
}

export interface SchemaMessage extends WebSocketMessage {
  type: 'schema';
  schema: DataSchema;
}

export interface AnalysisPlanMessage extends WebSocketMessage {
  type: 'analysis_plan';
  steps: AnalysisStep[];
}

export interface StatusMessage extends WebSocketMessage {
  type: 'status';
  status: 'thinking' | 'speaking' | 'idle';
}

export interface ErrorMessage extends WebSocketMessage {
  type: 'error';
  message: string;
}

export interface ChatEntry {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: number;
}

export interface AnalysisStep {
  name: string;
  status: 'pending' | 'running' | 'done';
}

export interface DataSchema {
  filename: string;
  row_count: number;
  column_count: number;
  columns: ColumnInfo[];
  summary: string;
}

export interface ColumnInfo {
  name: string;
  dtype: string;
  semantic_type: 'numeric' | 'datetime' | 'category' | 'text';
  null_count: number;
  null_percentage: number;
  unique_count: number;
  sample_values: (string | number)[];
  stats?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    std: number;
    sum: number;
  };
  date_info?: {
    min: string;
    max: string;
    frequency?: string;
  };
  categories?: {
    values: Record<string, number>;
    top_value: string | null;
    top_count: number;
    top_percentage: number;
  };
}
