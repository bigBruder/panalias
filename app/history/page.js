'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/gameStore';

export default function HistoryPage() {
  const router = useRouter();
  const { gameHistory, clearHistory } = useGameStore();

  const difficultyLabels = { 1: 'Легкий', 2: 'Середній', 3: 'Складний' };
  const difficultyClasses = { 1: 'history-badge--easy', 2: 'history-badge--medium', 3: 'history-badge--hard' };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="page fade-in">
      <button className="back-btn" onClick={() => router.push('/')}>
        ← Назад
      </button>

      <div className="section-header">
        <h1 className="title">Історія ігор</h1>
        {gameHistory.length > 0 && (
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => {
              if (confirm('Очистити всю історію?')) clearHistory();
            }}
            id="btn-clear-history"
          >
            🗑️ Очистити
          </button>
        )}
      </div>
      <p className="subtitle">
        {gameHistory.length > 0
          ? `${gameHistory.length} ${gameHistory.length === 1 ? 'гра' : gameHistory.length < 5 ? 'гри' : 'ігор'}`
          : 'Поки що ігор немає'
        }
      </p>

      {gameHistory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎮</div>
          <div className="empty-state-text">
            Зіграйте першу гру!<br />
            Результати з&apos;являться тут
          </div>
          <button
            className="btn btn--primary"
            onClick={() => router.push('/setup')}
            style={{ marginTop: '12px' }}
          >
            🚀 Почати гру
          </button>
        </div>
      ) : (
        <div className="history-list">
          <AnimatePresence>
            {gameHistory.map((game, index) => (
              <motion.div
                key={game.id || index}
                className="history-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="history-header">
                  <span className="history-date">{formatDate(game.date)}</span>
                  <span className={`history-badge ${difficultyClasses[game.difficulty]}`}>
                    {difficultyLabels[game.difficulty]}
                  </span>
                </div>

                <div className="history-winner">
                  🏆 {game.winner}
                </div>

                <div className="history-teams">
                  {game.teams
                    .sort((a, b) => b.score - a.score)
                    .map((team, tIdx) => (
                      <span key={tIdx} className="history-team">
                        {team.emoji} {team.name}: <strong>{team.score}</strong>
                      </span>
                    ))
                  }
                </div>

                <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {game.totalRounds} раундів • {game.roundTime}с на раунд
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
