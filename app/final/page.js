'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/gameStore';

const VARIATION_LABELS = {
  classic: '🗣️ Класичний',
  crocodile: '🙅 Крокодил',
  english: '🇬🇧 English',
  one_word: '☝️ Одне слово',
  reverse: '🔄 Навпаки',
  mix: '🎲 Мікс',
};

export default function FinalPage() {
  const router = useRouter();
  const { teams, difficulty, totalRounds, roundTime, gameMode, targetScore, variation, resetGame } = useGameStore();
  const confettiRef = useRef(false);

  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  const winner = sortedTeams[0];
  const isTie = sortedTeams.length > 1 && sortedTeams[0]?.score === sortedTeams[1]?.score;

  useEffect(() => {
    if (confettiRef.current) return;
    confettiRef.current = true;
    const fireConfetti = async () => {
      try {
        const confetti = (await import('canvas-confetti')).default;
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#7c3aed', '#a855f7', '#f59e0b', '#10b981', '#ef4444'] });
        setTimeout(() => {
          confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#7c3aed', '#a855f7', '#fbbf24'] });
          confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#7c3aed', '#a855f7', '#fbbf24'] });
        }, 400);
        setTimeout(() => {
          confetti({ particleCount: 30, spread: 100, shapes: ['star'], colors: ['#fbbf24', '#f59e0b'], origin: { y: 0.4 } });
        }, 800);
      } catch (e) { /* noop */ }
    };
    fireConfetti();
  }, []);

  const handleNewGame = () => { resetGame(); router.push('/setup'); };
  const handleHome = () => { resetGame(); router.push('/'); };

  const difficultyLabels = { 1: 'Легкий', 2: 'Середній', 3: 'Складний' };

  return (
    <div className="page page--center fade-in">
      <motion.div
        className="winner-display"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="winner-crown">👑</div>
        <div className="winner-emoji">{winner?.emoji}</div>
        {isTie ? (
          <div className="winner-name">Нічия!</div>
        ) : (
          <div className="winner-name">{winner?.name}</div>
        )}
        <div className="winner-score">
          {winner?.score} {winner?.score === 1 ? 'бал' : winner?.score < 5 ? 'бали' : 'балів'}
        </div>
        <h1 className="title" style={{ marginTop: '8px' }}>
          {isTie ? 'Обидві команди переможці!' : 'Перемога! 🎉'}
        </h1>
      </motion.div>

      {/* Scoreboard */}
      <motion.div className="section" style={{ width: '100%', marginTop: '16px' }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      >
        <p className="label text-center">Підсумковий рахунок</p>
        <div className="scoreboard">
          {sortedTeams.map((team, index) => (
            <motion.div
              key={index}
              className={`score-row ${index === 0 ? 'score-row--winner' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-muted)', width: '28px' }}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
              </span>
              <span className="score-emoji">{team.emoji}</span>
              <div className="score-info">
                <div className="score-name">{team.name}</div>
                <div className="score-detail">{team.turnsPlayed || 0} ходів</div>
              </div>
              <span className="score-value">{team.score}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Game stats */}
      <motion.div className="card" style={{ width: '100%', marginTop: '16px', textAlign: 'center' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '0.82rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{VARIATION_LABELS[variation] || variation}</div>
            <div>Варіація</div>
          </div>
          <div>
            <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{difficultyLabels[difficulty]}</div>
            <div>Рівень</div>
          </div>
          <div>
            <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
              {gameMode === 'rounds' ? totalRounds : targetScore}
            </div>
            <div>{gameMode === 'rounds' ? 'Раундів' : 'Ціль'}</div>
          </div>
          <div>
            <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{roundTime}с</div>
            <div>Час</div>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div className="start-buttons" style={{ marginTop: '24px' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
      >
        <button className="btn btn--primary btn--lg btn--full" onClick={handleNewGame} id="btn-new-game-final">
          🎮 Нова гра
        </button>
        <button className="btn btn--ghost btn--full" onClick={handleHome} id="btn-home-final">
          🏠 На головну
        </button>
      </motion.div>
    </div>
  );
}
