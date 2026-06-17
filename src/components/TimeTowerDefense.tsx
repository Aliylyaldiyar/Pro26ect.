import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, PointerEvent } from 'react';
import chronoBlastSprite from '../assets/chrono-blast.svg';
import temporalSniperSprite from '../assets/temporal-sniper.svg';
import timeScoutSprite from '../assets/time-scout.svg';

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
  sprite?: string;
  cost: number;
  damage: number;
  range: number;
  cooldown: number;
  elevatedOnly?: boolean;
  levelDescriptions: [string, string, string];
};

type TargetPriority = 'first' | 'strongest' | 'weakest';
type TowerSlot = TowerKind['id'] | null;

type Difficulty = {
  id: 'easy' | 'experienced' | 'hard' | 'antiTime';
  name: string;
  description: string;
  startCoins: number;
  startBaseHp: number;
  hpMultiplier: number;
  extraEnemies: number;
};

type GameScreen = 'profile' | 'start' | 'levels' | 'difficulty' | 'loadout' | 'battle';

type LevelMapItem = {
  id: number;
  title: string;
  mapTitle: string;
  mapArea: 'stone' | 'ancient' | 'medieval' | 'industrial' | 'future' | 'cyber';
  chapter: string;
  startWave: number;
  description: string;
};

type LevelMapPoint = {
  x: number;
  y: number;
};

type MapDecoration = LevelMapPoint & {
  kind: 'platform' | 'distortion' | 'base' | 'cave' | 'temple' | 'castle' | 'factory' | 'futureCity' | 'cyberCity';
  label: string;
};

type Enemy = {
  id: number;
  step: number;
  hp: number;
  maxHp: number;
  slowedUntil: number;
  isBoss: boolean;
  lastHitAt: number;
  lastHitKind: TowerKind['id'] | null;
  lastDamage: number;
};

type Tower = {
  id: number;
  cell: number;
  kind: TowerKind['id'];
  targetPriority: TargetPriority;
  level: number;
  invested: number;
  lastShotAt: number;
  attackCount: number;
  lastTargetCell: number | null;
};

const boardSize = 10;
const maxTowerLevel = 3;
const maxWaves = 40;
const baseWaveDuration = 30;
const skipUnlockDelay = 25;
const requiredLoadoutSize = 3;
const pathCells = [0, 1, 2, 3, 13, 23, 33, 34, 35, 45, 55, 65, 64, 63, 73, 83, 84, 85, 86, 96, 97, 98, 99];
const buildCells = [11, 12, 14, 21, 22, 24, 31, 32, 36, 37, 42, 43, 44, 46, 47, 54, 56, 57, 62, 66, 67, 72, 74, 75, 82, 87, 88, 92, 93, 94, 95];
const highlandCells = [12, 24, 36, 47, 62, 74, 88, 94];

const levelMap: LevelMapItem[] = [
  { id: 1, title: 'Искра времени', mapTitle: 'Каменный век', mapArea: 'stone', chapter: 'Обучение', startWave: 1, description: 'Первые башни и спокойные враги.' },
  { id: 2, title: 'Каменная тропа', mapTitle: 'Античность', mapArea: 'ancient', chapter: 'Обучение', startWave: 4, description: 'Дорога становится длиннее и опаснее.' },
  { id: 3, title: 'Ворота замка', mapTitle: 'Средневековье', mapArea: 'medieval', chapter: 'Средние уровни', startWave: 8, description: 'Появляются более крепкие волны.' },
  { id: 4, title: 'Паровой район', mapTitle: 'Индустриальная эпоха', mapArea: 'industrial', chapter: 'Средние уровни', startWave: 12, description: 'Нужно точнее выбирать башни.' },
  { id: 5, title: 'Разлом секунд', mapTitle: 'Будущее', mapArea: 'future', chapter: 'Сложные уровни', startWave: 18, description: 'Боссы приходят чаще и давят сильнее.' },
  { id: 6, title: 'Финальный портал', mapTitle: 'Киберпанк', mapArea: 'cyber', chapter: 'Сложные уровни', startWave: 26, description: 'Проверка всей защиты линии времени.' },
];

const levelMapSize = 30;
const levelMapPositions: Record<number, LevelMapPoint> = {
  1: { x: 4, y: 8 },
  2: { x: 13, y: 7 },
  3: { x: 23, y: 12 },
  4: { x: 4, y: 24 },
  5: { x: 24, y: 24 },
  6: { x: 13, y: 25 },
};

