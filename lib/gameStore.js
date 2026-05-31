'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialState = {
  // Game setup
  gameId: null,
  difficulty: 1,          // 1 = easy, 2 = medium, 3 = hard
  roundTime: 60,           // seconds
  totalRounds: 5,
  penaltyForSkip: false,   // NEW: whether to penalize for skipped words
  
  // NEW: Game mode — 'rounds' | 'target'
  gameMode: 'rounds',
  targetScore: 30,         // target score for 'target' mode
  
  // NEW: Game variation
  variation: 'classic',    // classic | crocodile | english | one_word | reverse | mix
  
  // Teams
  teams: [],               // [{ id, name, emoji, color, score, turnsPlayed }]
  
  // Game state
  status: 'idle',          // idle | setup | playing | last_word_challenge | round_results | finished
  currentRound: 0,
  currentTeamIndex: 0,
  
  // Current round words
  currentWords: [],        // words fetched for current round
  currentWordIndex: 0,
  roundResults: [],         // [{ word, guessed: true/false }]
  
  // NEW: Last word challenge
  lastWord: null,           // the word that was showing when time ran out
  challengeTeamIndex: null, // which team is trying to steal
  
  // Used words (to prevent repeats)
  usedWordIds: [],
  
  // History
  gameHistory: [],
};

