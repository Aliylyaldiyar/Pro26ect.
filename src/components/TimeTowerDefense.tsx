import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

type Era = {
  name: string;
  year: string;
  accent: string;
  ground: string;
  enemy: string;
  tower: string;
  description: string;
};

type TowerKind = {
  id: 'arrow' | 'slow' | 'blast';
  name: string;
  icon: string;
  cost: number;
  damage: number;
  range: number;
  cooldown: number;
};

type Difficulty = {
  id: 'easy' | 'experienced' | 'hard' | 'antiTime';
  name: string;
  description: string;
  startCoins: number;
  startLives: number;
  hpMultiplier: number;
  extraEnemies: number;
};

type Enemy = {
  id: number;
  step: number;
  hp: number;
  maxHp: number;
  slowedUntil: number;
  isBoss: boolean;
};

type Tower = {
  id: number;
  cell: number;
  kind: TowerKind['id'];
  level: number;
  invested: number;
  lastShotAt: number;
  attackCount: number;
  lastTargetCell: number | null;
};

const boardSize = 8;
const maxTowerLevel = 3;
const maxWaves = 40;
const baseWaveDuration = 30;
const pathCells = [0, 1, 2, 10, 18, 26, 27, 28, 36, 44, 52, 53, 54, 55, 63];
const buildCells = [9, 11, 17, 19, 25, 29, 34, 35, 37, 43, 45, 50, 51, 57, 58, 59];

const eras: Era[] = [
  {
    name: 'Каменный век',
    year: '10 000 до н.э.',
    accent: '#9a6b3f',
    ground: 'stone',
    enemy: 'M',
    tower: 'A',
    description: 'Охотники защищают костер от мамонтов.',
  },
  {
    name: 'Средневековье',
    year: '1382',
    accent: '#7b6bb8',
    ground: 'castle',
    enemy: 'K',
    tower: 'C',
    description: 'Башни замка держат дорогу через ворота.',
  },
  {
    name: 'Индустриальная эпоха',
    year: '1899',
    accent: '#4d7c8a',
    ground: 'factory',
    enemy: 'D',
    tower: 'G',
    description: 'Паровые машины ускоряют оборону города.',
  },
  {
    name: 'Будущее',
    year: '2147',
    accent: '#d95f59',
    ground: 'future',
    enemy: 'R',
    tower: 'L',
    description: 'Лазеры защищают портал времени.',
  },
];

const towerKinds: TowerKind[] = [
  { id: 'arrow', name: 'Стрелок', icon: 'A', cost: 35, damage: 18, range: 1.8, cooldown: 850 },
  { id: 'slow', name: 'Хроно', icon: 'C', cost: 55, damage: 8, range: 2.1, cooldown: 1100 },
  { id: 'blast', name: 'Пушка', icon: 'B', cost: 80, damage: 38, range: 1.5, cooldown: 1450 },
];

const difficultyModes: Difficulty[] = [
  {
    id: 'easy',
    name: 'Легкая',
    description: 'Для новичков: больше монет, больше жизней и спокойные первые волны.',
    startCoins: 160,
    startLives: 16,
    hpMultiplier: 0.85,
    extraEnemies: 0,
  },
  {
    id: 'experienced',
    name: 'Опытный режим',
    description: 'Для опытных искателей времени: честный баланс без лишней помощи.',
    startCoins: 120,
    startLives: 12,
    hpMultiplier: 1,
    extraEnemies: 0,
  },
  {
    id: 'hard',
    name: 'Сложный',
    description: 'Враги крепче, ошибок меньше, башни нужно ставить точнее.',
    startCoins: 100,
    startLives: 9,
    hpMultiplier: 1.22,
    extraEnemies: 1,
  },
  {
    id: 'antiTime',
    name: 'Антивремя',
    description: 'Самый сложный режим: поток времени злится, врагов больше, портал хрупкий.',
    startCoins: 85,
    startLives: 6,
    hpMultiplier: 1.45,
    extraEnemies: 2,
  },
];

