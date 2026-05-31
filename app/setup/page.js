'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/gameStore';
import { generateTeamName, teamColors } from '@/lib/teamNames';

const VARIATIONS = [
  {
    id: 'classic',
    emoji: '🗣️',
    name: 'Класичний',
    desc: 'Пояснюй словами, не називаючи однокореневі',
    color: '#7c3aed',
  },
  {
    id: 'crocodile',
    emoji: '🙅',
    name: 'Крокодил',
    desc: 'Покажи жестами, без слів та звуків',
    color: '#10b981',
  },
  {
    id: 'english',
    emoji: '🇬🇧',
    name: 'English',
    desc: 'Пояснюй слова англійською мовою',
    color: '#3b82f6',
  },
  {
    id: 'one_word',
    emoji: '☝️',
    name: 'Одне слово',
    desc: 'Лише одна підказка — одне слово на кожне',
    color: '#f59e0b',
  },
  {
    id: 'reverse',
    emoji: '🔄',
    name: 'Навпаки',
    desc: 'Команда бачить слово, один гравець вгадує',
    color: '#ec4899',
  },
  {
    id: 'mix',
    emoji: '🎲',
    name: 'Мікс',
    desc: 'Кожен раунд — випадкова варіація',
    color: '#ef4444',
  },
];

