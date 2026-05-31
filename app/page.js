'use client';

import Link from 'next/link';
import { useGameStore } from '@/lib/gameStore';

export default function HomePage() {
  const gameHistory = useGameStore((s) => s.gameHistory);
  const resetGame = useGameStore((s) => s.resetGame);

  const handleNewGame = () => {
    resetGame();
  };

  return (
    <div className="page page--center">
      <div className="fade-in" style={{ marginTop: '-40px' }}>
        <div className="start-logo">🎯</div>
        <h1 className="title title--xl">Alias</h1>
        <p className="subtitle">
          Пояснюй слова, грай з друзями!<br />
          Мобільна гра для компанії
        </p>

        <div className="start-buttons">
          <Link href="/setup" onClick={handleNewGame} className="btn btn--primary btn--lg btn--full" id="btn-new-game">
            🎮 Нова гра
          </Link>
          <Link href="/history" className="btn btn--ghost btn--full" id="btn-history">
            📜 Історія ігор
            {gameHistory.length > 0 && (
              <span className="counter-badge">{gameHistory.length}</span>
            )}
          </Link>
        </div>
      </div>

      <div className="slide-up" style={{ marginTop: '48px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
        <p>🇺🇦 700+ українських слів</p>
        <p style={{ marginTop: '4px' }}>3 рівні складності • до 6 команд</p>
      </div>
    </div>
  );
}
