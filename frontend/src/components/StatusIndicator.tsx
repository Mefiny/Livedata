import { useAppStore } from '../stores/appStore';

export function StatusIndicator() {
  const { isConnected, agentStatus } = useAppStore();

  const getColor = () => {
    if (!isConnected) return 'var(--danger)';
    switch (agentStatus) {
      case 'thinking':
        return 'var(--warning)';
      case 'speaking':
        return '#22D3EE';
      case 'listening':
        return 'var(--accent)';
      default:
        return 'var(--accent)';
    }
  };

  const getLabel = () => {
    if (!isConnected) return 'Offline';
    switch (agentStatus) {
      case 'thinking':
        return 'Analyzing';
      case 'speaking':
        return 'Speaking';
      case 'listening':
        return 'Listening';
      default:
        return 'Ready';
    }
  };

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)]">
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: getColor() }}
      />
      <span className="text-[10px] text-[var(--text-secondary)]">{getLabel()}</span>
    </div>
  );
}