export default function SetupPage() {
  const router = useRouter();
  const {
    difficulty, setDifficulty,
    roundTime, setRoundTime,
    totalRounds, setTotalRounds,
    penaltyForSkip, setPenaltyForSkip,
    gameMode, setGameMode,
    targetScore, setTargetScore,
    variation, setVariation,
    teams, setTeams,
  } = useGameStore();

  const [localTeams, setLocalTeams] = useState(() => {
    if (teams.length > 0) return teams;
    const t1 = generateTeamName();
    const t2 = generateTeamName();
    return [
      { name: t1.name, emoji: t1.emoji, color: teamColors[0], score: 0, turnsPlayed: 0 },
      { name: t2.name, emoji: t2.emoji, color: teamColors[1], score: 0, turnsPlayed: 0 },
    ];
  });

  // Track which setup section is expanded (for mobile UX)
  const [expandedSection, setExpandedSection] = useState('variation');

  const addTeam = () => {
    if (localTeams.length >= 6) return;
    const tn = generateTeamName();
    setLocalTeams([
      ...localTeams,
      { name: tn.name, emoji: tn.emoji, color: teamColors[localTeams.length % teamColors.length], score: 0, turnsPlayed: 0 },
    ]);
  };

  const removeTeam = (index) => {
    if (localTeams.length <= 2) return;
    setLocalTeams(localTeams.filter((_, i) => i !== index));
  };

  const updateName = (index, name) => {
    setLocalTeams(localTeams.map((t, i) => i === index ? { ...t, name } : t));
  };

  const randomizeName = (index) => {
    const tn = generateTeamName();
    setLocalTeams(localTeams.map((t, i) => i === index ? { ...t, name: tn.name, emoji: tn.emoji } : t));
  };

  const handleStart = () => {
    setTeams(localTeams);
    const gameId = `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    useGameStore.getState().startGame(gameId);
    router.push('/play');
  };

  const canStart = localTeams.length >= 2 && localTeams.every(t => t.name.trim());

  return (
    <div className="page fade-in">
      <button className="back-btn" onClick={() => router.push('/')}>
        ← Назад
      </button>

      <h1 className="title">Налаштування</h1>
      <p className="subtitle">Обери режим, варіацію та команди</p>

      {/* ===== VARIATION ===== */}
      <div className="section">
        <button className="section-toggle" onClick={() => setExpandedSection(expandedSection === 'variation' ? '' : 'variation')}>
          <p className="label" style={{ marginBottom: 0 }}>Варіація гри</p>
          <span className="section-toggle-icon">{expandedSection === 'variation' ? '▲' : '▼'}</span>
        </button>
        {expandedSection === 'variation' && (
          <div className="variation-grid fade-in">
            {VARIATIONS.map((v) => (
              <div
                key={v.id}
                className={`variation-card ${variation === v.id ? 'variation-card--selected' : ''}`}
                onClick={() => setVariation(v.id)}
                style={{ '--variation-color': v.color }}
                id={`variation-${v.id}`}
              >
                <div className="variation-emoji">{v.emoji}</div>
                <div className="variation-info">
                  <div className="variation-name">{v.name}</div>
                  <div className="variation-desc">{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {expandedSection !== 'variation' && (
          <div className="selected-summary">
            {VARIATIONS.find(v => v.id === variation)?.emoji} {VARIATIONS.find(v => v.id === variation)?.name}
          </div>
        )}
      </div>

      {/* ===== GAME MODE ===== */}
      <div className="section">
        <button className="section-toggle" onClick={() => setExpandedSection(expandedSection === 'mode' ? '' : 'mode')}>
          <p className="label" style={{ marginBottom: 0 }}>Режим гри</p>
          <span className="section-toggle-icon">{expandedSection === 'mode' ? '▲' : '▼'}</span>
        </button>
        {expandedSection === 'mode' && (
          <div className="fade-in">
            <div className="mode-tabs">
              <button
                className={`mode-tab ${gameMode === 'rounds' ? 'mode-tab--active' : ''}`}
                onClick={() => setGameMode('rounds')}
                id="mode-rounds"
              >
                <span className="mode-tab-emoji">🔄</span>
                <span className="mode-tab-name">Раунди</span>
                <span className="mode-tab-desc">Фіксована к-ть раундів</span>
              </button>
              <button
                className={`mode-tab ${gameMode === 'target' ? 'mode-tab--active' : ''}`}
                onClick={() => setGameMode('target')}
                id="mode-target"
              >
                <span className="mode-tab-emoji">🎯</span>
                <span className="mode-tab-name">До рахунку</span>
                <span className="mode-tab-desc">Перший хто набере N балів</span>
              </button>
            </div>

            {gameMode === 'rounds' && (
              <div style={{ marginTop: '24px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Кількість раундів</p>
                <div className="slider-options">
                  {[3, 5, 7, 10, 15].map((r) => (
                    <button
                      key={r}
                      className={`slider-option ${totalRounds === r ? 'slider-option--active' : ''}`}
                      onClick={() => setTotalRounds(r)}
                      id={`rounds-${r}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {gameMode === 'target' && (
              <div style={{ marginTop: '24px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Цільовий рахунок</p>
                <div className="slider-options">
                  {[15, 20, 30, 50, 75].map((s) => (
                    <button
                      key={s}
                      className={`slider-option ${targetScore === s ? 'slider-option--active' : ''}`}
                      onClick={() => setTargetScore(s)}
                      id={`target-${s}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ opacity: 0.7 }}>⚖️</span> Кожна команда отримає рівну к-ть ходів
                </p>
              </div>
            )}
          </div>
        )}
        {expandedSection !== 'mode' && (
          <div className="selected-summary">
            {gameMode === 'rounds' ? `🔄 ${totalRounds} раундів` : `🎯 До ${targetScore} балів`}
          </div>
        )}
      </div>

      {/* ===== DIFFICULTY ===== */}
      <div className="section">
        <button className="section-toggle" onClick={() => setExpandedSection(expandedSection === 'difficulty' ? '' : 'difficulty')}>
          <p className="label" style={{ marginBottom: 0 }}>Рівень складності</p>
          <span className="section-toggle-icon">{expandedSection === 'difficulty' ? '▲' : '▼'}</span>
        </button>
        {expandedSection === 'difficulty' && (
          <div className="difficulty-grid fade-in">
            <div
              className={`difficulty-card ${difficulty === 1 ? 'difficulty-card--selected' : ''}`}
              onClick={() => setDifficulty(1)}
              id="difficulty-easy"
            >
              <div className="difficulty-icon difficulty-icon--easy">🟢</div>
              <div className="difficulty-info">
                <div className="difficulty-name">Легкий</div>
                <div className="difficulty-desc">Прості повсякденні слова</div>
              </div>
            </div>
            <div
              className={`difficulty-card ${difficulty === 2 ? 'difficulty-card--selected' : ''}`}
              onClick={() => setDifficulty(2)}
              id="difficulty-medium"
            >
              <div className="difficulty-icon difficulty-icon--medium">🟡</div>
              <div className="difficulty-info">
                <div className="difficulty-name">Середній</div>
                <div className="difficulty-desc">Менш поширені слова</div>
              </div>
            </div>
            <div
              className={`difficulty-card ${difficulty === 3 ? 'difficulty-card--selected' : ''}`}
              onClick={() => setDifficulty(3)}
              id="difficulty-hard"
            >
              <div className="difficulty-icon difficulty-icon--hard">🔴</div>
              <div className="difficulty-info">
                <div className="difficulty-name">Складний</div>
                <div className="difficulty-desc">Абстрактні та рідкісні</div>
              </div>
            </div>
          </div>
        )}
        {expandedSection !== 'difficulty' && (
          <div className="selected-summary">
            {difficulty === 1 ? '🟢 Легкий' : difficulty === 2 ? '🟡 Середній' : '🔴 Складний'}
          </div>
        )}
      </div>

      {/* ===== ROUND TIME ===== */}
      <div className="section">
        <button className="section-toggle" onClick={() => setExpandedSection(expandedSection === 'time' ? '' : 'time')}>
          <p className="label" style={{ marginBottom: 0 }}>Час на раунд</p>
          <span className="section-toggle-icon">{expandedSection === 'time' ? '▲' : '▼'}</span>
        </button>
        {expandedSection === 'time' && (
          <div className="slider-options fade-in">
            {[30, 45, 60, 90, 120].map((t) => (
              <button
                key={t}
                className={`slider-option ${roundTime === t ? 'slider-option--active' : ''}`}
                onClick={() => setRoundTime(t)}
                id={`time-${t}`}
              >
                {t}с
              </button>
            ))}
          </div>
        )}
        {expandedSection !== 'time' && (
          <div className="selected-summary">⏱️ {roundTime} секунд</div>
        )}
      </div>

      {/* ===== PENALTY ===== */}
      <div className="section">
        <div className="section-header" style={{ marginBottom: 0 }}>
          <p className="label" style={{ marginBottom: 0 }}>Штраф за пропуск слова</p>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={penaltyForSkip} 
              onChange={(e) => setPenaltyForSkip(e.target.checked)} 
              id="penalty-toggle"
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          {penaltyForSkip ? 'Віднімає 1 бал за кожне пропущене слово' : 'Пропуски слів не впливають на рахунок'}
        </p>
      </div>

      {/* ===== TEAMS ===== */}
      <div className="section">
        <div className="section-header">
          <p className="label" style={{ marginBottom: 0 }}>Команди ({localTeams.length}/6)</p>
        </div>
        <div className="team-list">
          {localTeams.map((team, index) => (
            <div key={index} className="team-item scale-in">
              <div className="team-color-dot" style={{ background: team.color }} />
              <span className="team-emoji">{team.emoji}</span>
              <input
                className="team-name-input"
                value={team.name}
                onChange={(e) => updateName(index, e.target.value)}
                placeholder="Назва команди..."
                id={`team-name-${index}`}
              />
              <div className="team-actions">
                <button
                  className="team-action-btn"
                  onClick={() => randomizeName(index)}
                  title="Рандомна назва"
                  id={`team-random-${index}`}
                >
                  🎲
                </button>
                {localTeams.length > 2 && (
                  <button
                    className="team-action-btn team-action-btn--delete"
                    onClick={() => removeTeam(index)}
                    title="Видалити команду"
                    id={`team-delete-${index}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
          {localTeams.length < 6 && (
            <button className="add-team-btn" onClick={addTeam} id="btn-add-team">
              + Додати команду
            </button>
          )}
        </div>
      </div>

      <div className="bottom-spacer" />

      <div className="bottom-nav">
        <button
          className="btn btn--primary btn--lg btn--full"
          onClick={handleStart}
          disabled={!canStart}
          id="btn-start-game"
          style={{ opacity: canStart ? 1 : 0.5 }}
        >
          🚀 Почати гру!
        </button>
      </div>
    </div>
  );
}
