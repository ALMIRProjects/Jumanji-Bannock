import { useState, type FormEvent } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { submitHighScore } from '@/lib/highScores';

interface GameOverPanelProps {
  score: number;
  onPlayAgain: () => void;
  onSaved: () => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function GameOverPanel({ score, onPlayAgain, onSaved }: GameOverPanelProps) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<SaveStatus>('idle');
  const trimmedName = name.trim();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedName || status === 'saving' || status === 'saved') return;

    setStatus('saving');
    try {
      await submitHighScore(trimmedName, score);
      setStatus('saved');
      onSaved();
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/80 p-6 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
      <div className="w-full max-w-sm text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-300">
          The jungle got you
        </p>
        <p className="mt-3 text-sm text-emerald-100">Final score</p>
        <p className="text-6xl font-black tabular-nums text-amber-300">{score}</p>

        {status === 'saved' ? (
          <p className="mt-6 rounded-xl bg-emerald-800/70 px-4 py-3 text-sm font-medium text-emerald-100">
            Score saved to the leaderboard.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3 text-left">
            <label htmlFor="player-name" className="block text-xs font-semibold uppercase tracking-wider text-emerald-200">
              Save your score
            </label>
            <div className="flex gap-2">
              <input
                id="player-name"
                type="text"
                value={name}
                maxLength={16}
                autoComplete="off"
                placeholder="Explorer name"
                onChange={(event) => {
                  setName(event.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                className="min-w-0 flex-1 rounded-xl border border-emerald-600 bg-emerald-950 px-4 py-3 text-sm text-emerald-50 placeholder:text-emerald-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/40"
              />
              <button
                type="submit"
                disabled={!trimmedName || status === 'saving'}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-emerald-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {status === 'saving' ? 'Saving' : 'Save'}
              </button>
            </div>
            {status === 'error' && (
              <p role="alert" className="text-xs text-rose-300">
                Could not save your score. Check your connection and try again.
              </p>
            )}
          </form>
        )}

        <button
          type="button"
          onClick={onPlayAgain}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/40 px-6 py-3 text-sm font-bold text-emerald-50 transition hover:-translate-y-0.5 hover:bg-emerald-800/60 active:translate-y-0"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Run again
        </button>
      </div>
    </div>
  );
}