const levelRiftPoint: LevelMapPoint = { x: 15.5, y: 15.5 };
const levelRouteSegments = levelMap.flatMap((level) => [
  [levelMapPositions[level.id], levelRiftPoint] as const,
]);
const mapDecorations: MapDecoration[] = [
  { kind: 'cave', x: 2, y: 2, label: 'Пещера' },
  { kind: 'temple', x: 14, y: 3, label: 'Храм' },
  { kind: 'castle', x: 24, y: 3, label: 'Замок' },
  { kind: 'factory', x: 3, y: 18, label: 'Завод' },
  { kind: 'futureCity', x: 24, y: 18, label: 'Город будущего' },
  { kind: 'cyberCity', x: 13, y: 22, label: 'Кибергород' },
  { kind: 'platform', x: 7, y: 10, label: 'Платформа' },
  { kind: 'platform', x: 11, y: 14, label: 'Платформа' },
  { kind: 'platform', x: 20, y: 14, label: 'Платформа' },
  { kind: 'platform', x: 23, y: 22, label: 'Платформа' },
  { kind: 'platform', x: 8, y: 24, label: 'Платформа' },
  { kind: 'distortion', x: 12, y: 13, label: 'Искажение' },
  { kind: 'distortion', x: 20, y: 13, label: 'Искажение' },
  { kind: 'distortion', x: 13, y: 20, label: 'Искажение' },
  { kind: 'distortion', x: 20, y: 20, label: 'Искажение' },
  { kind: 'base', x: 15, y: 29, label: 'База игрока' },
];
const levelMapStorageKey = 'chrono-defense-completed-levels';

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
  {
    id: 'arrow',
    name: 'Скаут времени',
    icon: 'S',
    sprite: timeScoutSprite,
    cost: 35,
    damage: 18,
    range: 1.8,
    cooldown: 850,
    levelDescriptions: [
      'Скаут с карманными часами: быстрый точный удар по линии времени.',
      'Усиленный хронометр: больше урона и ярче импульс атаки.',
      'Разведчик разлома: серия мощных хроно-ударов по первой цели.',
    ],
  },
  {
    id: 'slow',
    name: 'Хроно-бласт',
    icon: 'C',
    sprite: chronoBlastSprite,
    cost: 55,
    damage: 8,
    range: 2.1,
    cooldown: 1100,
    levelDescriptions: [
      'Песочные часы: слегка замедляет время врага.',
      'Хронологическая достоверность: время врага сбивается сильнее.',
      'Разлом времени: враг надолго застревает в секунде.',
    ],
  },
  {
    id: 'blast',
    name: 'Временной снайпер',
    icon: 'B',
    sprite: temporalSniperSprite,
    cost: 80,
    damage: 38,
    range: 1.5,
    cooldown: 1450,
    elevatedOnly: true,
    levelDescriptions: ['Пороховой заряд: тяжелый одиночный удар.', 'Усиленное ядро: взрыв бьет заметно больнее.', 'Осадная машина: максимальный урон по крепким целям.'],
  },
];

const targetPriorityOptions: { id: TargetPriority; name: string; description: string }[] = [
  { id: 'first', name: 'Первый', description: 'Атакует врага ближе всего к порталу' },
  { id: 'strongest', name: 'Сильный', description: 'Атакует врага с самым большим HP' },
  { id: 'weakest', name: 'Слабый', description: 'Атакует врага с самым маленьким HP' },
];

