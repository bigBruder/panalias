'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useGameStore } from '@/lib/gameStore';
import { ukrainianWords } from '@/lib/words';

const VARIATION_INFO = {
  classic:   { emoji: '🗣️', label: 'Пояснюй словами', rule: 'Не називай однокореневі слова!' },
  crocodile: { emoji: '🙅', label: 'Покажи жестами', rule: 'Жодних слів та звуків!' },
  english:   { emoji: '🇬🇧', label: 'Explain in English', rule: 'Пояснюй тільки англійською!' },
  one_word:  { emoji: '☝️', label: 'Одне слово', rule: 'Лише ОДНЕ слово-підказка!' },
  reverse:   { emoji: '🔄', label: 'Навпаки', rule: 'Команда бачить — один вгадує!' },
  mix:       { emoji: '🎲', label: 'Мікс', rule: '' },
};

const MIX_VARIATIONS = ['classic', 'crocodile', 'english', 'one_word', 'reverse'];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Timer({ seconds, totalSeconds }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = seconds / totalSeconds;
  const dashOffset = circumference * (1 - progress);
  const isWarning = seconds <= 10 && seconds > 5;
  const isDanger = seconds <= 5;

  return (
    <div className="timer-circle">
      <svg viewBox="0 0 140 140">
        <defs>
          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle className="timer-circle-bg" cx="70" cy="70" r={radius} />
        <circle
          className={`timer-circle-progress ${isWarning ? 'timer-circle-progress--warning' : ''} ${isDanger ? 'timer-circle-progress--danger' : ''}`}
          cx="70" cy="70" r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className={`timer-text ${isWarning ? 'timer-text--warning' : ''} ${isDanger ? 'timer-text--danger' : ''}`}>
        {seconds}
      </div>
    </div>
  );
}

function WordCard({ word, category, onSwipeLeft, onSwipeRight }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 80) {
      animate(x, 300, { duration: 0.2 });
      setTimeout(() => onSwipeRight(), 150);
    } else if (info.offset.x < -80) {
      animate(x, -300, { duration: 0.2 });
      setTimeout(() => onSwipeLeft(), 150);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 25 });
    }
  };

  return (
    <div className="word-card-container">
      <motion.div
        className="word-card"
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
      >
        <span className="word-category">{category}</span>
        <span className="word-text">{word}</span>
      </motion.div>
    </div>
  );
}

function ReadyOverlay({ team, round, totalRounds, gameMode, targetScore, variationInfo, onReady }) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown <= 0) {
      onReady();
      return;
    }
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onReady]);

  const roundLabel = gameMode === 'rounds'
    ? `Раунд ${round} з ${totalRounds}`
    : `Ціль: ${targetScore} балів`;

  return (
    <div className="ready-overlay">
      <div className="variation-badge-lg">
        {variationInfo.emoji} {variationInfo.label}
      </div>
      <div className="ready-team-name">
        {team.emoji} {team.name}
      </div>
      <div className="ready-round-info">{roundLabel}</div>
      <div className="ready-countdown">{countdown || '🏁'}</div>
      {variationInfo.rule && (
        <p className="ready-rule">{variationInfo.rule}</p>
      )}
    </div>
  );
}

