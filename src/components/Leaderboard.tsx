import { useEffect, useState } from 'react';
import { RefreshCw, Trophy } from 'lucide-react';
import { fetchTopScores, type HighScore } from '@/lib/highScores';

interface LeaderboardProps {
  refreshKey: number;
}

type LoadStatus = 'loading' | 'ready' | 'error';

const RANK_STYLES = [
  'bg-amber-400 text-emerald-950',
  'bg-slate-300 text-emerald-950',
  'bg-orange-300 text-emerald-950',
];

export default function Leaderboard({ refreshKey }: LeaderboardProps) {
  const [scores, setScores] = useState<HighScore[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus('loading');

    fetchTopScores()
      .then((rows) => {
        if (!active) return;
        setScores(rows);
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [refreshKey, retryKey]);

  return (
    <section className="rounded-3xl bg-emerald-900/60 p-6 ring-1 ring-amber-300/15">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-emerald-950">
          <Trophy className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-amber-50">Top explorers</h2>
          <p className="text-xs text-emerald-200">Best runs across the jungle</p>
        </div>
      </div>

      <div className="mt-6">
        {status === 'loading' && (
          <p className="py-8 text-center text-sm text-emerald-200">Loading leaderboard...</p>
        )}

        {status === 'error' && (
          <div className="py-8 text-center">
            <p className="text-sm text-rose-300">Couldn't load the leaderboard.</p>
            <button
              type="button"
              onClick={() => setRetryKey((key) => key + 1)}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/40 px-4 py-2 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-800/60"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Try again
            </button>
          </div>
        )}

        {status === 'ready' && scores.length === 0 && (
          <p className="py-8 text-center text-sm text-emerald-200">
            No scores yet. Be the first explorer on the board.
          </p>
        )}

        {status === 'ready' && scores.length > 0 && (
          <ol className="space-y-2">
            {scores.map((entry, index) => (
              <li
                key={entry.id}
                className="flex items-center gap-3 rounded-2xl bg-emerald-950/50 px-3 py-2.5 transition hover:bg-emerald-800/50"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    RANK_STYLES[index] ?? 'bg-emerald-800 text-emerald-100'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-50">
                  {entry.playerName}
                </span>
                <span className="text-sm font-bold tabular-nums text-amber-300">
                  {entry.score.toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