const difficultyModes: Difficulty[] = [
  {
    id: 'easy',
    name: 'Легкая',
    description: 'Для новичков: больше монет, больше HP базы и спокойные первые волны.',
    startCoins: 160,
    startBaseHp: 150,
    hpMultiplier: 0.85,
    extraEnemies: 0,
  },
  {
    id: 'experienced',
    name: 'Опытный режим',
    description: 'Для опытных искателей времени: честный баланс без лишней помощи.',
    startCoins: 120,
    startBaseHp: 125,
    hpMultiplier: 1,
    extraEnemies: 0,
  },
  {
    id: 'hard',
    name: 'Сложный',
    description: 'Враги крепче, ошибок меньше, башни нужно ставить точнее.',
    startCoins: 100,
    startBaseHp: 100,
    hpMultiplier: 1.22,
    extraEnemies: 1,
  },
  {
    id: 'antiTime',
    name: 'Антивремя',
    description: 'Самый сложный режим: поток времени злится, врагов больше, портал хрупкий.',
    startCoins: 85,
    startBaseHp: 80,
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

function distanceToSegment(point: LevelMapPoint, start: LevelMapPoint, end: LevelMapPoint) {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const segmentLength = segmentX * segmentX + segmentY * segmentY;

  if (segmentLength === 0) return Math.hypot(point.x - start.x, point.y - start.y);

  const progress = clamp(((point.x - start.x) * segmentX + (point.y - start.y) * segmentY) / segmentLength, 0, 1);
  const projectionX = start.x + progress * segmentX;
  const projectionY = start.y + progress * segmentY;

  return Math.hypot(point.x - projectionX, point.y - projectionY);
}

function isLevelRouteCell(point: LevelMapPoint) {
  return levelRouteSegments.some(([start, end]) => distanceToSegment(point, start, end) < 0.72);
}

function getLevelMapCellClass(cell: number) {
  const point = {
    x: (cell % levelMapSize) + 1,
    y: Math.floor(cell / levelMapSize) + 1,
  };

  const distanceToRift = Math.hypot(point.x - levelRiftPoint.x, point.y - levelRiftPoint.y);

  if (isLevelRouteCell(point)) return 'route';
  if (distanceToRift < 5) return 'rift-land';
  if ((point.x === 11 || point.x === 12) && point.y < 17) return 'river';
  if (point.y >= 15 && point.y <= 17 && point.x < 29) return 'river';
  if (point.x < 10 && point.y < 15) return point.x + point.y < 12 ? 'mountain' : 'forest';
  if (point.x >= 11 && point.x <= 21 && point.y < 12) return 'sand';
  if (point.x > 21 && point.y < 17) return point.y < 7 ? 'castle-land' : 'farm';
  if (point.x < 11 && point.y > 17) return 'industrial-land';
  if (point.x > 20 && point.y > 17) return 'future-land';
  if (point.x >= 10 && point.x <= 22 && point.y > 20) return 'cyber-land';
  if ((point.x + point.y) % 13 === 0) return 'forest';
  if ((point.x - point.y) % 11 === 0) return 'hill';

  return 'grass';
}

function getEnemyCell(enemy: Enemy) {
  return pathCells[Math.min(enemy.step, pathCells.length - 1)];
}

function getTileDetailClass(cell: number) {
  if (cell === pathCells[0]) return 'start-gate';
  if (cell === pathCells[pathCells.length - 1]) return 'time-portal';
  if (pathCells.includes(cell)) return cell % 2 === 0 ? 'path-stones' : 'path-dust';
  if (highlandCells.includes(cell)) return 'build-highland';
  if (buildCells.includes(cell)) return cell % 3 === 0 ? 'build-plate' : 'build-grass';
  if (cell % 11 === 0 || cell % 17 === 0) return 'terrain-rocks';
  if (cell % 7 === 0) return 'terrain-flowers';
  return cell % 5 === 0 ? 'terrain-grass' : 'terrain-soft';
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

function getTowerLevelDescription(tower: Tower, level = tower.level) {
  const descriptionIndex = Math.min(maxTowerLevel, Math.max(1, level)) - 1;
  return getTowerKind(tower.kind).levelDescriptions[descriptionIndex];
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

function getTargetPriorityName(priority: TargetPriority) {
  return targetPriorityOptions.find((option) => option.id === priority)?.name ?? targetPriorityOptions[0].name;
}

function getPlacementLabel(tower: TowerKind) {
  return tower.elevatedOnly ? 'только возвышенность' : 'земля';
}

function renderTowerMark(tower: TowerKind | null, fallback = '+') {
  if (!tower) return fallback;
  if (!tower.sprite) return tower.icon;

  return <img className="tower-kind-sprite" src={tower.sprite} alt="" draggable={false} />;
}

function chooseTowerTarget(tower: Tower, enemies: Enemy[], range: number) {
  const targets = enemies.filter((enemy) => distanceBetweenCells(tower.cell, getEnemyCell(enemy)) <= range);

  if (tower.targetPriority === 'strongest') {
    return targets.sort((a, b) => b.hp - a.hp || b.step - a.step || Number(b.isBoss) - Number(a.isBoss))[0];
  }

  if (tower.targetPriority === 'weakest') {
    return targets.sort((a, b) => a.hp - b.hp || b.step - a.step || Number(b.isBoss) - Number(a.isBoss))[0];
  }

  return targets.sort((a, b) => b.step - a.step || Number(b.isBoss) - Number(a.isBoss))[0];
}

function isBossWave(wave: number) {
  return wave > 0 && wave % 3 === 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readCompletedLevelIds() {
  const savedLevels = window.localStorage.getItem(levelMapStorageKey);
  if (!savedLevels) return [];

  try {
    const parsedLevels: unknown = JSON.parse(savedLevels);
    if (!Array.isArray(parsedLevels)) return [];

    return parsedLevels.filter((levelId): levelId is number =>
      typeof levelId === 'number' && levelMap.some((level) => level.id === levelId),
    );
  } catch {
    return [];
  }
}

export function TimeTowerDefense({ userEmail }: { userEmail: string }) {
  const [screen, setScreen] = useState<GameScreen>('profile');
  const [playerName, setPlayerName] = useState('');
  const [playerAge, setPlayerAge] = useState('');
  const [profileError, setProfileError] = useState('');
  const [completedLevelIds, setCompletedLevelIds] = useState<number[]>(readCompletedLevelIds);
  const [selectedLevelId, setSelectedLevelId] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty['id']>('easy');
  const selectedDifficultyData = difficultyModes.find((mode) => mode.id === difficulty) ?? difficultyModes[0];
  const [eraIndex, setEraIndex] = useState(0);
  const [wave, setWave] = useState(1);
  const [coins, setCoins] = useState(selectedDifficultyData.startCoins);
  const [baseHp, setBaseHp] = useState(selectedDifficultyData.startBaseHp);
  const [selectedTower, setSelectedTower] = useState<TowerKind['id']>('arrow');
  const [towerSlots, setTowerSlots] = useState<TowerSlot[]>(['arrow', 'slow', 'blast', null, null]);
  const [selectedTowerId, setSelectedTowerId] = useState<number | null>(null);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [spawnedCount, setSpawnedCount] = useState(0);
  const [isWaveRunning, setIsWaveRunning] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [waveTimeLeft, setWaveTimeLeft] = useState(getWaveDuration(1));
  const [message, setMessage] = useState('Поставь башни и запусти первую волну.');
  const [boardTilt, setBoardTilt] = useState(35);
  const [boardTurn, setBoardTurn] = useState(358);
  const [boardZoom, setBoardZoom] = useState(1);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const cameraDragRef = useRef({
    active: false,
    hasMoved: false,
    startX: 0,
    startY: 0,
    startTilt: 35,
    startTurn: 358,
  });
  const ignoreNextBoardClickRef = useRef(false);

  const era = eras[eraIndex];
  const selectedTowerData = getTowerKind(selectedTower);
  const equippedTowerIds = towerSlots.filter((slot): slot is TowerKind['id'] => slot !== null);
  const isSelectedTowerEquipped = equippedTowerIds.includes(selectedTower);
  const isLoadoutReady = equippedTowerIds.length >= Math.min(requiredLoadoutSize, towerKinds.length);
  const selectedPlacedTower = towers.find((tower) => tower.id === selectedTowerId) ?? null;
  const selectedLevel = levelMap.find((level) => level.id === selectedLevelId) ?? levelMap[0];
  const enemiesInCurrentWave = 5 + wave * 2 + selectedDifficultyData.extraEnemies + (isBossWave(wave) ? 1 : 0);
  const waveElapsedSeconds = Math.max(0, getWaveDuration(wave) - waveTimeLeft);
  const skipSecondsLeft = Math.max(0, skipUnlockDelay - waveElapsedSeconds);
  const canSkipWave = isWaveRunning && skipSecondsLeft === 0 && baseHp > 0 && !isVictory;
  const playerLabel = playerName.trim() ? `${playerName.trim()}, ${playerAge} лет` : userEmail;

  const enemiesByCell = useMemo(() => {
    const map = new Map<number, Enemy[]>();
    enemies.forEach((enemy) => {
      const cell = getEnemyCell(enemy);
      map.set(cell, [...(map.get(cell) ?? []), enemy]);
    });
    return map;
  }, [enemies]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    function handleWheel(event: globalThis.WheelEvent) {
      event.preventDefault();
      event.stopPropagation();
      setBoardZoom((current) => clamp(Number((current - event.deltaY * 0.0012).toFixed(2)), 0.65, 1.45));
    }

    board.addEventListener('wheel', handleWheel, { passive: false });

    return () => board.removeEventListener('wheel', handleWheel);
  }, []);

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
        const enemyBaseHp = boss ? 240 + wave * 55 : 55 + wave * 14;
        const maxHp = Math.round(enemyBaseHp * selectedDifficultyData.hpMultiplier);

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
          lastHitAt: 0,
          lastHitKind: null,
          lastDamage: 0,
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
      let escapedDamage = 0;
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

          const target = chooseTowerTarget(tower, nextEnemies, stats.range);

          if (!target) return tower;

          nextEnemies = nextEnemies.map((enemy) => {
            if (enemy.id !== target.id) return enemy;
            return {
              ...enemy,
              hp: enemy.hp - stats.damage,
              slowedUntil: stats.id === 'slow' ? now + 1800 + tower.level * 260 : enemy.slowedUntil,
              lastHitAt: now,
              lastHitKind: stats.id,
              lastDamage: stats.damage,
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
            escapedDamage += Math.max(1, Math.ceil(enemy.hp));
            return false;
          }
          return true;
        });

        if (escapedDamage >= baseHp) {
          setIsWaveRunning(false);
          setWaveTimeLeft(0);
          setBaseHp(0);
          setMessage(`База получила ${escapedDamage} урона и разрушилась.`);
          return aliveEnemies;
        }

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

        if (escapedDamage > 0) {
          setBaseHp((current) => Math.max(0, current - escapedDamage));
          setMessage(`База получила ${escapedDamage} урона от прорвавшихся врагов.`);
        }

        return aliveEnemies;
      });

      setTowers(nextTowers);
    }, 650);

    return () => window.clearInterval(battleTimer);
  }, [baseHp, enemiesInCurrentWave, isWaveRunning, spawnedCount, towers, wave]);

  useEffect(() => {
    window.localStorage.setItem(levelMapStorageKey, JSON.stringify(completedLevelIds));
  }, [completedLevelIds]);

  useEffect(() => {
    if (!isVictory) return;

    setCompletedLevelIds((current) =>
      current.includes(selectedLevelId) ? current : [...current, selectedLevelId],
    );
  }, [isVictory, selectedLevelId]);

  useEffect(() => {
    if (baseHp === 0) {
      setIsWaveRunning(false);
      setMessage('HP базы закончилось. Нажми "Заново" и попробуй другую расстановку.');
    }
  }, [baseHp]);

  function submitPlayerProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = playerName.trim();
    const age = Number(playerAge);

    if (cleanName.length < 2) {
      setProfileError('Введи имя минимум из 2 букв.');
      return;
    }

    if (!Number.isInteger(age) || age < 6 || age > 99) {
      setProfileError('Введи возраст от 6 до 99.');
      return;
    }

    setPlayerName(cleanName);
    setPlayerAge(String(age));
    setProfileError('');
    setScreen('start');
  }

  function addTowerToSlot(kind: TowerKind['id']) {
    if (isWaveRunning) return;

    if (towerSlots.includes(kind)) {
      setSelectedTower(kind);
      setMessage(`${getTowerKind(kind).name} уже есть в слотах.`);
      return;
    }

    const emptySlotIndex = towerSlots.findIndex((slot) => slot === null);
    if (emptySlotIndex === -1) {
      setMessage('Все 5 слотов заняты. Убери башню из слота, чтобы добавить новую.');
      return;
    }

    setTowerSlots((current) => current.map((slot, index) => (index === emptySlotIndex ? kind : slot)));
    setSelectedTower(kind);
    setMessage(`${getTowerKind(kind).name} добавлен в слот ${emptySlotIndex + 1}.`);
  }

  function removeTowerFromSlot(slotIndex: number) {
    if (isWaveRunning) return;

    const removedTower = towerSlots[slotIndex];
    if (!removedTower) return;

    const nextSlots = towerSlots.map((slot, index) => (index === slotIndex ? null : slot));
    const nextSelectedTower = nextSlots.find((slot): slot is TowerKind['id'] => slot !== null);

    setTowerSlots(nextSlots);
    if (removedTower === selectedTower && nextSelectedTower) {
      setSelectedTower(nextSelectedTower);
    }
    setMessage(`${getTowerKind(removedTower).name} убран из слота ${slotIndex + 1}.`);
  }

  function selectTowerFromSlot(kind: TowerKind['id'] | null) {
    if (!kind || isWaveRunning) return;
    setSelectedTower(kind);
    setSelectedTowerId(null);
  }

  function handleCellClick(cell: number) {
    if (ignoreNextBoardClickRef.current) {
      ignoreNextBoardClickRef.current = false;
      return;
    }

    const existingTower = towers.find((tower) => tower.cell === cell);
    if (existingTower) {
      setSelectedTowerId(existingTower.id);
      if (!isWaveRunning) {
        upgradeTower(existingTower);
      }
      return;
    }

    if (!buildCells.includes(cell) || isWaveRunning) return;
    const isHighlandCell = highlandCells.includes(cell);
    if (!isSelectedTowerEquipped) {
      setMessage('Сначала добавь башню в один из 5 слотов.');
      return;
    }

    if (selectedTowerData.elevatedOnly && !isHighlandCell) {
      setMessage(`${selectedTowerData.name} ставится только на возвышенности.`);
      return;
    }

    if (!selectedTowerData.elevatedOnly && isHighlandCell) {
      setMessage('Эта возвышенность подходит только для башен со статусом "только возвышенность".');
      return;
    }

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
        targetPriority: 'first',
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

  function setTowerTargetPriority(tower: Tower, targetPriority: TargetPriority) {
    setTowers((current) => current.map((item) => (item.id === tower.id ? { ...item, targetPriority } : item)));
    setMessage(`${getTowerKind(tower.kind).name}: цель — ${getTargetPriorityName(targetPriority).toLowerCase()}.`);
  }

  function resetGame(mode: Difficulty, startWaveNumber = selectedLevel.startWave) {
    setEraIndex(0);
    setWave(startWaveNumber);
    setCoins(mode.startCoins);
    setBaseHp(mode.startBaseHp);
    setIsVictory(false);
    setSelectedTowerId(null);
    setTowers([]);
    setEnemies([]);
    setSpawnedCount(0);
    setIsWaveRunning(false);
    setWaveTimeLeft(getWaveDuration(startWaveNumber));
  }

  function selectDifficulty(mode: Difficulty) {
    if (isWaveRunning) return;
    setDifficulty(mode.id);
    resetGame(mode, selectedLevel.startWave);
    setTowerSlots([null, null, null, null, null]);
    setScreen('loadout');
    setMessage(`${selectedLevel.title}. ${mode.name}: собери набор башен перед входом в бой.`);
  }

  function beginBattleAfterLoadout() {
    if (!isLoadoutReady) {
      setMessage(`Выбери минимум ${Math.min(requiredLoadoutSize, towerKinds.length)} башни в Бестиарии.`);
      return;
    }

    setScreen('battle');
    setMessage(`${selectedLevel.title}. ${selectedDifficultyData.name}: расставь башни и запускай волну.`);
  }

  function selectLevel(level: LevelMapItem) {
    if (isWaveRunning) return;
    setSelectedLevelId(level.id);
    setScreen('difficulty');
    setMessage(`${level.title}: ${level.description}`);
  }

  function startWave() {
    if (isWaveRunning || baseHp === 0 || isVictory || wave > maxWaves) return;
    if (!isLoadoutReady) {
      setScreen('loadout');
      setMessage(`Сначала собери набор: минимум ${Math.min(requiredLoadoutSize, towerKinds.length)} башни.`);
      return;
    }
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
    if (!canSkipWave) return;

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
    resetGame(selectedDifficultyData, selectedLevel.startWave);
    setMessage(`Новая временная линия готова. Сложность: ${selectedDifficultyData.name}.`);
  }

  function goToStartMenu() {
    if (isWaveRunning) return;
    setSelectedTowerId(null);
    setScreen('start');
  }

  function goToDifficultyMenu() {
    if (isWaveRunning) return;
    setSelectedTowerId(null);
    setScreen('difficulty');
  }

  function startCameraDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;

    cameraDragRef.current = {
      active: true,
      hasMoved: false,
      startX: event.clientX,
      startY: event.clientY,
      startTilt: boardTilt,
      startTurn: boardTurn,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveCamera(event: PointerEvent<HTMLDivElement>) {
    const drag = cameraDragRef.current;
    if (!drag.active) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      drag.hasMoved = true;
    }

    setBoardTurn(drag.startTurn + deltaX * 0.22);
    setBoardTilt(clamp(drag.startTilt + deltaY * 0.12, 15, 70));
  }

  function stopCameraDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = cameraDragRef.current;
    if (!drag.active) return;

    cameraDragRef.current = { ...drag, active: false };
    if (drag.hasMoved) {
      ignoreNextBoardClickRef.current = true;
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <section className="game-shell" style={{ '--era': era.accent } as CSSProperties}>
      <div className="time-atmosphere" aria-hidden="true">
        <span className="broken-clock shell-clock-main" />
        <span className="broken-clock shell-clock-small" />
        <span className="time-crack shell-crack-a" />
        <span className="time-crack shell-crack-b" />
        <span className="time-shard shell-shard-a" />
        <span className="time-shard shell-shard-b" />
        <span className="time-shard shell-shard-c" />
      </div>
      <div className="game-top">
        <div>
          <p className="hello">Игрок: {playerLabel}</p>
          <h2>Chrono Defense</h2>
          <p className="era-line">
            {screen === 'battle' ? `${era.name} · ${era.year}` : selectedLevel.title}
          </p>
        </div>
        {screen === 'battle' && (
          <div className="stats">
            <span>Волна {wave}/{maxWaves}</span>
            <span>{waveTimeLeft} сек</span>
            <span>{coins} монет</span>
            <span>{baseHp} HP базы</span>
          </div>
        )}
      </div>

      {screen === 'profile' && (
        <section className="profile-screen">
          <span className="broken-clock screen-clock profile-clock" aria-hidden="true" />
          <span className="time-crack screen-crack profile-crack" aria-hidden="true" />
          <div className="screen-heading">
            <h3>Перед началом</h3>
            <p>Введи имя и возраст игрока, чтобы начать защиту линии времени.</p>
          </div>
          <form className="player-form" onSubmit={submitPlayerProfile}>
            <label>
              Имя
              <input
                type="text"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Например, Алишер"
                autoComplete="given-name"
              />
            </label>
            <label>
              Возраст
              <input
                type="number"
                value={playerAge}
                onChange={(event) => setPlayerAge(event.target.value)}
                placeholder="14"
                min="6"
                max="99"
              />
            </label>
            {profileError && <p className="form-error">{profileError}</p>}
            <button type="submit">Начать</button>
          </form>
        </section>
      )}

      {screen === 'start' && (
        <section className="menu-screen">
          <span className="broken-clock screen-clock menu-clock" aria-hidden="true" />
          <span className="time-crack screen-crack menu-crack" aria-hidden="true" />
          <div>
            <h3>Начальный экран</h3>
            <p>Выбери старт, чтобы перейти к карте уровней. Настройки камеры уже доступны в бою: мышь крутит карту, колесико меняет масштаб.</p>
          </div>
          <div className="menu-actions">
            <button type="button" onClick={() => setScreen('levels')}>
              Начать
            </button>
            <button className="secondary" type="button" onClick={() => setScreen('difficulty')}>
              Настройки
            </button>
          </div>
        </section>
      )}

      {screen === 'levels' && (
        <section className="level-screen">
          <span className="broken-clock screen-clock level-clock" aria-hidden="true" />
          <span className="time-shard level-shard" aria-hidden="true" />
          <div className="screen-heading">
            <h3>Карта уровней</h3>
            <p>Игрок проходит уровни по порядку, но сейчас можно выбрать любой уровень для теста.</p>
          </div>
          <div className="level-map-layout">
            <div className="level-map-card">
              <div className="map-axis map-axis-top" aria-hidden="true">
                {Array.from({ length: levelMapSize }, (_, index) => (
                  <span key={index}>{index + 1}</span>
                ))}
              </div>
              <div className="map-axis map-axis-left" aria-hidden="true">
                {Array.from({ length: levelMapSize }, (_, index) => (
                  <span key={index}>{index + 1}</span>
                ))}
              </div>
              <div className="level-map" aria-label="Карта уровней 30 на 30">
                <span className="map-clock-fracture" aria-hidden="true" />
                {Array.from({ length: levelMapSize * levelMapSize }, (_, cell) => (
                  <span
                    key={cell}
                    className={`map-cell ${getLevelMapCellClass(cell)}`}
                    aria-hidden="true"
                  />
                ))}
                <span className="map-rift" aria-hidden="true">Разлом времени</span>
                {mapDecorations.map((decoration) => (
                  <span
                    key={`${decoration.kind}-${decoration.x}-${decoration.y}`}
                    className={`map-decoration ${decoration.kind}`}
                    style={{
                      gridColumn: `${decoration.x} / span 2`,
                      gridRow: `${decoration.y} / span 2`,
                    }}
                    title={decoration.label}
                    aria-hidden="true"
                  />
                ))}
                {levelMap.map((level) => {
                  const position = levelMapPositions[level.id];
                  const isCompleted = completedLevelIds.includes(level.id);

                  return (
                    <span
                      key={`region-${level.id}`}
                      className={`map-region ${level.mapArea} ${isCompleted ? 'completed' : 'locked'}`}
                      style={{
                        gridColumn: `${Math.max(1, position.x - 2)} / span 9`,
                        gridRow: `${Math.max(1, position.y - 3)} / span 8`,
                      }}
                      aria-hidden="true"
                    />
                  );
                })}
                {levelMap.map((level) => {
                  const position = levelMapPositions[level.id];
                  const isCompleted = completedLevelIds.includes(level.id);

                  return (
                    <button
                      key={level.id}
                      className={[
                        'level-node',
                        level.mapArea,
                        selectedLevelId === level.id ? 'active' : '',
                        isCompleted ? 'completed' : 'locked',
                      ].join(' ')}
                      type="button"
                      onClick={() => selectLevel(level)}
                      style={{
                        gridColumn: `${position.x} / span 5`,
                        gridRow: `${position.y} / span 4`,
                      }}
                    >
                      <span className="level-number">{level.id}</span>
                      <small>{isCompleted ? 'Открыто' : 'Не пройдено'}</small>
                      <strong>{level.mapTitle}</strong>
                      <em>{level.description}</em>
                    </button>
                  );
                })}
              </div>
            </div>
            <aside className="map-legend" aria-label="Легенда карты">
              <strong>Легенда</strong>
              <span><i className="legend-road" />Дорога врагов</span>
              <span><i className="legend-platform" />Платформа для башни</span>
              <span><i className="legend-rift-small" />Искажение времени</span>
              <span><i className="legend-rift" />Разлом времени</span>
              <span><i className="legend-base" />База игрока</span>
            </aside>
          </div>
          <div className="menu-actions">
            <button className="ghost" type="button" onClick={() => setScreen('start')}>
              Назад
            </button>
          </div>
        </section>
      )}

      {screen === 'battle' && (
        <div className="era-panel">
        <span className="broken-clock era-clock" aria-hidden="true" />
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
      )}

      {screen === 'difficulty' && (
        <section className="difficulty-screen">
          <span className="broken-clock screen-clock difficulty-clock" aria-hidden="true" />
          <span className="time-crack screen-crack difficulty-crack" aria-hidden="true" />
          <div className="screen-heading">
            <h3>Выбор сложности</h3>
            <p>{selectedLevel.title}: старт с волны {selectedLevel.startWave}. После выбора сложности откроется карта битвы.</p>
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
              {mode.startCoins} монет · {mode.startBaseHp} HP базы
            </small>
          </button>
        ))}
      </div>
          <div className="menu-actions">
            <button className="ghost" type="button" onClick={() => setScreen('levels')}>
              Назад к уровням
            </button>
          </div>
        </section>
      )}

      {screen === 'loadout' && (
        <section className="loadout-screen">
          <span className="broken-clock screen-clock loadout-clock" aria-hidden="true" />
          <span className="time-crack screen-crack loadout-crack" aria-hidden="true" />
          <div className="screen-heading">
            <h3>Собери Бестиарий</h3>
            <p>
              Выбери минимум {Math.min(requiredLoadoutSize, towerKinds.length)} башни для уровня {selectedLevel.title}. После этого откроется поле битвы.
            </p>
          </div>

          <div className="loadout-layout">
            <div className="loadout-bestiary" aria-label="Бестиарий времени">
              <div className="loadout-panel-heading">
                <strong>Бестиарий</strong>
                <span>{equippedTowerIds.length}/{Math.min(requiredLoadoutSize, towerKinds.length)} выбрано</span>
              </div>
              <div className="bestiary-list loadout-bestiary-list">
                {towerKinds.map((tower) => (
                  <button
                    key={tower.id}
                    className={towerSlots.includes(tower.id) ? 'bestiary-item equipped' : 'bestiary-item'}
                    type="button"
                    onClick={() => addTowerToSlot(tower.id)}
                    title={tower.levelDescriptions[0]}
                  >
                    <span>{renderTowerMark(tower)}</span>
                    <em>{tower.name}</em>
                    <small>{tower.cost} монет · DPS {getDps(tower.damage, tower.cooldown)} · {getPlacementLabel(tower)}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="loadout-slots" aria-label="Слоты башен">
              <div className="loadout-panel-heading">
                <strong>Набор на бой</strong>
                <span>{isLoadoutReady ? 'готов' : 'нужны башни'}</span>
              </div>
              <div className="tower-bar loadout-tower-bar">
                {towerSlots.map((slot, slotIndex) => {
                  const tower = slot ? getTowerKind(slot) : null;

                  return (
                    <div
                      className={[
                        'tower-slot',
                        tower ? 'filled' : 'empty',
                        tower && selectedTower === tower.id ? 'active' : '',
                      ].join(' ')}
                      key={`${slot ?? 'empty'}-${slotIndex}`}
                    >
                      <button
                        className="tower-choice"
                        type="button"
                        onClick={() => selectTowerFromSlot(slot)}
                        disabled={!tower}
                      >
                        <span>{renderTowerMark(tower)}</span>
                        <strong>{tower?.name ?? 'Пусто'}</strong>
                        <small>
                          {tower ? `${tower.cost} монет · ${getPlacementLabel(tower)}` : 'Добавь из Бестиария'}
                        </small>
                      </button>
                      {tower && (
                        <button
                          className="slot-remove"
                          type="button"
                          onClick={() => removeTowerFromSlot(slotIndex)}
                          aria-label={`Убрать ${tower.name} из слота`}
                        >
                          x
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="menu-actions loadout-actions">
            <button className="ghost" type="button" onClick={() => setScreen('difficulty')}>
              Назад к сложности
            </button>
            <button type="button" onClick={beginBattleAfterLoadout} disabled={!isLoadoutReady}>
              В бой
            </button>
          </div>
        </section>
      )}

      {screen === 'battle' && (
        <>
      <div className="battle-layout">
        <div className="battle-side-panel">
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
            <div className="upgrade-description">
              <span>{getTowerLevelDescription(selectedPlacedTower)}</span>
              {selectedPlacedTower.level < maxTowerLevel && (
                <small>Следующее: {getTowerLevelDescription(selectedPlacedTower, selectedPlacedTower.level + 1)}</small>
              )}
            </div>
            <div className="target-priority-control" aria-label="Приоритет цели башни">
              {targetPriorityOptions.map((option) => (
                <button
                  key={option.id}
                  className={selectedPlacedTower.targetPriority === option.id ? 'active' : ''}
                  type="button"
                  onClick={() => setTowerTargetPriority(selectedPlacedTower, option.id)}
                  title={option.description}
                  aria-pressed={selectedPlacedTower.targetPriority === option.id}
                >
                  {option.name}
                </button>
              ))}
            </div>
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
        </div>

      <div
        ref={boardRef}
        className="board"
        style={
          {
            '--board-tilt': `${boardTilt}deg`,
            '--board-turn': `${boardTurn}deg`,
            '--board-tilt-inverse': `${-boardTilt}deg`,
            '--board-turn-inverse': `${-boardTurn}deg`,
            '--board-zoom': boardZoom,
          } as CSSProperties
        }
        onPointerDown={startCameraDrag}
        onPointerMove={moveCamera}
        onPointerUp={stopCameraDrag}
        onPointerCancel={stopCameraDrag}
        aria-label="Поле tower defence"
      >
        <span className="board-clock-ruin" aria-hidden="true" />
        <span className="board-clock-hand hand-a" aria-hidden="true" />
        <span className="board-clock-hand hand-b" aria-hidden="true" />
        {Array.from({ length: boardSize * boardSize }, (_, cell) => {
          const tower = towers.find((item) => item.cell === cell);
          const towerKind = getTowerKind(tower?.kind ?? selectedTower);
          const towerStats = tower ? getTowerStats(tower) : null;
          const cellEnemies = enemiesByCell.get(cell) ?? [];
          const hitTower = towers.find((item) => item.lastTargetCell === cell && item.attackCount > 0);
          const isPath = pathCells.includes(cell);
          const canBuild = buildCells.includes(cell);
          const isHighland = highlandCells.includes(cell);
          const isSelectedTower = tower?.id === selectedTowerId;

          return (
            <button
              key={cell}
              className={[
                'tile',
                isPath ? 'path' : '',
                canBuild ? 'build' : '',
                isHighland ? 'highland' : '',
                getTileDetailClass(cell),
                tower ? 'has-tower' : '',
                isSelectedTower ? 'selected-tower' : '',
              ].join(' ')}
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
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
                <span key={`${tower.id}-${tower.attackCount}`} className={`tower tower-${tower.kind} level-${tower.level} attacking`}>
                  {renderTowerMark(towerKind)}
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
                    enemy.lastHitAt > 0 ? 'hit' : '',
                    enemy.lastHitKind ? `hit-${enemy.lastHitKind}` : '',
                  ].join(' ')}
                  key={`${enemy.id}-${enemy.lastHitAt}`}
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <span className="time-ring" />
                  <span className="time-ring late" />
                  <span className="enemy-core">{enemy.isBoss ? '!' : era.enemy}</span>
                  {enemy.lastDamage > 0 && <span className="damage-pop">-{enemy.lastDamage}</span>}
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
      </div>

      <div className="battle-dock">
        <span className="dock-clock-fragment" aria-hidden="true" />
        <div className="tower-inventory" aria-label="Бестиарий времени">
          <strong>Бестиарий времени</strong>
          <div className="bestiary-list">
            {towerKinds.map((tower) => (
              <button
                key={tower.id}
                className={towerSlots.includes(tower.id) ? 'bestiary-item equipped' : 'bestiary-item'}
                type="button"
                onClick={() => addTowerToSlot(tower.id)}
                disabled={isWaveRunning}
                title={tower.levelDescriptions[0]}
              >
                <span>{renderTowerMark(tower)}</span>
                <em>{tower.name}</em>
                <small>{tower.cost} монет · {getPlacementLabel(tower)}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="tower-bar" aria-label="5 слотов башен">
          {towerSlots.map((slot, slotIndex) => {
            const tower = slot ? getTowerKind(slot) : null;

            return (
              <div
                className={[
                  'tower-slot',
                  tower ? 'filled' : 'empty',
                  tower && selectedTower === tower.id ? 'active' : '',
                ].join(' ')}
                key={`${slot ?? 'empty'}-${slotIndex}`}
              >
                <button
                  className="tower-choice"
                  type="button"
                  onClick={() => selectTowerFromSlot(slot)}
                  disabled={!tower || isWaveRunning}
                >
                  <span>{renderTowerMark(tower)}</span>
                  <strong>{tower?.name ?? 'Пусто'}</strong>
                  <small>
                    {tower ? `${tower.cost} монет · ${getPlacementLabel(tower)}` : 'Добавь из бестиария'}
                  </small>
                </button>
                {tower && (
                  <button
                    className="slot-remove"
                    type="button"
                    onClick={() => removeTowerFromSlot(slotIndex)}
                    disabled={isWaveRunning}
                    aria-label={`Убрать ${tower.name} из слота`}
                  >
                    x
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="actions">
          <button type="button" onClick={startWave} disabled={isWaveRunning || baseHp === 0 || isVictory}>
            {isVictory ? 'Победа' : isWaveRunning ? 'Волна идет' : 'Запустить'}
          </button>
          <button className="secondary" type="button" onClick={skipWave} disabled={!canSkipWave}>
            {isWaveRunning && skipSecondsLeft > 0 ? `${skipSecondsLeft}с` : 'Скип'}
          </button>
          <button className="ghost" type="button" onClick={restartGame}>
            Заново
          </button>
          <button className="ghost" type="button" onClick={goToStartMenu} disabled={isWaveRunning}>
            Меню
          </button>
          <button className="ghost" type="button" onClick={goToDifficultyMenu} disabled={isWaveRunning}>
            Сложность
          </button>
          <button className="ghost" type="button" onClick={() => setScreen('levels')} disabled={isWaveRunning}>
            Карта
          </button>
        </div>
      </div>

      <p className="message">{message}</p>
        </>
      )}
    </section>
  );
}
