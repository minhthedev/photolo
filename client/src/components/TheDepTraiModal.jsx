import { useEffect, useMemo, useRef, useState } from 'react';

const CELEBRATION_MS = 3200;
const FLOWERS = ['🌸', '🌺', '🌷', '💐', '🎉', '✨', '🎆', '🌻', '💖', '🎊'];
const CONFETTI_COLORS = ['#ff3b5c', '#ffd166', '#06d6a0', '#118ab2', '#ef476f', '#ff9f1c'];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function TheDepTraiModal({ open, onConfirm }) {
  const [yesScale, setYesScale] = useState(1);
  const [phase, setPhase] = useState('question');
  const timerRef = useRef(null);

  const fireworks = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: `${randomBetween(8, 92)}%`,
        top: `${randomBetween(10, 70)}%`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: `${randomBetween(0, 800)}ms`,
      })),
    [phase]
  );

  const flowers = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        emoji: FLOWERS[i % FLOWERS.length],
        left: `${randomBetween(0, 100)}%`,
        bottom: `${randomBetween(-5, 15)}%`,
        size: randomBetween(1.2, 2.4),
        delay: `${randomBetween(0, 1200)}ms`,
        duration: `${randomBetween(2200, 3200)}ms`,
      })),
    [phase]
  );

  const confetti = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: `${randomBetween(0, 100)}%`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        width: randomBetween(6, 12),
        height: randomBetween(10, 18),
        delay: `${randomBetween(0, 900)}ms`,
        duration: `${randomBetween(1800, 2800)}ms`,
      })),
    [phase]
  );

  useEffect(() => {
    if (open) {
      setYesScale(1);
      setPhase('question');
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [open]);

  const handleYes = () => {
    setPhase('celebration');
    timerRef.current = setTimeout(() => {
      onConfirm();
    }, CELEBRATION_MS);
  };

  if (!open) {
    return null;
  }

  if (phase === 'celebration') {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden bg-gradient-to-b from-[#1a0a2e] via-[#0a0a0b] to-[#160812]">
        {fireworks.map((fw) => (
          <div
            key={fw.id}
            className="pointer-events-none absolute animate-firework-burst rounded-full"
            style={{
              left: fw.left,
              top: fw.top,
              width: '80px',
              height: '80px',
              marginLeft: '-40px',
              marginTop: '-40px',
              animationDelay: fw.delay,
              background: `radial-gradient(circle, ${fw.color} 0%, ${fw.color}88 25%, transparent 70%)`,
              boxShadow: `0 0 40px ${fw.color}, 0 0 80px ${fw.color}66`,
            }}
          />
        ))}

        {confetti.map((piece) => (
          <div
            key={piece.id}
            className="pointer-events-none absolute top-0 animate-confetti-fall rounded-sm"
            style={{
              left: piece.left,
              width: `${piece.width}px`,
              height: `${piece.height}px`,
              backgroundColor: piece.color,
              animationDelay: piece.delay,
              animationDuration: piece.duration,
            }}
          />
        ))}

        {flowers.map((flower) => (
          <span
            key={flower.id}
            className="pointer-events-none absolute animate-float-particle select-none"
            style={{
              left: flower.left,
              bottom: flower.bottom,
              fontSize: `${flower.size}rem`,
              animationDelay: flower.delay,
              animationDuration: flower.duration,
            }}
          >
            {flower.emoji}
          </span>
        ))}

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <p className="mb-3 animate-celebrate-pop text-5xl">🎆</p>
          <h2 className="animate-celebrate-pop text-2xl font-bold leading-tight text-white sm:text-4xl">
            Chúc mừng!
          </h2>
          <p
            className="mt-4 max-w-md animate-celebrate-pop text-lg font-semibold text-accent sm:text-2xl"
            style={{ animationDelay: '0.15s' }}
          >
            Bạn giống tôi cũng đẹp trai ✨
          </p>
          <p
            className="mt-6 animate-celebrate-pop text-sm text-white/50"
            style={{ animationDelay: '0.3s' }}
          >
            Đang vào hệ thống...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg animate-scale-in rounded-3xl border border-accent/30 bg-surface-card p-8 text-center shadow-2xl shadow-accent/20">
        <p className="mb-8 text-2xl font-bold leading-snug text-white sm:text-3xl">
          Anh Thế đẹp trai không?
        </p>

        <div className="flex min-h-[140px] flex-col items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleYes}
            style={{ transform: `scale(${yesScale})` }}
            className="rounded-2xl bg-accent px-10 py-5 text-2xl font-bold text-white shadow-lg shadow-accent/40 transition-transform duration-300 hover:bg-accent/90 sm:px-14 sm:py-6 sm:text-3xl"
          >
            Có
          </button>

          <button
            type="button"
            onClick={() => setYesScale((prev) => Math.min(prev + 0.4, 5))}
            className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-white/30 transition hover:text-white/50"
          >
            Không
          </button>
        </div>
      </div>
    </div>
  );
}

export default TheDepTraiModal;
