import { useState, useCallback } from 'react';
import { useAppStore, createChatEntry } from '../stores/appStore';
import { uploadCSV, loadSampleDataset } from '../services/api';

const SCENARIOS = [
  {
    id: 'personal_finance',
    name: 'Personal Finance',
    description: 'Analyze 12 months of transactions, spending categories, and merchants',
  },
  {
    id: 'health_tracker',
    name: 'Health Tracker',
    description: 'Track steps, calories, sleep, heart rate, and mood over 90 days',
  },
  {
    id: 'student_grades',
    name: 'Student Grades',
    description: 'Review academic performance across subjects and semesters',
  },
];

function WalletIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

function HeartPulseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <path d="M8 7h6" />
      <path d="M8 11h8" />
    </svg>
  );
}

const SCENARIO_ICONS: Record<string, React.FC> = {
  personal_finance: WalletIcon,
  health_tracker: HeartPulseIcon,
  student_grades: BookIcon,
};

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="var(--accent)" strokeWidth="3" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function WelcomeScreen() {
  const { sessionId, setView, setSchema, addChatMessage } = useAppStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleScenario = useCallback(
    async (scenarioId: string) => {
      if (!sessionId) return;
      setLoading(scenarioId);
      try {
        const result = await loadSampleDataset(sessionId, scenarioId);
        setSchema(result.schema);
        addChatMessage(
          createChatEntry(
            'agent',
            `I've loaded the ${SCENARIOS.find((s) => s.id === scenarioId)?.name} dataset. ${result.schema.summary} What would you like to know?`
          )
        );
        setView('main');
      } catch (err) {
        console.error('Failed to load sample:', err);
      } finally {
        setLoading(null);
      }
    },
    [sessionId, setView, setSchema, addChatMessage]
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!sessionId) return;
      if (!file.name.endsWith('.csv')) {
        alert('Please upload a CSV file');
        return;
      }
      setLoading('upload');
      try {
        const result = await uploadCSV(sessionId, file);
        setSchema(result.schema);
        addChatMessage(
          createChatEntry(
            'agent',
            `I've loaded your file "${result.filename}". ${result.schema.summary} What would you like to analyze?`
          )
        );
        setView('main');
      } catch (err) {
        console.error('Failed to upload:', err);
        alert('Failed to upload file. Please try again.');
      } finally {
        setLoading(null);
      }
    },
    [sessionId, setView, setSchema, addChatMessage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  return (
    <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-2xl w-full px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-dim)] flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
            Live<span className="text-[var(--accent)]">Data</span> OS
          </h1>
          <p className="text-base text-[var(--text-secondary)]">
            Voice-powered data analysis assistant
          </p>
        </div>

        {/* Scenario cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {SCENARIOS.map((scenario) => {
            const IconComponent = SCENARIO_ICONS[scenario.id];
            return (
              <button
                key={scenario.id}
                onClick={() => handleScenario(scenario.id)}
                disabled={loading !== null}
                className="group p-5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] hover:border-[var(--accent)] transition-all text-left disabled:opacity-50 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-lg bg-[var(--accent-dim)] flex items-center justify-center mb-3 group-hover:bg-[var(--bg-elevated)] transition-colors">
                  {IconComponent && <IconComponent />}
                </div>
                <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-1">
                  {scenario.name}
                </h3>
                <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                  {scenario.description}
                </p>
                {loading === scenario.id && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-[var(--accent)]">
                    <Spinner /> Loading...
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Upload zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragOver
              ? 'border-[var(--accent)] bg-[var(--accent-dim)]'
              : 'border-[var(--border)] hover:border-[var(--text-tertiary)]'
          }`}
        >
          <div className="flex justify-center mb-3 text-[var(--text-tertiary)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Or drag & drop your own CSV file here
          </p>
          <label className="inline-block px-5 py-2 bg-[var(--accent-dim)] text-[var(--accent)] rounded-lg text-sm cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors border border-[var(--border)]">
            Choose File
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </label>
          {loading === 'upload' && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[var(--accent)]">
              <Spinner /> Uploading...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
