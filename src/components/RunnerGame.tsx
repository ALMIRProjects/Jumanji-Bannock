import { useCallback, useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import GameOverPanel from '@/components/GameOverPanel';
import { WORLD_HEIGHT, WORLD_WIDTH } from '@/game/config';
import { drawWorld } from '@/game/render';
import { createWorld, stepWorld, type WorldState } from '@/game/world';

type Phase = 'ready' | 'running' | 'over';

interface RunnerGameProps {
  onScoreSaved: () => void;
}

const TYPING_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];

export default function RunnerGame({ onScoreSaved }: RunnerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<WorldState>(createWorld());
  const phaseRef = useRef<Phase>('ready');
  const jumpQueuedRef = useRef(false);
  const duckRef = useRef(false);

  const [phase, setPhase] = useState<Phase>('ready');
  const [finalScore, setFinalScore] = useState(0);

  const startRun = useCallback(() => {
    worldRef.current = createWorld();
    phaseRef.current = 'running';
    setPhase('running');
  }, []);

  const jump = useCallback(() => {
    if (phaseRef.current === 'ready') startRun();
    if (phaseRef.current === 'running') jumpQueuedRef.current = true;
  }, [startRun]);

  const releaseDuck = useCallback(() => {
    duckRef.current = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = WORLD_WIDTH * dpr;
    canvas.height = WORLD_HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let frameId = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      if (phaseRef.current === 'running') {
        stepWorld(worldRef.current, dt, {
          jumpPressed: jumpQueuedRef.current,
          duck: duckRef.current,
        });
        jumpQueuedRef.current = false;

        if (worldRef.current.dead) {
          phaseRef.current = 'over';
          setFinalScore(Math.floor(worldRef.current.score));
          setPhase('over');
        }
      }

      drawWorld(ctx, worldRef.current);
      frameId = requestAnimationFrame(frame);
    };

    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const isTyping = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.isContentEditable || TYPING_TAGS.includes(target.tagName));

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        event.preventDefault();
        if (!event.repeat) jump();
      } else if (event.code === 'ArrowDown') {
        event.preventDefault();
        duckRef.current = true;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'ArrowDown') releaseDuck();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [jump, releaseDuck]);

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-3xl bg-emerald-900 shadow-2xl shadow-black/40 ring-1 ring-amber-300/20">
        <canvas
          ref={canvasRef}
          onPointerDown={jump}
          className="block h-auto w-full touch-none select-none"
          style={{ aspectRatio: `${WORLD_WIDTH} / ${WORLD_HEIGHT}` }}
          aria-label="Jumanji Run game. Press space or tap to jump, down arrow to slide."
          role="img"
        />

        {phase === 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/70 p-6 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
            <div className="max-w-md text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
                Ready, explorer?
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-amber-50 sm:text-4xl">
                Outrun the jungle
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-emerald-100">
                Jump stones and logs, slide under the bats, and grab the golden idols
                for bonus points. The longer you run, the faster the jungle moves.
              </p>
              <button
                type="button"
                onClick={jump}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-emerald-950 shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:bg-amber-300 active:translate-y-0"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                Start run
              </button>
              <p className="mt-4 hidden text-xs text-emerald-200/80 md:block">
                Space or Up to jump, Down to slide
              </p>
            </div>
          </div>
        )}

        {phase === 'over' && (
          <GameOverPanel
            score={finalScore}
            onPlayAgain={startRun}
            onSaved={onScoreSaved}
          />
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:hidden">
        <button
          type="button"
          onPointerDown={jump}
          className="touch-none select-none rounded-2xl bg-amber-400 py-4 text-base font-bold text-emerald-950 active:bg-amber-300"
        >
          Jump
        </button>
        <button
          type="button"
          onPointerDown={() => {
            duckRef.current = true;
          }}
          onPointerUp={releaseDuck}
          onPointerLeave={releaseDuck}
          onPointerCancel={releaseDuck}
          className="touch-none select-none rounded-2xl bg-emerald-700 py-4 text-base font-bold text-emerald-50 active:bg-emerald-600"
        >
          Slide
        </button>
      </div>
    </div>
  );
}
