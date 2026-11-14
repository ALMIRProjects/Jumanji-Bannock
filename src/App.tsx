import { useState } from 'react';
import { Trees } from 'lucide-react';
import Leaderboard from '@/components/Leaderboard';
import RunnerGame from '@/components/RunnerGame';

export default function App() {
  const [boardVersion, setBoardVersion] = useState(0);

  return (
    <div className="min-h-screen bg-emerald-950 text-emerald-50">
      <header className="border-b border-emerald-800/60">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5 sm:px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-emerald-950 shadow-lg shadow-amber-500/20">
            <Trees className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-amber-50">Jumanji Run</h1>
            <p className="text-xs text-emerald-200">An endless dash through the jungle</p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-12">
        <RunnerGame onScoreSaved={() => setBoardVersion((version) => version + 1)} />
        <aside>
          <Leaderboard refreshKey={boardVersion} />
        </aside>
      </main>
    </div>
  );
}
