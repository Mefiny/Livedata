import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore, createChatEntry } from '../stores/appStore';
import { useAudioSession } from '../audio/useAudioSession';
import { VoiceButton } from './VoiceButton';
import { AudioVisualizer } from './AudioVisualizer';

function TypingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (text.length <= 20) {
      setDisplayed(text);
      setDone(true);
      return;
    }
    let i = 0;
    setDisplayed('');
    setDone(false);
    const interval = setInterval(() => {
      i += 2;
      if (i >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(interval);
      } else {
        setDisplayed(text.slice(0, i));
      }
    }, 12);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && <span className="typing-cursor" />}
    </span>
  );
}

export function ChatPanel() {
  const { chatMessages, addChatMessage, sessionId, isConnected, setIsConnected, isMicActive } =
    useAppStore();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [latestAgentMsgId, setLatestAgentMsgId] = useState<string | null>(null);

  const { startCapture, stopCapture, playAudioChunk, stopPlayback, analyserRef } = useAudioSession(wsRef);

  const playAudioRef = useRef(playAudioChunk);
  const stopPlaybackRef = useRef(stopPlayback);
  playAudioRef.current = playAudioChunk;
  stopPlaybackRef.current = stopPlayback;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (!sessionId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/ws/${sessionId}`);

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'transcript': {
            const entry = createChatEntry(msg.role, msg.text);
            addChatMessage(entry);
            if (msg.role === 'agent') setLatestAgentMsgId(entry.id);
            break;
          }
          case 'chart':
            useAppStore.getState().addChart(msg.config, msg.summary);
            break;
          case 'status':
            useAppStore.getState().setAgentStatus(msg.status);
            break;
          case 'audio':
            playAudioRef.current(msg.data);
            break;
          case 'interrupted':
            stopPlaybackRef.current();
            break;
          case 'error':
            addChatMessage(createChatEntry('agent', `Error: ${msg.message}`));
            break;
        }
      } catch (err) {
        console.error('Failed to parse WS message:', err);
      }
    };

    wsRef.current = ws;
    return () => { ws.close(); };
  }, [sessionId, setIsConnected, addChatMessage]);

  const sendText = useCallback(
    (text: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(JSON.stringify({ type: 'text', text }));
      addChatMessage(createChatEntry('user', text));
    },
    [addChatMessage]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    sendText(text);
    setInputText('');
  };

  const handleVoiceToggle = useCallback(async () => {
    if (isMicActive) {
      stopCapture();
    } else {
      await startCapture();
    }
  }, [isMicActive, startCapture, stopCapture]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {chatMessages.length === 0 && (
          <div className="text-center mt-12">
            <div className="w-12 h-12 rounded-full bg-[var(--accent-dim)] flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">Ask me anything about your data</p>
            <p className="mt-2 text-xs text-[var(--text-tertiary)]">Try: "Show me my spending trends"</p>
            <p className="text-xs text-[var(--text-tertiary)]">Or click the mic to talk</p>
          </div>
        )}
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--border)] rounded-br-sm'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-sm'
              }`}
            >
              {msg.role === 'agent' && msg.id === latestAgentMsgId ? (
                <TypingText text={msg.text} />
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Audio visualizer */}
      {isMicActive && (
        <div className="px-4">
          <AudioVisualizer analyserNode={analyserRef.current} />
        </div>
      )}

      {/* Voice button */}
      <div className="flex justify-center py-3">
        <VoiceButton onToggle={handleVoiceToggle} />
      </div>

      {/* Text input */}
      <form onSubmit={handleSubmit} className="px-4 pb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isConnected ? 'Type a question...' : 'Connecting...'}
            disabled={!isConnected}
            className="flex-1 px-3.5 py-2.5 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={!isConnected || !inputText.trim()}
            className="px-4 py-2.5 bg-[var(--accent)] text-[var(--bg-primary)] text-sm font-medium rounded-lg hover:bg-[var(--accent-bright)] disabled:opacity-30 transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" x2="11" y1="2" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