export default function PlayPage() {
  const router = useRouter();
  const {
    difficulty, roundTime, totalRounds, gameMode, targetScore, variation,
    teams, currentRound, currentTeamIndex,
    currentWords, currentWordIndex, roundResults,
    usedWordIds, status, clearUsedWords,
    setCurrentWords, answerWord, setLastWordChallenge,
  } = useGameStore();

  const [seconds, setSeconds] = useState(roundTime);
  const [isRunning, setIsRunning] = useState(false);
  const [showReady, setShowReady] = useState(true);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const timerRef = useRef(null);
  const handledTimeUpRef = useRef(false);

  const currentTeam = teams[currentTeamIndex];

  // Determine the active variation (for mix mode, pick random per round)
  const activeVariation = useMemo(() => {
    if (variation === 'mix') {
      return MIX_VARIATIONS[Math.floor(Math.random() * MIX_VARIATIONS.length)];
    }
    return variation;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variation, currentRound, currentTeamIndex]);

  const variationInfo = VARIATION_INFO[activeVariation] || VARIATION_INFO.classic;

  // Load words
  useEffect(() => {
    if (currentWords.length === 0 && !isTimeUp) {
      let pool = ukrainianWords
        .filter(w => w.difficulty === difficulty)
        .map(w => ({ ...w, id: w.word }))
        .filter(w => !usedWordIds.includes(w.id));

      if (pool.length < 30) {
        pool = ukrainianWords
          .filter(w => w.difficulty === difficulty)
          .map(w => ({ ...w, id: w.word }));
        clearUsedWords(); // Reset the database if we run out of words
      }

      setCurrentWords(shuffleArray(pool).slice(0, 50));
    }
  }, [currentWords.length, difficulty, usedWordIds, setCurrentWords, isTimeUp, clearUsedWords]);

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    
    // Audio Context for beeps (initialized on first tick to bypass autoplay policies usually, but user clicked "Start" so it's fine)
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new (AudioContext)();
    
    const playBeep = (freq, type = 'sine', duration = 0.1) => {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    };

    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsRunning(false);
          setIsTimeUp(true);
          
          // End sound (long buzz)
          playBeep(300, 'square', 0.5);
          setTimeout(() => playBeep(200, 'square', 0.6), 150);
          
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          return 0;
        }
        
        // Tick sound for last 5 seconds
        if (prev <= 6) {
          playBeep(800, 'sine', 0.1);
          if (navigator.vibrate) navigator.vibrate(50);
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(timerRef.current);
      if (audioCtx) audioCtx.close();
    };
  }, [isRunning]);

  // Time up → check last word challenge or go to results
  useEffect(() => {
    if (isTimeUp && !handledTimeUpRef.current) {
      handledTimeUpRef.current = true;

      const currentWord = currentWords[currentWordIndex];

      if (currentWord && teams.length >= 2) {
        // There's a word on screen — initiate last word challenge
        setLastWordChallenge();
        router.push('/challenge');
      } else {
        // No word — go directly to results
        router.push('/results');
      }
    }
  }, [isTimeUp, currentWords, currentWordIndex, teams.length, setLastWordChallenge, roundResults, router]);

  const handleReady = useCallback(() => {
    setShowReady(false);
    setIsRunning(true);
  }, []);

  const handleCorrect = useCallback(() => {
    answerWord(true);
  }, [answerWord]);

  const handleSkip = useCallback(() => {
    answerWord(false);
  }, [answerWord]);

  // Redirect if no game
  if (!currentTeam || status !== 'playing') {
    return (
      <div className="page page--center">
        <p className="subtitle">Гра не знайдена</p>
        <button className="btn btn--primary" onClick={() => router.push('/')}>На головну</button>
      </div>
    );
  }

  const currentWord = currentWords[currentWordIndex];

  const progressLabel = gameMode === 'rounds'
    ? `Раунд ${currentRound}/${totalRounds}`
    : `${currentTeam.score}/${targetScore}`;

  if (showReady) {
    return (
      <ReadyOverlay
        team={currentTeam}
        round={currentRound}
        totalRounds={totalRounds}
        gameMode={gameMode}
        targetScore={targetScore}
        variationInfo={variationInfo}
        onReady={handleReady}
      />
    );
  }

  return (
    <div className="page">
      <div className="play-layout">
        {/* Top */}
        <div className="play-top">
          {/* Variation badge */}
          <div className="variation-badge" style={{ '--badge-color': VARIATION_INFO[activeVariation]?.color || '#7c3aed' }}>
            {variationInfo.emoji} {variationInfo.label}
          </div>

          <div className="team-banner" style={{ borderColor: currentTeam.color + '60' }}>
            <span className="team-banner-emoji">{currentTeam.emoji}</span>
            <span className="team-banner-name" style={{ color: currentTeam.color }}>{currentTeam.name}</span>
            <span className="team-banner-round">{progressLabel}</span>
          </div>

          <Timer seconds={seconds} totalSeconds={roundTime} />
        </div>

        {/* Middle */}
        <div className="play-middle">
          {currentWord ? (
            <>
              <WordCard
                key={currentWordIndex}
                word={currentWord.word}
                category={currentWord.category}
                onSwipeRight={handleCorrect}
                onSwipeLeft={handleSkip}
              />
              <div className="swipe-hint">
                <span className="swipe-hint-left">← Пропустити</span>
                <span style={{ color: 'var(--text-muted)' }}>{roundResults.length} слів</span>
                <span className="swipe-hint-right">Вгадано →</span>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-text">Слова закінчились!</div>
            </div>
          )}
        </div>

        {/* Bottom */}
        <div className="play-bottom">
          <div className="play-controls">
            <button className="play-btn play-btn--skip" onClick={handleSkip} disabled={!currentWord} id="btn-skip">
              ✕
            </button>
            <button
              className="play-btn play-btn--correct"
              onClick={handleCorrect}
              disabled={!currentWord}
              id="btn-correct"
              style={{ width: '80px', height: '80px', fontSize: '2.2rem' }}
            >
              ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