export const useGameStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // --- Setup Actions ---
      setDifficulty: (difficulty) => set({ difficulty }),
      setRoundTime: (roundTime) => set({ roundTime }),
      setTotalRounds: (totalRounds) => set({ totalRounds }),
      setPenaltyForSkip: (penaltyForSkip) => set({ penaltyForSkip }),
      setGameMode: (gameMode) => set({ gameMode }),
      setTargetScore: (targetScore) => set({ targetScore }),
      setVariation: (variation) => set({ variation }),
      
      setTeams: (teams) => set({ teams }),
      
      addTeam: (team) => set((state) => ({
        teams: [...state.teams, { ...team, score: 0, turnsPlayed: 0 }],
      })),
      
      removeTeam: (index) => set((state) => ({
        teams: state.teams.filter((_, i) => i !== index),
      })),
      
      updateTeamName: (index, name) => set((state) => ({
        teams: state.teams.map((t, i) => i === index ? { ...t, name } : t),
      })),

      // --- Game Flow ---
      startGame: (gameId) => set({
        gameId,
        status: 'playing',
        currentRound: 1,
        currentTeamIndex: 0,
        lastWord: null,
        challengeTeamIndex: null,
      }),

      setCurrentWords: (words) => set({
        currentWords: words,
        currentWordIndex: 0,
        roundResults: [],
      }),

      // Mark current word as guessed or skipped
      answerWord: (guessed) => set((state) => {
        const word = state.currentWords[state.currentWordIndex];
        if (!word) return state;
        
        const newResults = [...state.roundResults, { 
          word: word.word, 
          wordId: word.id,
          guessed,
        }];
        
        const newUsedWordIds = [...state.usedWordIds, word.id];
        
        return {
          roundResults: newResults,
          currentWordIndex: state.currentWordIndex + 1,
          usedWordIds: newUsedWordIds,
        };
      }),

      // NEW: Set last word for challenge
      setLastWordChallenge: () => set((state) => {
        const word = state.currentWords[state.currentWordIndex];
        if (!word) return { lastWord: null, status: 'round_results' };
        
        return {
          lastWord: word,
          status: 'last_word_challenge',
        };
      }),

      // Clear used words if we run out
      clearUsedWords: () => set({ usedWordIds: [] }),

      // NEW: Resolve last word challenge
      resolveChallenge: (winnerTeamIndex) => set((state) => {
        const word = state.lastWord;
        if (!word) return state;

        const resultItem = {
          word: word.word,
          wordId: word.id,
          guessed: winnerTeamIndex !== null,
          winnerTeamIndex: winnerTeamIndex // null if nobody guessed
        };

        return {
          lastWord: null,
          challengeTeamIndex: null,
          usedWordIds: [...state.usedWordIds, word.id],
          roundResults: [...state.roundResults, resultItem],
        };
      }),

      // Update score after reviewing round results
      confirmRoundResults: (updatedResults) => set((state) => {
        let currentTeamPoints = 0;
        let otherTeamPoints = {};

        updatedResults.forEach(r => {
          if (r.guessed) {
            const winner = r.winnerTeamIndex !== undefined && r.winnerTeamIndex !== null ? r.winnerTeamIndex : state.currentTeamIndex;
            if (winner === state.currentTeamIndex) {
              currentTeamPoints += 1;
            } else {
              otherTeamPoints[winner] = (otherTeamPoints[winner] || 0) + 1;
            }
          } else {
            // Skipped
            if (state.penaltyForSkip && r.winnerTeamIndex === undefined) {
              // Only penalize normal round words, not the last word challenge if skipped
              currentTeamPoints -= 1;
            }
          }
        });

        const roundScore = Math.max(0, currentTeamPoints);

        const updatedTeams = state.teams.map((team, idx) => {
          if (idx === state.currentTeamIndex) {
            return {
              ...team,
              score: team.score + roundScore,
              turnsPlayed: (team.turnsPlayed || 0) + 1,
            };
          } else if (otherTeamPoints[idx]) {
            return {
              ...team,
              score: team.score + otherTeamPoints[idx],
            };
          }
          return team;
        });
        
        return {
          teams: updatedTeams,
          roundResults: updatedResults,
          status: 'round_results',
        };
      }),

      // Move to next round / next team
      nextRound: () => set((state) => {
        const { gameMode, targetScore, teams, currentTeamIndex, currentRound, totalRounds } = state;
        
        const nextTeamIndex = (currentTeamIndex + 1) % teams.length;
        const isNewRound = nextTeamIndex === 0;
        const nextRound = isNewRound ? currentRound + 1 : currentRound;
        
        if (gameMode === 'rounds') {
          // Classic rounds mode — check if all rounds done
          if (isNewRound && currentRound >= totalRounds) {
            return { status: 'finished' };
          }
        } else if (gameMode === 'target') {
          // Target score mode — check if any team reached target
          const reachedTarget = teams.some(t => t.score >= targetScore);
          
          if (reachedTarget) {
            // Ensure equal turns: all teams must have played the same number of turns
            const maxTurns = Math.max(...teams.map(t => t.turnsPlayed || 0));
            const allEqual = teams.every(t => (t.turnsPlayed || 0) >= maxTurns);
            
            if (allEqual) {
              return { status: 'finished' };
            }
            // Otherwise continue so trailing teams get their turns
          }
        }
        
        return {
          currentRound: nextRound,
          currentTeamIndex: nextTeamIndex,
          status: 'playing',
          currentWords: [],
          currentWordIndex: 0,
          roundResults: [],
          lastWord: null,
          challengeTeamIndex: null,
        };
      }),

      // --- Game End ---
      finishGame: () => set((state) => {
        const gameResult = {
          id: state.gameId,
          date: new Date().toISOString(),
          difficulty: state.difficulty,
          roundTime: state.roundTime,
          totalRounds: state.totalRounds,
          gameMode: state.gameMode,
          targetScore: state.targetScore,
          variation: state.variation,
          teams: state.teams.map(t => ({
            name: t.name, emoji: t.emoji, score: t.score,
            color: t.color, turnsPlayed: t.turnsPlayed || 0,
          })),
          winner: [...state.teams].sort((a, b) => b.score - a.score)[0]?.name,
        };
        
        return {
          status: 'finished',
          gameHistory: [gameResult, ...state.gameHistory].slice(0, 50),
        };
      }),

      // --- Reset ---
      resetGame: () => set({
        ...initialState,
        gameHistory: get().gameHistory,
      }),

      clearHistory: () => set({ gameHistory: [] }),

      // Get current team
      getCurrentTeam: () => {
        const state = get();
        return state.teams[state.currentTeamIndex];
      },
    }),
    {
      name: 'alias-game-storage',
      partialize: (state) => ({
        gameHistory: state.gameHistory,
      }),
    }
  )
);
