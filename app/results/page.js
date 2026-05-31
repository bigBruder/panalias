'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/gameStore';

export default function ResultsPage() {
  const router = useRouter();
  const {
    teams, currentRound, totalRounds,
    currentTeamIndex, roundResults,
    gameMode, targetScore,
    status, nextRound, finishGame,
  } = useGameStore();

  const [editableResults, setEditableResults] = useState([]);
  const [confirmed, setConfirmed] = useState(false);
  const [wikiCache, setWikiCache] = useState({});
  const [expandedWord, setExpandedWord] = useState(null);

  const fetchWiki = async (word, e) => {
    e.stopPropagation();
    if (expandedWord === word) {
      setExpandedWord(null);
      return;
    }
    setExpandedWord(word);
    if (wikiCache[word]) return;

    try {
      const res = await fetch(`https://uk.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word.toLowerCase())}`);
      const data = await res.json();
      setWikiCache(prev => ({ ...prev, [word]: data.extract || 'Немає короткого пояснення у Вікіпедії.' }));
    } catch (err) {
      setWikiCache(prev => ({ ...prev, [word]: 'Не вдалося завантажити.' }));
    }
  };

  const currentTeam = teams[currentTeamIndex];

  useEffect(() => {
    if (roundResults.length > 0) {
      setEditableResults([...roundResults]);
    }
  }, [roundResults]);

  const toggleWord = (index) => {
    if (confirmed) return;
    setEditableResults((prev) =>
      prev.map((r, i) => i === index ? { ...r, guessed: !r.guessed } : r)
    );
  };

  const penaltyForSkip = useGameStore.getState().penaltyForSkip;
  const guessedCount = editableResults.filter(r => r.guessed && (r.winnerTeamIndex === undefined || r.winnerTeamIndex === currentTeamIndex)).length;
  const skippedCount = editableResults.filter(r => !r.guessed && r.winnerTeamIndex === undefined).length;
  const roundScore = Math.max(0, guessedCount - (penaltyForSkip ? skippedCount : 0));

  // Check if any team reached target score (for display)
  const teamReachedTarget = gameMode === 'target' && teams.some(t => t.score >= targetScore);

  const handleConfirmAndContinue = () => {
    if (!confirmed) {
      useGameStore.getState().confirmRoundResults(editableResults);
      setConfirmed(true);
    }
  };

  const handleNext = () => {
    const state = useGameStore.getState();
    const nextTeamIdx = (state.currentTeamIndex + 1) % state.teams.length;
    const isNewRound = nextTeamIdx === 0;

    let isGameOver = false;

    if (state.gameMode === 'rounds') {
      isGameOver = isNewRound && state.currentRound >= state.totalRounds;
    } else if (state.gameMode === 'target') {
      const reachedTarget = state.teams.some(t => t.score >= state.targetScore);
      if (reachedTarget) {
        const maxTurns = Math.max(...state.teams.map(t => t.turnsPlayed || 0));
        const allEqual = state.teams.every(t => (t.turnsPlayed || 0) >= maxTurns);
        isGameOver = allEqual;
      }
    }

    if (isGameOver) {
      finishGame();
      router.push('/final');
    } else {
      nextRound();
      router.push('/play');
    }
  };

  if (!currentTeam) {
    return (
      <div className="page page--center">
        <p className="subtitle">Немає результатів</p>
        <button className="btn btn--primary" onClick={() => router.push('/')}>На головну</button>
      </div>
    );
  }

  // Progress info
  const progressText = gameMode === 'rounds'
    ? `Раунд ${currentRound} з ${totalRounds}`
    : `Ціль: ${targetScore} балів`;

  return (
    <div className="page fade-in">
      <h1 className="title">Результати</h1>
      <p className="subtitle">
        {currentTeam.emoji} {currentTeam.name} • {progressText}
      </p>

      {/* Target mode: show if someone reached target */}
      {teamReachedTarget && confirmed && (
        <div className="target-reached-banner fade-in">
          🎯 Команда досягла цільового рахунку! Інші команди ще мають ходи.
        </div>
      )}

      {/* Score summary */}
      <div className="card" style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--success)', fontFamily: 'var(--font-display)' }}>
              {guessedCount}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Вгадано</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--danger)', fontFamily: 'var(--font-display)' }}>
              {skippedCount}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Пропущено</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-display)', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {roundScore}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Бали</div>
          </div>
        </div>
      </div>

      {/* Editable word list */}
      {!confirmed && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>
          Натисніть на слово, щоб змінити результат
        </p>
      )}

      <div className="results-list" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <AnimatePresence>
          {editableResults.map((result, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="result-item-container"
            >
              <div 
                className={`result-item ${result.guessed ? 'result-item--guessed' : 'result-item--skipped'}`}
                onClick={() => toggleWord(index)}
                style={{ cursor: confirmed ? 'default' : 'pointer', marginBottom: 0 }}
              >
                <div className={`result-icon ${result.guessed ? 'result-icon--guessed' : 'result-icon--skipped'}`}>
                  {result.guessed ? '✓' : '✕'}
                </div>
                <span className="result-word">{result.word}</span>
                <button 
                  className="wiki-btn" 
                  onClick={(e) => fetchWiki(result.word, e)}
                  title="Пояснення слова"
                >
                  ℹ️
                </button>
              </div>
              {expandedWord === result.word && (
                <div className="wiki-popup fade-in">
                  {wikiCache[result.word] ? (
                    <p>{wikiCache[result.word]}</p>
                  ) : (
                    <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto', borderWidth: '2px' }}></div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {editableResults.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🤷</div>
          <div className="empty-state-text">Жодного слова не було показано</div>
        </div>
      )}

      {/* Scoreboard */}
      <div className="section">
        <p className="label">Загальний рахунок</p>
        <div className="scoreboard">
          {[...teams]
            .map((team, idx) => ({ ...team, originalIndex: idx }))
            .sort((a, b) => b.score - a.score)
            .map((team) => {
              const isActive = team.originalIndex === currentTeamIndex;
              const reachedTarget = gameMode === 'target' && team.score >= targetScore;
              return (
                <div
                  key={team.originalIndex}
                  className={`score-row ${isActive ? 'score-row--active' : ''} ${reachedTarget ? 'score-row--target' : ''}`}
                >
                  <span className="score-emoji">{team.emoji}</span>
                  <div className="score-info">
                    <div className="score-name">
                      {team.name}
                      {reachedTarget && <span style={{ marginLeft: '6px' }}>🎯</span>}
                    </div>
                    {gameMode === 'target' && (
                      <div className="score-detail">
                        {team.turnsPlayed || 0} ходів
                      </div>
                    )}
                  </div>
                  <span className="score-value">
                    {isActive && !confirmed ? team.score + roundScore : team.score}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      <div className="bottom-spacer" />

      <div className="bottom-nav">
        {!confirmed ? (
          <button
            className="btn btn--primary btn--lg btn--full"
            onClick={handleConfirmAndContinue}
            id="btn-confirm-results"
          >
            ✅ Підтвердити результат
          </button>
        ) : (
          <button
            className="btn btn--primary btn--lg btn--full"
            onClick={handleNext}
            id="btn-next-round"
          >
            {(() => {
              const state = useGameStore.getState();
              const nextTeamIdx = (state.currentTeamIndex + 1) % state.teams.length;
              const isNewRound = nextTeamIdx === 0;
              
              if (state.gameMode === 'rounds') {
                return isNewRound && state.currentRound >= state.totalRounds
                  ? '🏆 Підсумки гри' : '➡️ Наступний хід';
              }
              
              const reached = state.teams.some(t => t.score >= state.targetScore);
              if (reached) {
                const maxT = Math.max(...state.teams.map(t => t.turnsPlayed || 0));
                const allEq = state.teams.every(t => (t.turnsPlayed || 0) >= maxT);
                if (allEq) return '🏆 Підсумки гри';
                return '⚖️ Рівні ходи — далі';
              }
              return '➡️ Наступний хід';
            })()}
          </button>
        )}
      </div>
    </div>
  );
}
