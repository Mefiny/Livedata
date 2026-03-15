import { create } from 'zustand';
import type { ChatEntry, DataSchema, AnalysisStep } from '../types/messages';
import type { WorkspaceComponent } from '../types/workspace';

type AgentStatus = 'idle' | 'listening' | 'thinking' | 'speaking';
type AppView = 'welcome' | 'main';

interface ChartItem {
  id: string;
  config: Record<string, unknown>;
  summary?: string;
}

interface AppState {
  // Session
  sessionId: string | null;
  setSessionId: (id: string) => void;

  // View
  view: AppView;
  setView: (view: AppView) => void;

  // Connection
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;

  // Agent status
  agentStatus: AgentStatus;
  setAgentStatus: (status: AgentStatus) => void;

  // Chat
  chatMessages: ChatEntry[];
  addChatMessage: (msg: ChatEntry) => void;
  clearChat: () => void;

  // Data
  schema: DataSchema | null;
  setSchema: (schema: DataSchema | null) => void;

  // Charts
  charts: ChartItem[];
  addChart: (config: Record<string, unknown>, summary?: string) => void;
  removeChart: (id: string) => void;
  reorderCharts: (activeId: string, overId: string) => void;
  clearCharts: () => void;

  // Analysis plan
  analysisSteps: AnalysisStep[];
  setAnalysisSteps: (steps: AnalysisStep[]) => void;

  // Audio
  isMicActive: boolean;
  setIsMicActive: (active: boolean) => void;

  // Workspace components
  components: WorkspaceComponent[];
  addComponent: (component: Omit<WorkspaceComponent, 'id'>) => void;
  updateComponent: (id: string, updates: Partial<WorkspaceComponent>) => void;
  removeComponent: (id: string) => void;
  selectedComponentId: string | null;
  setSelectedComponentId: (id: string | null) => void;
}

let chartCounter = 0;
let msgCounter = 0;
let componentCounter = 0;

export const useAppStore = create<AppState>((set) => ({
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),

  view: 'main',
  setView: (view) => set({ view }),

  isConnected: false,
  setIsConnected: (connected) => set({ isConnected: connected }),

  agentStatus: 'idle',
  setAgentStatus: (status) => set({ agentStatus: status }),

  chatMessages: [],
  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  clearChat: () => set({ chatMessages: [] }),

  schema: null,
  setSchema: (schema) => set({ schema }),

  charts: [],
  addChart: (config, summary) =>
    set((state) => {
      const newChart: ChartItem = { id: `chart-${++chartCounter}`, config, summary };
      return { charts: [...state.charts, newChart] };
    }),
  removeChart: (id) =>
    set((state) => ({
      charts: state.charts.filter((c) => c.id !== id),
    })),
  reorderCharts: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.charts.findIndex((c) => c.id === activeId);
      const newIndex = state.charts.findIndex((c) => c.id === overId);
      if (oldIndex === -1 || newIndex === -1) return state;
      const newCharts = [...state.charts];
      const [removed] = newCharts.splice(oldIndex, 1);
      newCharts.splice(newIndex, 0, removed);
      return { charts: newCharts };
    }),
  clearCharts: () => set({ charts: [] }),

  analysisSteps: [],
  setAnalysisSteps: (steps) => set({ analysisSteps: steps }),

  isMicActive: false,
  setIsMicActive: (active) => set({ isMicActive: active }),

  components: [],
  addComponent: (component) =>
    set((state) => ({
      components: [...state.components, { ...component, id: `comp-${++componentCounter}` }],
    })),
  updateComponent: (id, updates) =>
    set((state) => ({
      components: state.components.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeComponent: (id) =>
    set((state) => ({
      components: state.components.filter((c) => c.id !== id),
    })),
  selectedComponentId: null,
  setSelectedComponentId: (id) => set({ selectedComponentId: id }),
}));

export function createChatEntry(role: 'user' | 'agent', text: string): ChatEntry {
  return {
    id: `msg-${++msgCounter}-${Date.now()}`,
    role,
    text,
    timestamp: Date.now(),
  };
}
