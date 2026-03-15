import { useAppStore } from '../stores/appStore';

interface VoiceButtonProps {
  onToggle: () => void;
}

export function VoiceButton({ onToggle }: VoiceButtonProps) {
  const { isMicActive, isConnected, agentStatus } = useAppStore();

  const handleToggle = () => {
    if (!isConnected) return;
    onToggle();
  };

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (isMicActive) return 'Listening...';
    switch (agentStatus) {
      case 'thinking':
        return 'Thinking...';
      case 'speaking':
        return 'Speaking...';
      default:
        return 'Click to speak';
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        {isMicActive && (
          <div className="absolute inset-0 rounded-full bg-[var(--accent)] pulse-ring" />
        )}
        <button
          onClick={handleToggle}
          disabled={!isConnected}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer border-2 ${
            isMicActive
              ? 'bg-[var(--accent)] border-[var(--accent-bright)] text-[var(--bg-primary)] shadow-[0_0_20px_rgba(0,214,126,0.4)]'
              : 'bg-[var(--bg-tertiary)] border-[var(--border)] text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)]'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {isMicActive ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          )}
        </button>
      </div>
      <span className="text-[10px] text-[var(--text-tertiary)]">{getStatusText()}</span>
    </div>
  );
}