function cellToPoint(cell: number) {
  return {
    x: cell % boardSize,
    y: Math.floor(cell / boardSize),
  };
}

function distanceBetweenCells(a: number, b: number) {
  const first = cellToPoint(a);
  const second = cellToPoint(b);
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function getEnemyCell(enemy: Enemy) {
  return pathCells[Math.min(enemy.step, pathCells.length - 1)];
}

function getWaveDuration(wave: number) {
  return baseWaveDuration + Math.min(20, wave * 3);
}

function getTowerKind(kind: TowerKind['id']) {
  return towerKinds.find((tower) => tower.id === kind) ?? towerKinds[0];
}

function getTowerStats(tower: Tower) {
  const kind = getTowerKind(tower.kind);
  return {
    ...kind,
    damage: Math.round(kind.damage * (1 + (tower.level - 1) * 0.55)),
    range: kind.range + (tower.level - 1) * 0.22,
    cooldown: Math.max(420, kind.cooldown - (tower.level - 1) * 110),
  };
}

function getUpgradeCost(tower: Tower) {
  return Math.round(getTowerKind(tower.kind).cost * (0.75 + tower.level * 0.65));
}

function getSellRefund(tower: Tower) {
  return Math.round(tower.invested * 0.5);
}

function getAttackSeconds(cooldown: number) {
  return (cooldown / 1000).toFixed(2);
}

function getDps(damage: number, cooldown: number) {
  return (damage / (cooldown / 1000)).toFixed(1);
}

function getLandscapeRefund(towers: Tower[]) {
  const invested = towers.reduce((total, tower) => total + tower.invested, 0);
  return Math.round(invested * 1.2);
}

function isBossWave(wave: number) {
  return wave > 0 && wave % 3 === 0;
}

export function TimeTowerDefense({ userEmail }: { userEmail: string }) {
  const [difficulty, setDifficulty] = useState<Difficulty['id']>('easy');
  const selectedDifficultyData = difficultyModes.find((mode) => mode.id === difficulty) ?? difficultyModes[0];
  const [eraIndex, setEraIndex] = useState(0);
  const [wave, setWave] = useState(1);
  const [coins, setCoins] = useState(selectedDifficultyData.startCoins);
  const [lives, setLives] = useState(selectedDifficultyData.startLives);
  const [selectedTower, setSelectedTower] = useState<TowerKind['id']>('arrow');
  const [selectedTowerId, setSelectedTowerId] = useState<number | null>(null);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [spawnedCount, setSpawnedCount] = useState(0);
  const [isWaveRunning, setIsWaveRunning] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [waveTimeLeft, setWaveTimeLeft] = useState(getWaveDuration(1));
  const [message, setMessage] = useState('Поставь башни и запусти первую волну.');

  const era = eras[eraIndex];
  const selectedTowerData = getTowerKind(selectedTower);
  const selectedPlacedTower = towers.find((tower) => tower.id === selectedTowerId) ?? null;
  const enemiesInCurrentWave = 5 + wave * 2 + selectedDifficultyData.extraEnemies + (isBossWave(wave) ? 1 : 0);

  const enemiesByCell = useMemo(() => {
    const map = new Map<number, Enemy[]>();
    enemies.forEach((enemy) => {
      const cell = getEnemyCell(enemy);
      map.set(cell, [...(map.get(cell) ?? []), enemy]);
    });
    return map;
  }, [enemies]);

  useEffect(() => {
    if (!isWaveRunning) return;

    const timer = window.setInterval(() => {
      setWaveTimeLeft((current) => {
        if (current > 1) return current - 1;

        setIsWaveRunning(false);
        setEnemies([]);
        setSpawnedCount(0);
        if (wave >= maxWaves) {
          setIsVictory(true);
          setMessage('Победа! Ты удержал линию времени все 40 волн.');
          return 0;
        }

        setMessage(`Время волны ${wave} закончилось. Готовься к следующей.`);
        const refund = getLandscapeRefund(towers);
        setTowers([]);
        setSelectedTowerId(null);
        setWave((currentWave) => Math.min(maxWaves, currentWave + 1));
        setEraIndex((currentEra) => (currentEra + 1) % eras.length);
        setCoins((currentCoins) => currentCoins + 20 + refund);
        setMessage(`Ландшафт изменился. Башни разобраны, возвращено ${refund} монет.`);
        return 0;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isWaveRunning, towers, wave]);

  useEffect(() => {
    if (!isWaveRunning) return;

    let spawned = 0;
    const regularEnemies = 5 + wave * 2 + selectedDifficultyData.extraEnemies;
    const spawnTimer = window.setInterval(() => {
      spawned += 1;
      const boss = isBossWave(wave) && spawned > regularEnemies;
      const baseHp = boss ? 240 + wave * 55 : 55 + wave * 14;
      const maxHp = Math.round(baseHp * selectedDifficultyData.hpMultiplier);

      setSpawnedCount(spawned);
      setEnemies((current) => [
        ...current,
        {
          id: Date.now() + spawned,
          step: 0,
          hp: maxHp,
          maxHp,
          slowedUntil: 0,
          isBoss: boss,
        },
      ]);

      if (spawned >= regularEnemies + (isBossWave(wave) ? 1 : 0)) {
        window.clearInterval(spawnTimer);
      }
    }, 780);

    return () => window.clearInterval(spawnTimer);
  }, [isWaveRunning, selectedDifficultyData.extraEnemies, selectedDifficultyData.hpMultiplier, wave]);

  useEffect(() => {
    if (!isWaveRunning) return;

    const battleTimer = window.setInterval(() => {
      const now = Date.now();
      let coinsEarned = 0;
      let escaped = 0;
      let nextTowers = towers;

      setEnemies((currentEnemies) => {
        let nextEnemies = currentEnemies.map((enemy) => {
          const isSlowed = enemy.slowedUntil > now;
          const shouldMove = enemy.isBoss ? !isSlowed && now % 2 === 0 : !isSlowed;
          return { ...enemy, step: enemy.step + (shouldMove ? 1 : 0) };
        });

        nextTowers = towers.map((tower) => {
          const stats = getTowerStats(tower);
          if (now - tower.lastShotAt < stats.cooldown) {
            return tower;
          }

          const target = nextEnemies
            .filter((enemy) => distanceBetweenCells(tower.cell, getEnemyCell(enemy)) <= stats.range)
            .sort((a, b) => b.step - a.step || Number(b.isBoss) - Number(a.isBoss))[0];

          if (!target) return tower;

          nextEnemies = nextEnemies.map((enemy) => {
            if (enemy.id !== target.id) return enemy;
            return {
              ...enemy,
              hp: enemy.hp - stats.damage,
              slowedUntil: stats.id === 'slow' ? now + 1800 + tower.level * 260 : enemy.slowedUntil,
            };
          });

          return {
            ...tower,
            lastShotAt: now,
            attackCount: tower.attackCount + 1,
            lastTargetCell: getEnemyCell(target),
          };
        });

        const aliveEnemies = nextEnemies.filter((enemy) => {
          if (enemy.hp <= 0) {
            coinsEarned += enemy.isBoss ? 90 : 12;
            return false;
          }
          if (enemy.step >= pathCells.length - 1) {
            escaped += enemy.isBoss ? 3 : 1;
            return false;
          }
          return true;
        });

        if (aliveEnemies.length === 0 && spawnedCount >= enemiesInCurrentWave) {
          setIsWaveRunning(false);
          setWaveTimeLeft(0);
          if (wave >= maxWaves) {
            setIsVictory(true);
            setMessage('Победа! Ты отбил финальную волну и спас портал времени.');
            setCoins((current) => current + 80 + coinsEarned);
            return aliveEnemies;
          }

          setMessage(`Волна ${wave} отбита. Время двигается дальше.`);
          const refund = getLandscapeRefund(towers);
          nextTowers = [];
          setSelectedTowerId(null);
          setWave((current) => Math.min(maxWaves, current + 1));
          setEraIndex((current) => (current + 1) % eras.length);
          setCoins((current) => current + 35 + coinsEarned + refund);
          setMessage(`Ландшафт изменился. Башни разобраны, возвращено ${refund} монет.`);
        } else {
          setCoins((current) => current + coinsEarned);
        }

        if (escaped > 0) {
          setLives((current) => Math.max(0, current - escaped));
        }

        return aliveEnemies;
      });

      setTowers(nextTowers);
    }, 650);

    return () => window.clearInterval(battleTimer);
  }, [enemiesInCurrentWave, isWaveRunning, spawnedCount, towers, wave]);

  useEffect(() => {
    if (lives === 0) {
      setIsWaveRunning(false);
      setMessage('Портал разрушен. Нажми "Заново" и попробуй другую расстановку.');
    }
  }, [lives]);

  function handleCellClick(cell: number) {
    const existingTower = towers.find((tower) => tower.cell === cell);
    if (existingTower) {
      setSelectedTowerId(existingTower.id);
      if (!isWaveRunning) {
        upgradeTower(existingTower);
      }
      return;
    }

    if (!buildCells.includes(cell) || isWaveRunning) return;
    if (coins < selectedTowerData.cost) {
      setMessage('Не хватает монет для этой башни.');
      return;
    }

    const towerId = Date.now();
    setTowers((current) => [
      ...current,
      {
        id: towerId,
        cell,
        kind: selectedTower,
        level: 1,
        invested: selectedTowerData.cost,
        lastShotAt: 0,
        attackCount: 0,
        lastTargetCell: null,
      },
    ]);
    setSelectedTowerId(towerId);
    setCoins((current) => current - selectedTowerData.cost);
    setMessage(`${selectedTowerData.name} готов к защите линии времени.`);
  }

  function upgradeTower(tower: Tower) {
    if (tower.level >= maxTowerLevel) {
      setMessage('Эта башня уже на максимальном уровне.');
      return;
    }

    const cost = getUpgradeCost(tower);
    if (coins < cost) {
      setMessage(`Для прокачки нужно ${cost} монет.`);
      return;
    }

    setTowers((current) =>
      current.map((item) =>
        item.id === tower.id ? { ...item, level: item.level + 1, invested: item.invested + cost, lastShotAt: 0 } : item,
      ),
    );
    setCoins((current) => current - cost);
    setMessage(`${getTowerKind(tower.kind).name} улучшен до уровня ${tower.level + 1}.`);
  }

  function sellTower(tower: Tower) {
    const refund = getSellRefund(tower);
    setTowers((current) => current.filter((item) => item.id !== tower.id));
    setSelectedTowerId(null);
    setCoins((current) => current + refund);
    setMessage(`${getTowerKind(tower.kind).name} продан за ${refund} монет.`);
  }

  function resetGame(mode: Difficulty) {
    setEraIndex(0);
    setWave(1);
    setCoins(mode.startCoins);
    setLives(mode.startLives);
    setIsVictory(false);
    setSelectedTowerId(null);
    setTowers([]);
    setEnemies([]);
    setSpawnedCount(0);
    setIsWaveRunning(false);
    setWaveTimeLeft(getWaveDuration(1));
  }

  function selectDifficulty(mode: Difficulty) {
    if (isWaveRunning) return;
    setDifficulty(mode.id);
    resetGame(mode);
    setMessage(`${mode.name}: ${mode.description}`);
  }

  function startWave() {
    if (isWaveRunning || lives === 0 || isVictory || wave > maxWaves) return;
    setSelectedTowerId(null);
    setEnemies([]);
    setSpawnedCount(0);
    setWaveTimeLeft(getWaveDuration(wave));
    setIsWaveRunning(true);
    setMessage(
      isBossWave(wave)
        ? `Волна ${wave}: временной босс идет через ${era.name.toLowerCase()}. Режим: ${selectedDifficultyData.name}.`
        : `Волна ${wave} идет через ${era.name.toLowerCase()}. Режим: ${selectedDifficultyData.name}.`,
    );
  }

  function skipWave() {
    if (!isWaveRunning || lives === 0 || isVictory) return;

    const nextWave = wave + 1;
    if (nextWave > maxWaves) {
      setEnemies([]);
      setSpawnedCount(0);
      setIsWaveRunning(false);
      setWaveTimeLeft(0);
      setIsVictory(true);
      setMessage('Победа! Финальная волна пропущена, линия времени удержана.');
      return;
    }

    const nextEraIndex = (eraIndex + 1) % eras.length;
    const refund = getLandscapeRefund(towers);
    setEnemies([]);
    setSpawnedCount(0);
    setTowers([]);
    setSelectedTowerId(null);
    setWave(nextWave);
    setEraIndex(nextEraIndex);
    setWaveTimeLeft(getWaveDuration(nextWave));
    setCoins((current) => current + 10 + refund);
    setMessage(`Ландшафт изменился. Башни разобраны, возвращено ${refund} монет.`);
    setMessage(`Волна пропущена. Сразу идет волна ${nextWave}.`);
  }

  function restartGame() {
    resetGame(selectedDifficultyData);
    setMessage(`Новая временная линия готова. Сложность: ${selectedDifficultyData.name}.`);
  }

  return (
    <section className="game-shell" style={{ '--era': era.accent } as CSSProperties}>
      <div className="game-top">
        <div>
          <p className="hello">Игрок: {userEmail}</p>
          <h2>Chrono Defense</h2>
          <p className="era-line">
            {era.name} · {era.year}
          </p>
        </div>
        <div className="stats">
          <span>Волна {wave}/{maxWaves}</span>
          <span>{waveTimeLeft} сек</span>
          <span>{coins} монет</span>
          <span>{lives} жизней</span>
        </div>
      </div>

      <div className="era-panel">
        <div className={`era-preview ${era.ground}`}>
          <span>{era.tower}</span>
        </div>
        <p>
          {isVictory
            ? 'Все 40 волн пройдены. Портал времени стабилен.'
            : isBossWave(wave)
              ? `${era.description} Следующая волна с боссом.`
              : era.description}
        </p>
      </div>

      <div className="difficulty-panel" aria-label="Выбор сложности">
        {difficultyModes.map((mode) => (
          <button
            key={mode.id}
            className={difficulty === mode.id ? 'difficulty-choice active' : 'difficulty-choice'}
            type="button"
            onClick={() => selectDifficulty(mode)}
            disabled={isWaveRunning}
          >
            <strong>{mode.name}</strong>
            <span>{mode.description}</span>
            <small>
              {mode.startCoins} монет · {mode.startLives} жизней
            </small>
          </button>
        ))}
      </div>

      <div className="tower-bar" aria-label="Выбор башни">
        {towerKinds.map((tower) => (
          <button
            key={tower.id}
            className={selectedTower === tower.id ? 'tower-choice active' : 'tower-choice'}
            type="button"
            onClick={() => setSelectedTower(tower.id)}
            disabled={isWaveRunning}
          >
            <span>{tower.icon}</span>
            <strong>{tower.name}</strong>
            <small>
              {tower.cost} монет · удар {getAttackSeconds(tower.cooldown)}с · DPS {getDps(tower.damage, tower.cooldown)}
            </small>
          </button>
        ))}
      </div>

      {selectedPlacedTower && (
        <div className="upgrade-panel">
          <div>
            <strong>
              {getTowerKind(selectedPlacedTower.kind).name} ур. {selectedPlacedTower.level}
            </strong>
            <p>
              Урон {getTowerStats(selectedPlacedTower).damage} · Радиус {getTowerStats(selectedPlacedTower).range.toFixed(1)}
              {' · '}Удар {getAttackSeconds(getTowerStats(selectedPlacedTower).cooldown)}с
              {' · '}DPS {getDps(getTowerStats(selectedPlacedTower).damage, getTowerStats(selectedPlacedTower).cooldown)}
              {' · '}Продажа {getSellRefund(selectedPlacedTower)}
            </p>
          </div>
          <div className="tower-actions">
            <button
              className="secondary"
              type="button"
              onClick={() => upgradeTower(selectedPlacedTower)}
              disabled={isWaveRunning || selectedPlacedTower.level >= maxTowerLevel}
            >
              {selectedPlacedTower.level >= maxTowerLevel ? 'Макс.' : `Улучшить за ${getUpgradeCost(selectedPlacedTower)}`}
            </button>
            <button className="secondary danger" type="button" onClick={() => sellTower(selectedPlacedTower)}>
              Продать за {getSellRefund(selectedPlacedTower)}
            </button>
          </div>
        </div>
      )}

      <div className="board" aria-label="Поле tower defence">
        {Array.from({ length: boardSize * boardSize }, (_, cell) => {
          const tower = towers.find((item) => item.cell === cell);
          const towerKind = getTowerKind(tower?.kind ?? selectedTower);
          const towerStats = tower ? getTowerStats(tower) : null;
          const cellEnemies = enemiesByCell.get(cell) ?? [];
          const hitTower = towers.find((item) => item.lastTargetCell === cell && item.attackCount > 0);
          const isPath = pathCells.includes(cell);
          const canBuild = buildCells.includes(cell);
          const isSelectedTower = tower?.id === selectedTowerId;

          return (
            <button
              key={cell}
              className={[
                'tile',
                isPath ? 'path' : '',
                canBuild ? 'build' : '',
                tower ? 'has-tower' : '',
                isSelectedTower ? 'selected-tower' : '',
              ].join(' ')}
              type="button"
              onClick={() => handleCellClick(cell)}
              disabled={(!canBuild && !tower) || (isWaveRunning && !tower)}
              aria-label={canBuild ? 'Поставить или улучшить башню' : 'Клетка пути'}
            >
              {isSelectedTower && towerStats && (
                <span
                  className="tower-range"
                  style={{ '--range-size': `${(towerStats.range * 2 + 1) * 100}%` } as CSSProperties}
                />
              )}
              {tower && (
                <span key={`${tower.id}-${tower.attackCount}`} className={`tower level-${tower.level} attacking`}>
                  {towerKind.icon}
                  <small className="tower-level">{tower.level}</small>
                </span>
              )}
              {hitTower && <span key={`hit-${hitTower.id}-${hitTower.attackCount}`} className="hit-spark" />}
              {cellEnemies.map((enemy, index) => (
                <span
                  className={[
                    'enemy',
                    'time-distorted',
                    enemy.isBoss ? 'boss' : '',
                    enemy.slowedUntil > Date.now() ? 'slowed' : '',
                  ].join(' ')}
                  key={enemy.id}
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <span className="time-ring" />
                  <span className="time-ring late" />
                  <span className="enemy-core">{enemy.isBoss ? '!' : era.enemy}</span>
                  <span className="enemy-tooltip">
                    {enemy.isBoss ? 'Босс · ' : ''}
                    HP {Math.max(0, Math.ceil(enemy.hp))}/{enemy.maxHp}
                  </span>
                  <i className="enemy-health" style={{ width: `${Math.max(8, (enemy.hp / enemy.maxHp) * 100)}%` }} />
                </span>
              ))}
            </button>
          );
        })}
      </div>

      <div className="actions">
        <button type="button" onClick={startWave} disabled={isWaveRunning || lives === 0 || isVictory}>
          {isVictory ? 'Победа' : isWaveRunning ? 'Волна идет' : 'Запустить волну'}
        </button>
        <button className="secondary" type="button" onClick={skipWave} disabled={!isWaveRunning || lives === 0 || isVictory}>
          Скип волны
        </button>
        <button className="ghost" type="button" onClick={restartGame}>
          Заново
        </button>
      </div>

      <p className="message">{message}</p>
    </section>
  );
}
