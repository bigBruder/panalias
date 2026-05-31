'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/gameStore';

export default function ChallengePage() {
  const router = useRouter();
  const {
    teams, currentTeamIndex, lastWord,
    roundResults, resolveChallenge, confirmRoundResults,
  } = useGameStore();

  const [revealed, setRevealed] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const currentTeam = teams[currentTeamIndex];

  // Other teams that can try to guess
  const otherTeams = teams
    .map((t, idx) => ({ ...t, idx }))
    .filter((_, idx) => idx !== currentTeamIndex);

  const handleReveal = () => {
    setRevealed(true);
  };

  const handleAward = (teamIndex) => {
    setSelectedTeam(teamIndex);
  };

  const handleConfirm = () => {
    // Resolve the challenge
    resolveChallenge(selectedTeam);
    router.push('/results');
  };

  const handleSkipChallenge = () => {
    resolveChallenge(null); // nobody gets it
    router.push('/results');
  };

  // If no last word, go to results
  if (!lastWord) {
    router.push('/results');
    return null;
  }

  return (
    <div className="page page--center fade-in">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%' }}
      >
        {/* Header */}
        <div className="challenge-header">
          <div className="challenge-icon">⏰</div>
          <h1 className="title">Останнє слово!</h1>
          <p className="subtitle">
            Час вийшов! {currentTeam?.emoji} {currentTeam?.name} не встигли.
            <br />Інші команди можуть вгадати та вкрасти бал!
          </p>
        </div>

        {/* Word display */}
        <div className="challenge-word-container">
          {!revealed ? (
            <motion.div
              className="challenge-word-hidden"
              whileTap={{ scale: 0.95 }}
              onClick={handleReveal}
            >
              <div className="challenge-question">❓</div>
              <p className="challenge-tap-hint">Натисни щоб показати слово<br/>(покажи іншим командам!)</p>
            </motion.div>
          ) : (
            <motion.div
              className="challenge-word-revealed"
              initial={{ rotateY: 90 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 0.4 }}
            >
              <span className="word-category" style={{ position: 'relative', top: 0, left: 0, marginBottom: '8px', display: 'block' }}>
                {lastWord.category}
              </span>
              <span className="challenge-word-text">{lastWord.word}</span>
            </motion.div>
          )}
        </div>

        {/* Team selection */}
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="challenge-teams"
          >
            <p className="label text-center">Хто вгадав?</p>
            <div className="challenge-team-grid">
              {/* Current team can also claim if someone on their team shouted the answer */}
              {teams.map((team, idx) => (
                <button
                  key={idx}
                  className={`challenge-team-btn ${selectedTeam === idx ? 'challenge-team-btn--selected' : ''}`}
                  onClick={() => handleAward(idx)}
                  style={{
                    '--team-color': team.color,
                    borderColor: selectedTeam === idx ? team.color : undefined,
                  }}
                >
                  <span className="challenge-team-emoji">{team.emoji}</span>
                  <span className="challenge-team-name">{team.name}</span>
                  {selectedTeam === idx && (
                    <span className="challenge-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Bottom actions */}
      <div className="bottom-spacer" />
      <div className="bottom-nav" style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
        {revealed && selectedTeam !== null && (
          <button
            className="btn btn--success btn--lg btn--full"
            onClick={handleConfirm}
            id="btn-confirm-challenge"
          >
            ✅ +1 бал для {teams[selectedTeam]?.emoji} {teams[selectedTeam]?.name}
          </button>
        )}
        <button
          className="btn btn--ghost btn--full"
          onClick={handleSkipChallenge}
          id="btn-skip-challenge"
        >
          ⏭️ Ніхто не вгадав — пропустити
        </button>
      </div>
    </div>
  );
}
