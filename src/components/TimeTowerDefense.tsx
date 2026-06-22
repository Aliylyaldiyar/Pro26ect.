import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, PointerEvent } from 'react';
import bossChronomancerSprite from '../assets/boss-chronomancer.svg';
import bossEpochLordSprite from '../assets/boss-epoch-lord.svg';
import bossMindRiftSprite from '../assets/boss-mind-rift.svg';
import bossZeroParadoxSprite from '../assets/boss-zero-paradox.svg';
import chronoBlastSpriteSvg from '../assets/chrono-blast.svg?raw';
import temporalSniperSpriteSvg from '../assets/temporal-sniper.svg?raw';
import timeScoutSpriteSvg from '../assets/time-scout.svg?raw';
import { supabase } from '../lib/supabase';
import { easyMonsterIds, getEasyMonsterName, MonsterIcon } from './MonsterIcon';
import type { EasyMonsterId } from './MonsterIcon';

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
  id:
    | 'arrow'
    | 'slow'
    | 'blast'
    | 'rift'
    | 'hourglass'
    | 'forge'
    | 'mirror'
    | 'pulsar'
    | 'beacon'
    | 'archive'
    | 'sun'
    | 'gravity';
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

type BossProfile = {
  name: string;
  sprite: string;
  portraitClass: string;
};

type GameScreen = 'profile' | 'tutorial' | 'start' | 'levels' | 'difficulty' | 'loadout' | 'achievements' | 'battle';
type TutorialStep = 'selectTower' | 'placeTower' | 'startWave' | 'watchWave' | 'complete';

type AchievementStats = {
  totalKills: number;
  wavesCompleted: number;
  towersBuilt: number;
  upgradesBought: number;
  bossesDefeated: number;
  maxWaveReached: number;
  hardVictories: number;
  antiTimeVictories: number;
  noDamageVictories: number;
  noSkipVictories: number;
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  goal: number;
  getProgress: (stats: AchievementStats, completedLevels: number) => number;
};

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
  kind:
    | 'platform'
    | 'distortion'
    | 'base'
    | 'cave'
    | 'temple'
    | 'castle'
    | 'factory'
    | 'futureCity'
    | 'cyberCity'
    | 'mammoth'
    | 'stoneHut'
    | 'boulder'
    | 'volcano'
    | 'pyramid'
    | 'oasis'
    | 'farmHouse'
    | 'pineMountain'
    | 'mine'
    | 'smokeStack'
    | 'hoverDrone'
    | 'reactor'
    | 'dataSpire';
  label: string;
  spanX?: number;
  spanY?: number;
};

type BattleDecoration = LevelMapPoint & {
  kind:
    | 'mammoth'
    | 'hut'
    | 'volcano'
    | 'rockPile'
    | 'watchTower'
    | 'house'
    | 'mountain'
    | 'mineCart'
    | 'pipe'
    | 'factoryBlock'
    | 'drone'
    | 'reactor'
    | 'energyPylon';
  spanX?: number;
  spanY?: number;
};

type BattleMapLayout = {
  id: number;
  name: string;
  description: string;
  pathCells: number[];
  buildCells: number[];
  highlandCells: number[];
  decorations: BattleDecoration[];
};

type Enemy = {
  id: number;
  kind: EasyMonsterId;
  step: number;
  hp: number;
  maxHp: number;
  speed: number;
  reward: number;
  moveCharge: number;
  createdAt: number;
  speedBoostUntil: number;
  towerSlowUntil: number;
  ignoredFirstSlow: boolean;
  lastAbilityAt: number;
  slowedUntil: number;
  stoppedUntil: number;
  gravityUntil: number;
  isBoss: boolean;
  monsterId: EasyMonsterId | null;
  lastHitAt: number;
  lastHitKind: TowerKind['id'] | null;
  lastDamage: number;
};

type EnemyKindData = {
  id: EasyMonsterId;
  name: string;
  hp: number;
  speed: number;
  reward: number;
  ability: string;
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

type GameSound = 'enemySpawn' | 'bossSpawn' | 'arrowHit' | 'slowHit' | 'blastHit' | 'waveStart';

type AiFunctionResponse = {
  text?: string;
};

type BackgroundMusicEngine = {
  master: GainNode;
  filter: BiquadFilterNode;
  delay: DelayNode;
  feedback: GainNode;
  drones: OscillatorNode[];
  timers: number[];
  tempo: number;
  paused: boolean;
};

type RetentionProfile = {
  user_id: string;
  display_name: string;
  xp: number;
  streak_days: number;
  last_check_in_date: string | null;
  best_wave: number;
  total_kills: number;
  daily_challenge_date: string | null;
  daily_kills: number;
  daily_waves: number;
  daily_completed: boolean;
  weekly_challenge_date: string | null;
  weekly_kills: number;
  weekly_waves: number;
  weekly_completed: boolean;
  monthly_challenge_date: string | null;
  monthly_kills: number;
  monthly_waves: number;
  monthly_completed: boolean;
};

type RetentionLeaderboardEntry = {
  display_name: string;
  xp: number;
  streak_days: number;
  best_wave: number;
  total_kills: number;
};

type DailyChallenge = {
  title: string;
  description: string;
  goal: number;
  rewardXp: number;
  getProgress: (profile: RetentionProfile) => number;
};

const boardSize = 10;
const maxTowerLevel = 3;
const maxWaves = 40;
const baseWaveDuration = 30;
const skipUnlockDelay = 25;
const requiredLoadoutSize = 3;
const minBoardZoom = 0.65;
const maxBoardZoom = 1.18;
const boardViewAngle = 20;
const minBoardTilt = 12;
const maxBoardTilt = 62;
const cameraDragThreshold = 8;
const pathCells = [0, 1, 2, 3, 13, 23, 33, 34, 35, 45, 55, 65, 64, 63, 73, 83, 84, 85, 86, 96, 97, 98, 99];
const buildCells = [11, 12, 14, 21, 22, 24, 31, 32, 36, 37, 42, 43, 44, 46, 47, 54, 56, 57, 62, 66, 67, 72, 74, 75, 82, 87, 88, 92, 93, 94, 95];
const highlandCells = [12, 24, 36, 47, 62, 74, 88, 94];

const battleMaps: BattleMapLayout[] = [
  {
    id: 1,
    name: 'Каменный зигзаг',
    description: 'Длинная учебная дорога с удобными платформами у поворотов.',
    pathCells,
    buildCells,
    highlandCells,
    decorations: [
      { kind: 'mammoth', x: 8, y: 1, spanX: 2, spanY: 2 },
      { kind: 'hut', x: 1, y: 8, spanX: 2, spanY: 2 },
      { kind: 'volcano', x: 9, y: 6, spanX: 2, spanY: 3 },
      { kind: 'rockPile', x: 1, y: 5, spanX: 2, spanY: 2 },
    ],
  },
  {
    id: 2,
    name: 'Античная петля',
    description: 'Маршрут обходит центр, поэтому башни в середине держат сразу две стороны.',
    pathCells: [4, 14, 24, 34, 44, 43, 42, 41, 40, 50, 60, 70, 71, 72, 73, 74, 75, 65, 55, 56, 57, 58, 59, 69, 79, 89, 99],
    buildCells: [2, 3, 5, 6, 13, 15, 22, 23, 25, 26, 31, 32, 35, 36, 45, 46, 47, 51, 52, 53, 61, 62, 63, 64, 76, 77, 78, 86, 87, 88, 95, 96],
    highlandCells: [23, 35, 46, 62, 76, 87],
    decorations: [
      { kind: 'watchTower', x: 1, y: 1, spanX: 2, spanY: 3 },
      { kind: 'house', x: 7, y: 2, spanX: 2, spanY: 2 },
      { kind: 'mountain', x: 7, y: 7, spanX: 3, spanY: 2 },
    ],
  },
  {
    id: 3,
    name: 'Ворота замка',
    description: 'Две длинные прямые заставляют комбинировать быстрый урон и замедление.',
    pathCells: [90, 80, 70, 60, 50, 40, 30, 31, 32, 33, 34, 35, 36, 46, 56, 66, 76, 77, 78, 79, 89, 99],
    buildCells: [81, 82, 83, 91, 92, 93, 51, 52, 53, 41, 42, 43, 24, 25, 26, 37, 47, 57, 67, 68, 69, 84, 85, 86, 94, 95, 96],
    highlandCells: [42, 52, 68, 84, 95],
    decorations: [
      { kind: 'watchTower', x: 1, y: 1, spanX: 2, spanY: 3 },
      { kind: 'house', x: 1, y: 8, spanX: 2, spanY: 2 },
      { kind: 'mountain', x: 6, y: 1, spanX: 3, spanY: 2 },
    ],
  },
  {
    id: 4,
    name: 'Паровой район',
    description: 'Короткие повороты и тесные платформы проверяют точность расстановки.',
    pathCells: [9, 8, 7, 17, 27, 26, 25, 35, 45, 44, 43, 53, 63, 64, 65, 75, 85, 84, 83, 82, 92, 91, 90],
    buildCells: [5, 6, 16, 18, 24, 28, 34, 36, 37, 42, 46, 47, 52, 54, 55, 62, 66, 67, 72, 73, 74, 76, 81, 86, 93, 94, 95],
    highlandCells: [18, 36, 47, 62, 73, 86],
    decorations: [
      { kind: 'mineCart', x: 1, y: 8, spanX: 2, spanY: 2 },
      { kind: 'pipe', x: 9, y: 3, spanX: 2, spanY: 3 },
      { kind: 'factoryBlock', x: 6, y: 1, spanX: 2, spanY: 2 },
    ],
  },
  {
    id: 5,
    name: 'Разлом секунд',
    description: 'Дорога пересекает почти всё поле, а сильные позиции стоят далеко друг от друга.',
    pathCells: [10, 11, 12, 22, 32, 33, 34, 35, 25, 15, 16, 17, 27, 37, 47, 57, 56, 55, 65, 75, 76, 77, 87, 97, 98, 99],
    buildCells: [0, 1, 2, 13, 14, 20, 21, 23, 24, 26, 31, 36, 41, 42, 43, 44, 45, 46, 52, 53, 54, 58, 59, 64, 66, 67, 74, 78, 84, 85, 86, 88, 94, 95, 96],
    highlandCells: [14, 24, 43, 54, 67, 85, 96],
    decorations: [
      { kind: 'drone', x: 9, y: 1, spanX: 2, spanY: 2 },
      { kind: 'reactor', x: 1, y: 8, spanX: 2, spanY: 2 },
      { kind: 'energyPylon', x: 9, y: 5, spanX: 2, spanY: 3 },
    ],
  },
  {
    id: 6,
    name: 'Финальный портал',
    description: 'Самая длинная пробежка: центр силён, но фланги легко проваливаются.',
    pathCells: [5, 15, 25, 24, 23, 22, 32, 42, 52, 53, 54, 55, 56, 46, 36, 37, 38, 48, 58, 68, 67, 66, 76, 86, 96, 97, 98, 99],
    buildCells: [3, 4, 6, 7, 13, 14, 16, 17, 21, 26, 27, 31, 33, 34, 35, 41, 43, 44, 45, 51, 57, 61, 62, 63, 64, 65, 69, 75, 77, 85, 87, 94, 95],
    highlandCells: [14, 34, 45, 57, 64, 77, 95],
    decorations: [
      { kind: 'drone', x: 9, y: 1, spanX: 2, spanY: 2 },
      { kind: 'reactor', x: 1, y: 8, spanX: 2, spanY: 2 },
      { kind: 'energyPylon', x: 9, y: 5, spanX: 2, spanY: 3 },
      { kind: 'pipe', x: 1, y: 1, spanX: 2, spanY: 3 },
    ],
  },
];

const levelMap: LevelMapItem[] = [
  { id: 1, title: 'Искра времени', mapTitle: 'Каменный век', mapArea: 'stone', chapter: 'Обучение', startWave: 1, description: 'Первые башни и спокойные враги.' },
  { id: 2, title: 'Каменная тропа', mapTitle: 'Античность', mapArea: 'ancient', chapter: 'Обучение', startWave: 4, description: 'Дорога становится длиннее и опаснее.' },
  { id: 3, title: 'Ворота замка', mapTitle: 'Средневековье', mapArea: 'medieval', chapter: 'Средние уровни', startWave: 8, description: 'Появляются более крепкие волны.' },
  { id: 4, title: 'Паровой район', mapTitle: 'Индустриальная эпоха', mapArea: 'industrial', chapter: 'Средние уровни', startWave: 12, description: 'Нужно точнее выбирать башни.' },
  { id: 5, title: 'Разлом секунд', mapTitle: 'Будущее', mapArea: 'future', chapter: 'Сложные уровни', startWave: 18, description: 'Волны становятся плотнее и давят сильнее.' },
  { id: 6, title: 'Финальный портал', mapTitle: 'Киберпанк', mapArea: 'cyber', chapter: 'Сложные уровни', startWave: 26, description: 'Проверка всей защиты линии времени.' },
];

const levelMapSize = 30;
const levelMapPositions: Record<number, LevelMapPoint> = {
  1: { x: 4, y: 6 },
  2: { x: 22, y: 5 },
  3: { x: 23, y: 14 },
  4: { x: 22, y: 23 },
  5: { x: 5, y: 23 },
  6: { x: 4, y: 14 },
};

const levelRiftPoint: LevelMapPoint = { x: 15.5, y: 15.5 };
const levelRouteSegments = levelMap.flatMap((level) => [
  [levelMapPositions[level.id], levelRiftPoint] as const,
]);
const mapDecorations: MapDecoration[] = [
  { kind: 'mammoth', x: 6, y: 4, spanX: 3, spanY: 2, label: 'Мамонт' },
  { kind: 'stoneHut', x: 3, y: 11, spanX: 3, spanY: 3, label: 'Жилище охотников' },
  { kind: 'boulder', x: 8, y: 2, spanX: 2, spanY: 2, label: 'Камни' },
  { kind: 'volcano', x: 6, y: 16, spanX: 4, spanY: 4, label: 'Вулкан' },
  { kind: 'pyramid', x: 11, y: 8, spanX: 3, spanY: 3, label: 'Пирамида' },
  { kind: 'oasis', x: 17, y: 8, spanX: 3, spanY: 2, label: 'Оазис' },
  { kind: 'farmHouse', x: 22, y: 9, spanX: 3, spanY: 3, label: 'Дома' },
  { kind: 'pineMountain', x: 27, y: 12, spanX: 3, spanY: 4, label: 'Горы' },
  { kind: 'mine', x: 2, y: 24, spanX: 3, spanY: 3, label: 'Шахта' },
  { kind: 'smokeStack', x: 9, y: 19, spanX: 2, spanY: 3, label: 'Трубы' },
  { kind: 'hoverDrone', x: 27, y: 22, spanX: 2, spanY: 2, label: 'Дрон' },
  { kind: 'reactor', x: 21, y: 26, spanX: 3, spanY: 3, label: 'Реактор' },
  { kind: 'dataSpire', x: 17, y: 24, spanX: 2, spanY: 4, label: 'Башня данных' },
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

void mapDecorations;

const levelMapStorageKey = 'chrono-defense-completed-levels';
const achievementStatsStorageKey = 'chrono-defense-achievement-stats';
const tutorialSeenStorageKey = 'chrono-defense-tutorial-seen';
const tutorialBuildCell = 44;
const movementThreshold = 8;
const bossEnemyKindId: EasyMonsterId = 'tickingScarab';
const baseLevelXp = 120;

const emptyRetentionProfile: RetentionProfile = {
  user_id: '',
  display_name: 'Игрок',
  xp: 0,
  streak_days: 0,
  last_check_in_date: null,
  best_wave: 0,
  total_kills: 0,
  daily_challenge_date: null,
  daily_kills: 0,
  daily_waves: 0,
  daily_completed: false,
  weekly_challenge_date: null,
  weekly_kills: 0,
  weekly_waves: 0,
  weekly_completed: false,
  monthly_challenge_date: null,
  monthly_kills: 0,
  monthly_waves: 0,
  monthly_completed: false,
};

const emptyAchievementStats: AchievementStats = {
  totalKills: 0,
  wavesCompleted: 0,
  towersBuilt: 0,
  upgradesBought: 0,
  bossesDefeated: 0,
  maxWaveReached: 0,
  hardVictories: 0,
  antiTimeVictories: 0,
  noDamageVictories: 0,
  noSkipVictories: 0,
};

const achievements: Achievement[] = [
  {
    id: 'first-defense',
    title: 'Первая линия',
    description: 'Поставь первую башню.',
    goal: 1,
    getProgress: (stats) => stats.towersBuilt,
  },
  {
    id: 'builder',
    title: 'Архитектор времени',
    description: 'Построй 10 башен за все игры.',
    goal: 10,
    getProgress: (stats) => stats.towersBuilt,
  },
  {
    id: 'first-wave',
    title: 'Волна отбита',
    description: 'Пройди первую волну.',
    goal: 1,
    getProgress: (stats) => stats.wavesCompleted,
  },
  {
    id: 'wave-master',
    title: 'Держатель линии',
    description: 'Отбей 10 волн.',
    goal: 10,
    getProgress: (stats) => stats.wavesCompleted,
  },
  {
    id: 'hunter',
    title: 'Охотник на разломы',
    description: 'Победи 50 мобов.',
    goal: 50,
    getProgress: (stats) => stats.totalKills,
  },
  {
    id: 'chronoslayer',
    title: 'Хроно-истребитель',
    description: 'Победи 200 мобов.',
    goal: 200,
    getProgress: (stats) => stats.totalKills,
  },
  {
    id: 'upgrader',
    title: 'Мастер улучшений',
    description: 'Улучши башни 8 раз.',
    goal: 8,
    getProgress: (stats) => stats.upgradesBought,
  },
  {
    id: 'boss-breaker',
    title: 'Разбить хрономанта',
    description: 'Победи босса.',
    goal: 1,
    getProgress: (stats) => stats.bossesDefeated,
  },
  {
    id: 'map-runner',
    title: 'Путешественник эпох',
    description: 'Пройди 3 уровня на карте.',
    goal: 3,
    getProgress: (_stats, completedLevels) => completedLevels,
  },
  {
    id: 'hardtry-wave-30',
    title: 'Hardtry: 30-я волна',
    description: 'Дойди до 30-й волны в любой игре.',
    goal: 30,
    getProgress: (stats) => stats.maxWaveReached,
  },
  {
    id: 'hardtry-killer',
    title: 'Hardtry: тысяча разломов',
    description: 'Победи 1000 мобов за все игры.',
    goal: 1000,
    getProgress: (stats) => stats.totalKills,
  },
  {
    id: 'hardtry-architect',
    title: 'Hardtry: инженер эпох',
    description: 'Построй 100 башен за все игры.',
    goal: 100,
    getProgress: (stats) => stats.towersBuilt,
  },
  {
    id: 'hardtry-upgrades',
    title: 'Hardtry: максимум мощности',
    description: 'Купи 75 улучшений башен.',
    goal: 75,
    getProgress: (stats) => stats.upgradesBought,
  },
  {
    id: 'hardtry-boss-hunter',
    title: 'Hardtry: охотник на боссов',
    description: 'Победи 5 боссов.',
    goal: 5,
    getProgress: (stats) => stats.bossesDefeated,
  },
  {
    id: 'hardtry-hard-mode',
    title: 'Hardtry: разрыв закрыт',
    description: 'Победи на сложности «Разрыв».',
    goal: 1,
    getProgress: (stats) => stats.hardVictories,
  },
  {
    id: 'hardtry-antitime',
    title: 'Hardtry: антивремя сломано',
    description: 'Победи на сложности «Антивремя».',
    goal: 1,
    getProgress: (stats) => stats.antiTimeVictories,
  },
  {
    id: 'hardtry-perfect',
    title: 'Hardtry: идеальная линия',
    description: 'Победи, не получив урона по базе.',
    goal: 1,
    getProgress: (stats) => stats.noDamageVictories,
  },
  {
    id: 'hardtry-no-skip',
    title: 'Hardtry: ни секунды назад',
    description: 'Победи, ни разу не пропустив волну.',
    goal: 1,
    getProgress: (stats) => stats.noSkipVictories,
  },
];
const aiCommentatorSystem =
  'Ты ИИ-комментатор tower defense игры. Пиши по-русски, 1 короткое предложение до 120 символов. Не называй врагов, существ, монстров, боссов и их типы прямо. Только намекай на способности и советуй стиль защиты.';

const enemyKinds: Record<EasyMonsterId, EnemyKindData> = {
  tickingScarab: {
    id: 'tickingScarab',
    name: 'Тикающий Скарабей',
    hp: 100,
    speed: 8,
    reward: 16,
    ability: 'После смерти ускоряет ближайших врагов на 20%.',
  },
  lostSecond: {
    id: 'lostSecond',
    name: 'Потерянная Секунда',
    hp: 80,
    speed: 10,
    reward: 14,
    ability: 'Каждые 8 секунд становится неуязвимой на 1 секунду.',
  },
  shardRunner: {
    id: 'shardRunner',
    name: 'Осколочный Бегун',
    hp: 120,
    speed: 7,
    reward: 18,
    ability: 'После смерти распадается на 2 маленьких осколка.',
  },
  slowedWolf: {
    id: 'slowedWolf',
    name: 'Замедлившийся Волк',
    hp: 140,
    speed: 6,
    reward: 20,
    ability: 'Замедляет ближайшие башни на 10%.',
  },
  rustChronoid: {
    id: 'rustChronoid',
    name: 'Ржавый Хроноид',
    hp: 200,
    speed: 4,
    reward: 24,
    ability: 'Получает на 15% меньше физического урона.',
  },
  sandPincers: {
    id: 'sandPincers',
    name: 'Песочные Клещи',
    hp: 70,
    speed: 9,
    reward: 8,
    ability: 'Появляются группами по 5.',
  },
  chronoRat: {
    id: 'chronoRat',
    name: 'Хронокрыс',
    hp: 90,
    speed: 8,
    reward: 14,
    ability: 'Имеет 10% шанс уклониться от удара.',
  },
  loopSoldier: {
    id: 'loopSoldier',
    name: 'Зацикленный Солдат',
    hp: 180,
    speed: 5,
    reward: 24,
    ability: 'Каждые 10 секунд восстанавливает 15% HP.',
  },
  microRift: {
    id: 'microRift',
    name: 'Микроразломник',
    hp: 160,
    speed: 6,
    reward: 22,
    ability: 'Телепортируется на 1 клетку вперёд.',
  },
  minuteGhost: {
    id: 'minuteGhost',
    name: 'Минутный Призрак',
    hp: 130,
    speed: 7,
    reward: 20,
    ability: 'Получает на 50% меньше магического урона.',
  },
  clockhander: {
    id: 'clockhander',
    name: 'Стрелочник',
    hp: 170,
    speed: 5,
    reward: 22,
    ability: 'Ускоряется при потере здоровья.',
  },
  brokenCourier: {
    id: 'brokenCourier',
    name: 'Сломанный Посыльный',
    hp: 150,
    speed: 8,
    reward: 20,
    ability: 'Игнорирует первое замедление.',
  },
  clockworkSpider: {
    id: 'clockworkSpider',
    name: 'Часовой Паук',
    hp: 120,
    speed: 7,
    reward: 18,
    ability: 'После смерти выпускает мелких паучков.',
  },
};

function toSvgDataUri(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function createTowerSprite(icon: string, primary: string, secondary: string, accent: string) {
  return toSvgDataUri(`
    <svg width="220" height="220" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-30%" y="-20%" width="160%" height="160%" color-interpolation-filters="sRGB">
          <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#071517" flood-opacity="0.32"/>
        </filter>
        <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(110 88) rotate(90) scale(92)">
          <stop stop-color="#ffffff" stop-opacity="0.92"/>
          <stop offset="0.34" stop-color="${accent}" stop-opacity="0.68"/>
          <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="body" x1="62" y1="48" x2="152" y2="176" gradientUnits="userSpaceOnUse">
          <stop stop-color="${primary}"/>
          <stop offset="1" stop-color="${secondary}"/>
        </linearGradient>
      </defs>
      <ellipse cx="110" cy="190" rx="62" ry="14" fill="#071517" opacity="0.28"/>
      <circle cx="110" cy="92" r="78" fill="url(#glow)" opacity="0.78"/>
      <g filter="url(#shadow)">
        <path d="M72 174L84 86L110 56L136 86L148 174H72Z" fill="url(#body)" stroke="#111820" stroke-width="8" stroke-linejoin="round"/>
        <path d="M88 87H132L142 172H78L88 87Z" fill="#ffffff" opacity="0.14"/>
        <circle cx="110" cy="92" r="34" fill="#111820" stroke="${accent}" stroke-width="7"/>
        <circle cx="110" cy="92" r="21" fill="${accent}" opacity="0.92"/>
        <text x="110" y="102" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="900" fill="#111820">${icon}</text>
        <path d="M63 174H157" stroke="#111820" stroke-width="10" stroke-linecap="round"/>
        <path d="M66 133C86 146 134 146 154 133" stroke="${accent}" stroke-width="5" stroke-linecap="round" opacity="0.82"/>
        <path d="M54 80L75 92M166 82L145 93M77 44L91 66M143 44L129 66" stroke="${accent}" stroke-width="6" stroke-linecap="round" opacity="0.82"/>
      </g>
    </svg>
  `);
}

const eras: Era[] = [
  {
    name: 'Каменный век',
    year: '10 000 до н.э.',
    accent: '#7C6A4F',
    ground: 'stone',
    enemy: 'M',
    tower: 'A',
    description: 'Охотники защищают костер от мамонтов.',
  },
  {
    name: 'Средневековье',
    year: '1382',
    accent: '#5E6D82',
    ground: 'castle',
    enemy: 'K',
    tower: 'C',
    description: 'Башни замка держат дорогу через ворота.',
  },
  {
    name: 'Индустриальная эпоха',
    year: '1899',
    accent: '#6B5647',
    ground: 'factory',
    enemy: 'D',
    tower: 'G',
    description: 'Паровые машины ускоряют оборону города.',
  },
  {
    name: 'Будущее',
    year: '2147',
    accent: '#4E8199',
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
    sprite: toSvgDataUri(timeScoutSpriteSvg),
    cost: 35,
    damage: 34,
    range: 2.25,
    cooldown: 760,
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
    sprite: toSvgDataUri(chronoBlastSpriteSvg),
    cost: 55,
    damage: 16,
    range: 2.55,
    cooldown: 980,
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
    sprite: toSvgDataUri(temporalSniperSpriteSvg),
    cost: 80,
    damage: 92,
    range: 2,
    cooldown: 1260,
    elevatedOnly: true,
    levelDescriptions: ['Пороховой заряд: тяжелый одиночный удар.', 'Усиленное ядро: взрыв бьет заметно больнее.', 'Осадная машина: максимальный урон по крепким целям.'],
  },
];

const extraTowerKinds: TowerKind[] = [
  {
    id: 'rift',
    name: 'Разломщик',
    icon: 'R',
    sprite: createTowerSprite('R', '#3e2d73', '#17111f', '#b986ff'),
    cost: 140,
    damage: 18,
    range: 2.4,
    cooldown: 2800,
    levelDescriptions: ['Открывает короткий разлом: цель и враги рядом получают урон и застревают на миг.', 'Разлом шире: контроль длится дольше, а импульс бьет больнее.', 'Стабильная трещина времени: толпа рядом почти останавливается.'],
  },
  {
    id: 'hourglass',
    name: 'Песочные часы',
    icon: 'H',
    sprite: createTowerSprite('H', '#d8a64d', '#6c4424', '#ffe08a'),
    cost: 120,
    damage: 8,
    range: 3,
    cooldown: 1600,
    levelDescriptions: ['Переворачивает песок времени: цель замедляется и становится уязвимее к ударам.', 'Песок течет вверх: замедление держится дольше.', 'Хроно-пыль: враги в радиусе теряют темп почти без перерыва.'],
  },
  {
    id: 'forge',
    name: 'Хронокузница',
    icon: 'F',
    sprite: createTowerSprite('F', '#48515d', '#23272f', '#ffb85f'),
    cost: 180,
    damage: 0,
    range: 2,
    cooldown: 1000,
    levelDescriptions: ['Кует секунды: башни рядом стреляют быстрее.', 'Горячие шестерни: бонус скорости атаки становится сильнее.', 'Мастерская эпох: соседние башни работают заметно быстрее.'],
  },
  {
    id: 'mirror',
    name: 'Зеркало эпох',
    icon: 'M',
    sprite: createTowerSprite('M', '#cfd6dc', '#59636f', '#9ceeff'),
    cost: 150,
    damage: 12,
    range: 2.2,
    cooldown: 1450,
    levelDescriptions: ['Отражает слабый импульс: цель получает урон, часть удара цепляет соседей.', 'Зеркальная грань: отраженный урон усиливается.', 'Панорама эпох: отражение задевает больше угроз рядом.'],
  },
  {
    id: 'pulsar',
    name: 'Пульсар секунд',
    icon: 'P',
    sprite: createTowerSprite('P', '#217985', '#12333a', '#75fff0'),
    cost: 170,
    damage: 22,
    range: 2,
    cooldown: 2400,
    levelDescriptions: ['Пульсирует по клетке: все враги на одной клетке получают урон.', 'Плотный импульс: удар по скоплению становится сильнее.', 'Секундная вспышка: клетка цели взрывается мощной волной.'],
  },
  {
    id: 'beacon',
    name: 'Маяк памяти',
    icon: 'L',
    sprite: createTowerSprite('L', '#f0d58a', '#7a4f2b', '#fff8c7'),
    cost: 130,
    damage: 5,
    range: 3.5,
    cooldown: 1200,
    levelDescriptions: ['Подсвечивает искажения: попадает по неуловимым целям и снижает уклонение.', 'Луч памяти: точность и стабильность удара растут.', 'Полный обзор: даже странные временные защиты хуже спасают врагов.'],
  },
  {
    id: 'archive',
    name: 'Архивариус',
    icon: 'A',
    sprite: createTowerSprite('A', '#6d4d9a', '#30243e', '#d9c3ff'),
    cost: 160,
    damage: 10,
    range: 2.3,
    cooldown: 1700,
    levelDescriptions: ['Записывает победы: враги, павшие рядом, дают больше монет.', 'Толстый каталог: бонус монет становится выше.', 'Главный архив: защита рядом быстрее окупается.'],
  },
  {
    id: 'sun',
    name: 'Солнечный обелиск',
    icon: 'O',
    sprite: createTowerSprite('O', '#d28b35', '#6b311f', '#fff06a'),
    cost: 220,
    damage: 70,
    range: 3.2,
    cooldown: 3500,
    elevatedOnly: true,
    levelDescriptions: ['Копит луч: редкий, но очень сильный удар по одной цели.', 'Раскаленный камень: луч пробивает крепких врагов сильнее.', 'Солнце эпохи: огромный урон по самой важной цели.'],
  },
  {
    id: 'gravity',
    name: 'Грави-якорь',
    icon: 'G',
    sprite: createTowerSprite('G', '#283047', '#111622', '#8aa7ff'),
    cost: 175,
    damage: 14,
    range: 2.6,
    cooldown: 1750,
    levelDescriptions: ['Искривляет клетку: быстрые враги замедляются сильнее обычных.', 'Тяжелое поле: быстрые цели теряют еще больше темпа.', 'Якорь сингулярности: скорость рывков резко падает.'],
  },
];

const availableTowerKinds: TowerKind[] = [...towerKinds, ...extraTowerKinds];

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
    name: 'Разрыв',
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

const bossProfiles: Record<Difficulty['id'], BossProfile> = {
  easy: {
    name: 'Треснувший Хрономант',
    sprite: bossChronomancerSprite,
    portraitClass: 'boss-chronomancer',
  },
  experienced: {
    name: 'Повелитель Эпох',
    sprite: bossEpochLordSprite,
    portraitClass: 'boss-epoch-lord',
  },
  hard: {
    name: 'Разлом Сознания',
    sprite: bossMindRiftSprite,
    portraitClass: 'boss-mind-rift',
  },
  antiTime: {
    name: 'Нулевой Парадокс',
    sprite: bossZeroParadoxSprite,
    portraitClass: 'boss-zero-paradox',
  },
};

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

void getLevelMapCellClass;

function getEnemyCell(enemy: Enemy, activePathCells = pathCells) {
  return activePathCells[Math.min(enemy.step, activePathCells.length - 1)];
}

function getEnemyKind(kind: EasyMonsterId) {
  return enemyKinds[kind];
}

function getEnemyPool(wave: number): EasyMonsterId[] {
  if (wave < 3) return ['tickingScarab', 'sandPincers'];
  if (wave < 6) return ['tickingScarab', 'lostSecond', 'sandPincers', 'chronoRat'];
  if (wave < 10) return ['shardRunner', 'slowedWolf', 'brokenCourier', 'sandPincers'];
  if (wave < 15) return ['rustChronoid', 'loopSoldier', 'microRift', 'clockhander'];
  if (wave < 22) return ['minuteGhost', 'rustChronoid', 'brokenCourier', 'clockworkSpider', 'microRift'];
  return easyMonsterIds;
}

function getWaveThreatDescriptions(wave: number, difficultyData: Difficulty) {
  const regularEnemies = 5 + Math.ceil(wave * 1.45) + difficultyData.extraEnemies;
  const waveKinds = new Set<EasyMonsterId>();

  for (let spawnIndex = 1; spawnIndex <= regularEnemies; spawnIndex += 1) {
    waveKinds.add(chooseEnemyKind(wave, spawnIndex));
  }

  const descriptions = Array.from(waveKinds).map((kind) => getEnemyKind(kind).ability);

  if (isBossWave(wave)) {
    descriptions.push('оглушает башни, ускоряет угрозы рядом и становится быстрее при низком здоровье');
  }

  return descriptions;
}

function getFallbackWaveCommentary(wave: number, isBoss: boolean) {
  if (isBoss) {
    return `Комментатор: Волна ${wave}: держи запас прочности, темп может резко сломаться ближе к финалу.`;
  }

  return `Комментатор: Волна ${wave}: смотри не только на урон, но и на скорость, сопротивления и странные рывки.`;
}

function chooseEnemyKind(wave: number, spawnIndex: number) {
  const pool = getEnemyPool(wave);
  return pool[(spawnIndex + wave) % pool.length];
}

function getWaveHpMultiplier(wave: number) {
  return 0.72 + wave * 0.075;
}

function createEnemy(kindId: EasyMonsterId, wave: number, difficultyData: Difficulty, idSeed: number, now: number, hpScale = 1): Enemy {
  const kind = getEnemyKind(kindId);
  const maxHp = Math.round(kind.hp * getWaveHpMultiplier(wave) * difficultyData.hpMultiplier * hpScale);

  return {
    id: idSeed,
    kind: kindId,
    step: 0,
    hp: maxHp,
    maxHp,
    speed: kind.speed,
    reward: Math.round(kind.reward * (1 + wave * 0.025)),
    moveCharge: 0,
    createdAt: now,
    speedBoostUntil: 0,
    towerSlowUntil: 0,
    ignoredFirstSlow: false,
    lastAbilityAt: now,
    slowedUntil: 0,
    stoppedUntil: 0,
    gravityUntil: 0,
    isBoss: false,
    monsterId: kindId,
    lastHitAt: 0,
    lastHitKind: null,
    lastDamage: 0,
  };
}

function createBossEnemy(wave: number, difficultyData: Difficulty, idSeed: number, now: number): Enemy {
  const maxHp = Math.round(10000 * difficultyData.hpMultiplier);

  return {
    ...createEnemy(bossEnemyKindId, wave, difficultyData, idSeed, now, 1),
    hp: maxHp,
    maxHp,
    speed: 3,
    reward: 500,
    isBoss: true,
    monsterId: null,
  };
}

function getEnemySpeed(enemy: Enemy, now: number) {
  let speed = enemy.speed;

  if (enemy.stoppedUntil > now) speed *= 0.12;
  if (enemy.slowedUntil > now) speed *= 0.58;
  if (enemy.gravityUntil > now) speed *= enemy.speed >= 7 ? 0.55 : 0.82;
  if (enemy.speedBoostUntil > now) speed *= 1.2;
  if (enemy.kind === 'clockhander') {
    const lostHpRatio = 1 - enemy.hp / enemy.maxHp;
    speed *= 1 + lostHpRatio * 0.55;
  }
  if (enemy.isBoss && enemy.hp <= enemy.maxHp * 0.25) speed *= 1.5;

  return speed;
}

function isEnemyInvulnerable(enemy: Enemy, now: number) {
  return enemy.kind === 'lostSecond' && (now - enemy.createdAt) % 8000 < 1000;
}

function getDamageAfterResistance(enemy: Enemy, towerKind: TowerKind['id'], damage: number) {
  if (enemy.kind === 'chronoRat' && towerKind !== 'beacon' && Math.random() < 0.1) return 0;
  if (enemy.kind === 'rustChronoid' && towerKind !== 'slow') return Math.ceil(damage * 0.85);
  if (enemy.kind === 'minuteGhost' && towerKind === 'slow') return Math.ceil(damage * 0.5);
  if (towerKind === 'hourglass') return Math.ceil(damage * 1.15);
  if (towerKind === 'sun' && enemy.hp >= enemy.maxHp * 0.5) return Math.ceil(damage * 1.12);
  return damage;
}

function getTowerSlowMultiplier(tower: Tower, enemies: Enemy[], now: number, activePathCells = pathCells) {
  if (enemies.some((enemy) => enemy.isBoss && enemy.towerSlowUntil > now)) return 3.4;

  return enemies.some((enemy) => enemy.kind === 'slowedWolf' && enemy.towerSlowUntil > now && distanceBetweenCells(tower.cell, getEnemyCell(enemy, activePathCells)) <= 1.8)
    ? 1.1
    : 1;
}

function isBuildableCell(cell: number, activeBuildCells = buildCells) {
  return activeBuildCells.includes(cell);
}

function getTileDetailClass(cell: number, activeMap: BattleMapLayout = battleMaps[0]) {
  if (cell === activeMap.pathCells[0]) return 'start-gate';
  if (cell === activeMap.pathCells[activeMap.pathCells.length - 1]) return 'time-portal';
  if (activeMap.pathCells.includes(cell)) return cell % 2 === 0 ? 'path-stones' : 'path-dust';
  if (activeMap.highlandCells.includes(cell)) return 'build-highland';
  if (activeMap.buildCells.includes(cell)) return cell % 3 === 0 ? 'build-plate' : 'build-grass';
  if (cell % 11 === 0 || cell % 17 === 0) return 'terrain-rocks';
  if (cell % 7 === 0) return 'terrain-flowers';
  return cell % 5 === 0 ? 'terrain-grass' : 'terrain-soft';
}

function getWaveDuration(wave: number) {
  if (isBossWave(wave)) return 120;
  return baseWaveDuration + Math.min(20, wave * 3);
}

function getTowerKind(kind: TowerKind['id']) {
  return availableTowerKinds.find((tower) => tower.id === kind) ?? availableTowerKinds[0];
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

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getDps(damage: number, cooldown: number) {
  return (damage / (cooldown / 1000)).toFixed(1);
}

function getForgeCooldownMultiplier(tower: Tower, towers: Tower[]) {
  const nearbyForge = towers
    .filter((item) => item.kind === 'forge' && item.id !== tower.id)
    .find((forge) => distanceBetweenCells(tower.cell, forge.cell) <= getTowerStats(forge).range);

  if (!nearbyForge) return 1;

  return Math.max(0.68, 0.88 - (nearbyForge.level - 1) * 0.05);
}

function getArchiveRewardBonus(enemy: Enemy, towers: Tower[], activePathCells = pathCells) {
  const archive = towers
    .filter((tower) => tower.kind === 'archive')
    .find((tower) => distanceBetweenCells(tower.cell, getEnemyCell(enemy, activePathCells)) <= getTowerStats(tower).range);

  if (!archive) return 0;

  return Math.round(enemy.reward * (0.15 + (archive.level - 1) * 0.08));
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

function chooseTowerTarget(tower: Tower, enemies: Enemy[], range: number, activePathCells = pathCells) {
  const targets = enemies.filter((enemy) => distanceBetweenCells(tower.cell, getEnemyCell(enemy, activePathCells)) <= range);

  if (tower.targetPriority === 'strongest') {
    return targets.sort((a, b) => b.hp - a.hp || b.step - a.step || Number(b.isBoss) - Number(a.isBoss))[0];
  }

  if (tower.targetPriority === 'weakest') {
    return targets.sort((a, b) => a.hp - b.hp || b.step - a.step || Number(b.isBoss) - Number(a.isBoss))[0];
  }

  return targets.sort((a, b) => b.step - a.step || Number(b.isBoss) - Number(a.isBoss))[0];
}

function getTowerSplashTargets(tower: Tower, target: Enemy, enemies: Enemy[], activePathCells = pathCells) {
  if (tower.kind === 'pulsar') {
    const targetCell = getEnemyCell(target, activePathCells);
    return enemies.filter((enemy) => getEnemyCell(enemy, activePathCells) === targetCell);
  }

  if (tower.kind === 'rift' || tower.kind === 'mirror') {
    const splashRange = tower.kind === 'rift' ? 1.15 + tower.level * 0.12 : 0.95 + tower.level * 0.1;
    return enemies.filter((enemy) => distanceBetweenCells(getEnemyCell(target, activePathCells), getEnemyCell(enemy, activePathCells)) <= splashRange);
  }

  return [target];
}

function isBossWave(wave: number) {
  return wave === maxWaves;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function playTone(
  audioContext: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume: number,
  waveType: OscillatorType,
) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = waveType;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.03);
}

function playMusicNote(
  audioContext: AudioContext,
  destination: AudioNode,
  frequency: number,
  duration: number,
  volume: number,
) {
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = Math.random() > 0.58 ? 'triangle' : 'sine';
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.detune.setValueAtTime((Math.random() - 0.5) * 18, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.05);
}

function createBackgroundMusic(audioContext: AudioContext) {
  const master = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const delay = audioContext.createDelay();
  const feedback = audioContext.createGain();
  const droneGain = audioContext.createGain();
  const baseFrequencies = [55, 82.41, 110];
  const drones = baseFrequencies.map((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = index === 1 ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.detune.setValueAtTime(index === 2 ? -9 : 6, audioContext.currentTime);
    oscillator.connect(droneGain);
    oscillator.start();
    return oscillator;
  });

  master.gain.setValueAtTime(0.0001, audioContext.currentTime);
  master.gain.exponentialRampToValueAtTime(0.34, audioContext.currentTime + 1.2);
  droneGain.gain.setValueAtTime(0.095, audioContext.currentTime);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(760, audioContext.currentTime);
  filter.Q.setValueAtTime(7.5, audioContext.currentTime);
  delay.delayTime.setValueAtTime(0.34, audioContext.currentTime);
  feedback.gain.setValueAtTime(0.24, audioContext.currentTime);

  droneGain.connect(filter);
  filter.connect(delay);
  filter.connect(master);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(master);
  master.connect(audioContext.destination);

  return {
    master,
    filter,
    delay,
    feedback,
    drones,
    timers: [],
    tempo: 1,
    paused: false,
  };
}

function playMusicPulse(audioContext: AudioContext, destination: AudioNode, frequency: number, volume: number) {
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(now);
  oscillator.stop(now + 0.16);
}

function scheduleBackgroundMusic(audioContext: AudioContext, engine: BackgroundMusicEngine) {
  const scale = [55, 61.74, 65.41, 82.41, 98, 110, 123.47, 130.81, 164.81, 196];
  const timer = window.setTimeout(() => {
    if (!engine.master.context) return;

    if (Math.random() < 0.1) {
      engine.tempo = clamp(engine.tempo + (Math.random() - 0.5) * 0.42, 0.62, 1.55);
    }

    if (!engine.paused && Math.random() < 0.075) {
      engine.paused = true;
      const now = audioContext.currentTime;
      engine.master.gain.cancelScheduledValues(now);
      engine.master.gain.setValueAtTime(Math.max(engine.master.gain.value, 0.0001), now);
      engine.master.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      const pauseTimer = window.setTimeout(() => {
        const resumeTime = audioContext.currentTime;
        engine.paused = false;
        engine.master.gain.cancelScheduledValues(resumeTime);
        engine.master.gain.setValueAtTime(0.0001, resumeTime);
        engine.master.gain.exponentialRampToValueAtTime(0.34, resumeTime + 0.55);
      }, 900 + Math.random() * 2300);
      engine.timers.push(pauseTimer);
    }

    if (!engine.paused) {
      const note = scale[Math.floor(Math.random() * scale.length)];
      const octave = Math.random() > 0.78 ? 2 : 1;
      const frequency = note * octave;
      const duration = (0.34 + Math.random() * 0.9) / engine.tempo;
      const volume = 0.045 + Math.random() * 0.045;
      const now = audioContext.currentTime;

      engine.filter.frequency.cancelScheduledValues(now);
      engine.filter.frequency.setValueAtTime(engine.filter.frequency.value, now);
      engine.filter.frequency.linearRampToValueAtTime(420 + Math.random() * 900, now + 0.35);
      playMusicNote(audioContext, engine.filter, frequency, duration, volume);
      playMusicPulse(audioContext, engine.filter, 55 / engine.tempo, 0.026);

      if (Math.random() > 0.68) {
        playMusicNote(audioContext, engine.filter, frequency * 1.5, duration * 0.65, volume * 0.68);
      }

      if (Math.random() > 0.56) {
        const phrase = [frequency, frequency * 1.12, frequency * 1.5, frequency * 1.25];
        phrase.forEach((phraseFrequency, index) => {
          window.setTimeout(() => {
            if (!engine.paused) {
              playMusicNote(audioContext, engine.filter, phraseFrequency, 0.22 / engine.tempo, 0.032);
            }
          }, index * 145 / engine.tempo);
        });
      }
    }

    scheduleBackgroundMusic(audioContext, engine);
  }, (320 + Math.random() * 520) / engine.tempo);

  engine.timers.push(timer);
}

function stopBackgroundMusic(engine: BackgroundMusicEngine | null) {
  if (!engine) return;

  engine.timers.forEach((timer) => window.clearTimeout(timer));
  engine.drones.forEach((oscillator) => {
    try {
      oscillator.stop();
    } catch {
      undefined;
    }
  });
  engine.master.disconnect();
}

function playGameSound(audioContext: AudioContext, sound: GameSound) {
  const now = audioContext.currentTime;

  if (sound === 'enemySpawn') {
    playTone(audioContext, 180, now, 0.09, 0.035, 'square');
    playTone(audioContext, 132, now + 0.055, 0.08, 0.025, 'sawtooth');
    return;
  }

  if (sound === 'bossSpawn') {
    playTone(audioContext, 92, now, 0.22, 0.05, 'sawtooth');
    playTone(audioContext, 58, now + 0.08, 0.25, 0.035, 'triangle');
    return;
  }

  if (sound === 'arrowHit') {
    playTone(audioContext, 740, now, 0.055, 0.028, 'triangle');
    playTone(audioContext, 420, now + 0.035, 0.06, 0.02, 'square');
    return;
  }

  if (sound === 'slowHit') {
    playTone(audioContext, 330, now, 0.12, 0.028, 'sine');
    playTone(audioContext, 248, now + 0.05, 0.14, 0.02, 'triangle');
    return;
  }

  if (sound === 'blastHit') {
    playTone(audioContext, 118, now, 0.14, 0.045, 'sawtooth');
    playTone(audioContext, 74, now + 0.045, 0.16, 0.03, 'square');
    return;
  }

  playTone(audioContext, 420, now, 0.08, 0.025, 'triangle');
  playTone(audioContext, 620, now + 0.07, 0.1, 0.02, 'sine');
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekKey(date = new Date()) {
  const weekStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = weekStart.getUTCDay() || 7;
  weekStart.setUTCDate(weekStart.getUTCDate() - day + 1);
  return weekStart.toISOString().slice(0, 10);
}

function getMonthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

function getDaysBetween(firstDate: string, secondDate: string) {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(secondDate) - Date.parse(firstDate)) / dayMs);
}

function getLevelFromXp(xp: number) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / baseLevelXp)) + 1;
}

function getCurrentLevelXp(level: number) {
  return (level - 1) * (level - 1) * baseLevelXp;
}

function getNextLevelXp(level: number) {
  return level * level * baseLevelXp;
}

function getDailyChallenge(dateKey: string): DailyChallenge {
  const dayNumber = Math.floor(Date.parse(dateKey) / (24 * 60 * 60 * 1000));
  const challenges: DailyChallenge[] = [
    {
      title: 'Охота дня',
      description: 'Победи 35 мобов сегодня.',
      goal: 35,
      rewardXp: 100,
      getProgress: (profile) => profile.daily_kills,
    },
    {
      title: 'Дежурство у портала',
      description: 'Отбей 3 волны сегодня.',
      goal: 3,
      rewardXp: 100,
      getProgress: (profile) => profile.daily_waves,
    },
    {
      title: 'Короткая смена',
      description: 'Победи 20 мобов сегодня.',
      goal: 20,
      rewardXp: 100,
      getProgress: (profile) => profile.daily_kills,
    },
    {
      title: 'Три удара времени',
      description: 'Отбей 5 волн сегодня.',
      goal: 5,
      rewardXp: 100,
      getProgress: (profile) => profile.daily_waves,
    },
  ];

  return challenges[dayNumber % challenges.length];
}

function getWeeklyChallenge(weekKey: string): DailyChallenge {
  const weekNumber = Math.floor(Date.parse(weekKey) / (7 * 24 * 60 * 60 * 1000));
  const challenges: DailyChallenge[] = [
    {
      title: 'Недельный гарнизон',
      description: 'Отбей 24 волны за неделю.',
      goal: 24,
      rewardXp: 420,
      getProgress: (profile) => profile.weekly_waves,
    },
    {
      title: 'Операция разлом',
      description: 'Победи 320 мобов за неделю.',
      goal: 320,
      rewardXp: 420,
      getProgress: (profile) => profile.weekly_kills,
    },
  ];

  return challenges[weekNumber % challenges.length];
}

function getMonthlyChallenge(_monthKey: string): DailyChallenge {
  return {
    title: 'Супер-пупер марафон времени',
    description: 'За месяц победи 1800 мобов и докажи, что портал под контролем.',
    goal: 1800,
    rewardXp: 1800,
    getProgress: (profile) => profile.monthly_kills,
  };
}

function refreshRetentionForToday(profile: RetentionProfile, todayKey = getTodayKey()) {
  const weekKey = getWeekKey();
  const monthKey = getMonthKey();
  const lastCheckInDate = profile.last_check_in_date;
  const streakDays =
    lastCheckInDate === todayKey
      ? profile.streak_days
      : lastCheckInDate && getDaysBetween(lastCheckInDate, todayKey) === 1
        ? profile.streak_days + 1
        : 1;

  const isSameChallengeDay = profile.daily_challenge_date === todayKey;
  const isSameChallengeWeek = profile.weekly_challenge_date === weekKey;
  const isSameChallengeMonth = profile.monthly_challenge_date === monthKey;

  return {
    ...profile,
    streak_days: streakDays,
    last_check_in_date: todayKey,
    daily_challenge_date: todayKey,
    daily_kills: isSameChallengeDay ? profile.daily_kills : 0,
    daily_waves: isSameChallengeDay ? profile.daily_waves : 0,
    daily_completed: isSameChallengeDay ? profile.daily_completed : false,
    weekly_challenge_date: weekKey,
    weekly_kills: isSameChallengeWeek ? profile.weekly_kills : 0,
    weekly_waves: isSameChallengeWeek ? profile.weekly_waves : 0,
    weekly_completed: isSameChallengeWeek ? profile.weekly_completed : false,
    monthly_challenge_date: monthKey,
    monthly_kills: isSameChallengeMonth ? profile.monthly_kills : 0,
    monthly_waves: isSameChallengeMonth ? profile.monthly_waves : 0,
    monthly_completed: isSameChallengeMonth ? profile.monthly_completed : false,
  };
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

function readAchievementStats() {
  const savedStats = window.localStorage.getItem(achievementStatsStorageKey);
  if (!savedStats) return emptyAchievementStats;

  try {
    const parsedStats: unknown = JSON.parse(savedStats);
    if (!parsedStats || typeof parsedStats !== 'object') return emptyAchievementStats;

    const stats = parsedStats as Partial<Record<keyof AchievementStats, unknown>>;
    return {
      totalKills: typeof stats.totalKills === 'number' ? stats.totalKills : 0,
      wavesCompleted: typeof stats.wavesCompleted === 'number' ? stats.wavesCompleted : 0,
      towersBuilt: typeof stats.towersBuilt === 'number' ? stats.towersBuilt : 0,
      upgradesBought: typeof stats.upgradesBought === 'number' ? stats.upgradesBought : 0,
      bossesDefeated: typeof stats.bossesDefeated === 'number' ? stats.bossesDefeated : 0,
      maxWaveReached: typeof stats.maxWaveReached === 'number' ? stats.maxWaveReached : 0,
      hardVictories: typeof stats.hardVictories === 'number' ? stats.hardVictories : 0,
      antiTimeVictories: typeof stats.antiTimeVictories === 'number' ? stats.antiTimeVictories : 0,
      noDamageVictories: typeof stats.noDamageVictories === 'number' ? stats.noDamageVictories : 0,
      noSkipVictories: typeof stats.noSkipVictories === 'number' ? stats.noSkipVictories : 0,
    };
  } catch {
    return emptyAchievementStats;
  }
}

function readTutorialSeen() {
  return window.localStorage.getItem(tutorialSeenStorageKey) === 'true';
}

function getAchievementProgress(achievement: Achievement, stats: AchievementStats, completedLevels: number) {
  return Math.min(achievement.goal, achievement.getProgress(stats, completedLevels));
}

export function TimeTowerDefense({ userEmail, userId }: { userEmail: string; userId?: string }) {
  const [screen, setScreen] = useState<GameScreen>(() => (readTutorialSeen() ? 'start' : 'tutorial'));
  const [playerName, setPlayerName] = useState('');
  const [playerAge, setPlayerAge] = useState('');
  const [profileError, setProfileError] = useState('');
  const [tutorialSeen, setTutorialSeen] = useState(readTutorialSeen);
  const [practiceTutorialActive, setPracticeTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>('selectTower');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [completedLevelIds, setCompletedLevelIds] = useState<number[]>(readCompletedLevelIds);
  const [achievementStats, setAchievementStats] = useState<AchievementStats>(readAchievementStats);
  const [retentionProfile, setRetentionProfile] = useState<RetentionProfile>(() =>
    refreshRetentionForToday({ ...emptyRetentionProfile, user_id: userId ?? '', display_name: userEmail || 'Игрок' }),
  );
  const [leaderboard, setLeaderboard] = useState<RetentionLeaderboardEntry[]>([]);
  const [retentionLoading, setRetentionLoading] = useState(Boolean(userId));
  const [selectedLevelId, setSelectedLevelId] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty['id']>('easy');
  const selectedDifficultyData = difficultyModes.find((mode) => mode.id === difficulty) ?? difficultyModes[0];
  const selectedBossProfile = bossProfiles[difficulty];
  const [eraIndex, setEraIndex] = useState(0);
  const [wave, setWave] = useState(1);
  const [coins, setCoins] = useState(selectedDifficultyData.startCoins);
  const [baseHp, setBaseHp] = useState(selectedDifficultyData.startBaseHp);
  const [selectedTower, setSelectedTower] = useState<TowerKind['id']>('arrow');
  const [towerSlots, setTowerSlots] = useState<TowerSlot[]>(['arrow', 'slow', 'blast', null, null, null]);
  const [selectedTowerId, setSelectedTowerId] = useState<number | null>(null);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [spawnedCount, setSpawnedCount] = useState(0);
  const [isWaveRunning, setIsWaveRunning] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [waveTimeLeft, setWaveTimeLeft] = useState(getWaveDuration(1));
  const [message, setMessage] = useState('Поставь башни и запусти первую волну.');
  const [commentatorMessage, setCommentatorMessage] = useState('');
  const [gameStartedAt, setGameStartedAt] = useState<number | null>(null);
  const [defeatDurationSeconds, setDefeatDurationSeconds] = useState(0);
  const [boardTilt, setBoardTilt] = useState(boardViewAngle);
  const [boardTurn, setBoardTurn] = useState(358);
  const [boardZoom, setBoardZoom] = useState(1);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const backgroundMusicRef = useRef<BackgroundMusicEngine | null>(null);
  const commentatorRequestRef = useRef(0);
  const runChallengeRef = useRef({ tookDamage: false, skippedWave: false });
  const cameraDragRef = useRef({
    active: false,
    hasMoved: false,
    startX: 0,
    startY: 0,
    startTilt: boardViewAngle,
    startTurn: 358,
  });
  const ignoreNextBoardClickRef = useRef(false);

  const era = eras[eraIndex];
  const selectedTowerData = getTowerKind(selectedTower);
  const equippedTowerIds = towerSlots.filter((slot): slot is TowerKind['id'] => slot !== null);
  const isSelectedTowerEquipped = equippedTowerIds.includes(selectedTower);
  const isLoadoutReady = equippedTowerIds.length >= Math.min(requiredLoadoutSize, availableTowerKinds.length);
  const selectedPlacedTower = towers.find((tower) => tower.id === selectedTowerId) ?? null;
  const selectedLevel = levelMap.find((level) => level.id === selectedLevelId) ?? levelMap[0];
  const selectedBattleMap = battleMaps.find((battleMap) => battleMap.id === selectedLevelId) ?? battleMaps[0];
  const enemiesInCurrentWave = 5 + Math.ceil(wave * 1.45) + selectedDifficultyData.extraEnemies + (isBossWave(wave) ? 1 : 0);
  const waveElapsedSeconds = Math.max(0, getWaveDuration(wave) - waveTimeLeft);
  const skipSecondsLeft = Math.max(0, skipUnlockDelay - waveElapsedSeconds);
  const canSkipWave = isWaveRunning && skipSecondsLeft === 0 && baseHp > 0 && !isVictory;
  const playerLabel = playerName.trim() || retentionProfile.display_name || userEmail || 'Гость';
  const completedAchievements = achievements.filter(
    (achievement) => getAchievementProgress(achievement, achievementStats, completedLevelIds.length) >= achievement.goal,
  ).length;
  const retentionLevel = getLevelFromXp(retentionProfile.xp);
  const currentLevelXp = getCurrentLevelXp(retentionLevel);
  const nextLevelXp = getNextLevelXp(retentionLevel);
  const levelProgressPercent = Math.round(((retentionProfile.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100);
  const dailyChallenge = getDailyChallenge(getTodayKey());
  const weeklyChallenge = getWeeklyChallenge(getWeekKey());
  const monthlyChallenge = getMonthlyChallenge(getMonthKey());
  const dailyProgress = Math.min(dailyChallenge.goal, dailyChallenge.getProgress(retentionProfile));
  const weeklyProgress = Math.min(weeklyChallenge.goal, weeklyChallenge.getProgress(retentionProfile));
  const monthlyProgress = Math.min(monthlyChallenge.goal, monthlyChallenge.getProgress(retentionProfile));
  const dailyProgressPercent = Math.round((dailyProgress / dailyChallenge.goal) * 100);
  const weeklyProgressPercent = Math.round((weeklyProgress / weeklyChallenge.goal) * 100);
  const monthlyProgressPercent = Math.round((monthlyProgress / monthlyChallenge.goal) * 100);

  function getAudioContext() {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => undefined);
    }

    return audioContext;
  }

  function startBackgroundMusic() {
    const audioContext = getAudioContext();
    if (backgroundMusicRef.current) return;

    const engine = createBackgroundMusic(audioContext);
    backgroundMusicRef.current = engine;
    playMusicNote(audioContext, engine.filter, 110, 1.2, 0.085);
    playMusicNote(audioContext, engine.filter, 164.81, 0.9, 0.065);
    playMusicNote(audioContext, engine.filter, 61.74, 1.6, 0.075);
    playMusicPulse(audioContext, engine.filter, 55, 0.04);
    scheduleBackgroundMusic(audioContext, engine);
  }

  function activateAudio() {
    startBackgroundMusic();
  }

  function playSound(sound: GameSound) {
    const audioContext = getAudioContext();
    startBackgroundMusic();
    playGameSound(audioContext, sound);
  }

  function applyTimedChallengeRewards(profile: RetentionProfile) {
    let nextProfile = profile;
    const daily = getDailyChallenge(nextProfile.daily_challenge_date ?? getTodayKey());
    const weekly = getWeeklyChallenge(nextProfile.weekly_challenge_date ?? getWeekKey());
    const monthly = getMonthlyChallenge(nextProfile.monthly_challenge_date ?? getMonthKey());

    if (!nextProfile.daily_completed && daily.getProgress(nextProfile) >= daily.goal) {
      nextProfile = { ...nextProfile, xp: nextProfile.xp + daily.rewardXp, daily_completed: true };
    }

    if (!nextProfile.weekly_completed && weekly.getProgress(nextProfile) >= weekly.goal) {
      nextProfile = { ...nextProfile, xp: nextProfile.xp + weekly.rewardXp, weekly_completed: true };
    }

    if (!nextProfile.monthly_completed && monthly.getProgress(nextProfile) >= monthly.goal) {
      nextProfile = { ...nextProfile, xp: nextProfile.xp + monthly.rewardXp, monthly_completed: true };
    }

    return nextProfile;
  }

  function updateRetentionProfile(update: (profile: RetentionProfile) => RetentionProfile) {
    setRetentionProfile((current) => applyTimedChallengeRewards(update(refreshRetentionForToday(current))));
  }

  function buildRetentionPayload(profile: RetentionProfile) {
    return {
      user_id: profile.user_id,
      display_name: profile.display_name,
      xp: profile.xp,
      streak_days: profile.streak_days,
      last_check_in_date: profile.last_check_in_date,
      best_wave: profile.best_wave,
      total_kills: profile.total_kills,
      daily_challenge_date: profile.daily_challenge_date,
      daily_kills: profile.daily_kills,
      daily_waves: profile.daily_waves,
      daily_completed: profile.daily_completed,
      weekly_challenge_date: profile.weekly_challenge_date,
      weekly_kills: profile.weekly_kills,
      weekly_waves: profile.weekly_waves,
      weekly_completed: profile.weekly_completed,
      monthly_challenge_date: profile.monthly_challenge_date,
      monthly_kills: profile.monthly_kills,
      monthly_waves: profile.monthly_waves,
      monthly_completed: profile.monthly_completed,
    };
  }

  function normalizeRetentionProfile(row: Partial<RetentionProfile> | null, fallbackName: string) {
    return refreshRetentionForToday({
      ...emptyRetentionProfile,
      user_id: userId ?? '',
      display_name: row?.display_name ?? fallbackName,
      xp: row?.xp ?? 0,
      streak_days: row?.streak_days ?? 0,
      last_check_in_date: row?.last_check_in_date ?? null,
      best_wave: row?.best_wave ?? 0,
      total_kills: row?.total_kills ?? 0,
      daily_challenge_date: row?.daily_challenge_date ?? null,
      daily_kills: row?.daily_kills ?? 0,
      daily_waves: row?.daily_waves ?? 0,
      daily_completed: row?.daily_completed ?? false,
      weekly_challenge_date: row?.weekly_challenge_date ?? null,
      weekly_kills: row?.weekly_kills ?? 0,
      weekly_waves: row?.weekly_waves ?? 0,
      weekly_completed: row?.weekly_completed ?? false,
      monthly_challenge_date: row?.monthly_challenge_date ?? null,
      monthly_kills: row?.monthly_kills ?? 0,
      monthly_waves: row?.monthly_waves ?? 0,
      monthly_completed: row?.monthly_completed ?? false,
    });
  }

  async function refreshLeaderboard() {
    if (!supabase) return;

    const { data } = await supabase.rpc('get_retention_leaderboard');
    if (!Array.isArray(data)) return;

    setLeaderboard(
      data
        .filter((row): row is RetentionLeaderboardEntry => {
          if (!row || typeof row !== 'object') return false;
          const entry = row as Partial<RetentionLeaderboardEntry>;
          return (
            typeof entry.display_name === 'string' &&
            typeof entry.xp === 'number' &&
            typeof entry.streak_days === 'number' &&
            typeof entry.best_wave === 'number' &&
            typeof entry.total_kills === 'number'
          );
        })
        .slice(0, 5),
    );
  }

  const enemiesByCell = useMemo(() => {
    const map = new Map<number, Enemy[]>();
    enemies.forEach((enemy) => {
      const cell = getEnemyCell(enemy, selectedBattleMap.pathCells);
      map.set(cell, [...(map.get(cell) ?? []), enemy]);
    });
    return map;
  }, [enemies, selectedBattleMap.pathCells]);

  useEffect(() => {
    let cancelled = false;

    async function loadRetentionProfile() {
      if (!userId || !supabase) {
        setRetentionLoading(false);
        setRetentionProfile(refreshRetentionForToday({ ...emptyRetentionProfile, display_name: userEmail || 'Гость' }));
        return;
      }

      setRetentionLoading(true);
      const fallbackName = playerName.trim() || userEmail || 'Игрок';
      const { data } = await supabase
        .from('retention_profiles')
        .select('user_id, display_name, xp, streak_days, last_check_in_date, best_wave, total_kills, daily_challenge_date, daily_kills, daily_waves, daily_completed, weekly_challenge_date, weekly_kills, weekly_waves, weekly_completed, monthly_challenge_date, monthly_kills, monthly_waves, monthly_completed')
        .eq('user_id', userId)
        .maybeSingle();

      if (cancelled) return;

      const profile = normalizeRetentionProfile(data, fallbackName);
      setRetentionProfile(profile);
      setRetentionLoading(false);
      await supabase.from('retention_profiles').upsert(buildRetentionPayload(profile));
      await refreshLeaderboard();
    }

    void loadRetentionProfile();

    return () => {
      cancelled = true;
    };
  }, [userId, userEmail]);

  useEffect(() => {
    return () => {
      stopBackgroundMusic(backgroundMusicRef.current);
      backgroundMusicRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!userId || !supabase || retentionLoading) return;

    const client = supabase;
    const timer = window.setTimeout(() => {
      void client
        .from('retention_profiles')
        .upsert(buildRetentionPayload({ ...retentionProfile, user_id: userId }))
        .then(() => refreshLeaderboard());
    }, 600);

    return () => window.clearTimeout(timer);
  }, [retentionLoading, retentionProfile, userId]);

  useEffect(() => {
    if (screen !== 'battle') return;

    const board = boardRef.current;
    if (!board) return;

    function handleWheel(event: globalThis.WheelEvent) {
      event.preventDefault();
      event.stopPropagation();
      setBoardZoom((current) => clamp(Number((current - event.deltaY * 0.0012).toFixed(2)), minBoardZoom, maxBoardZoom));
    }

    board.addEventListener('wheel', handleWheel, { passive: false });

    return () => board.removeEventListener('wheel', handleWheel);
  }, [screen]);

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
      const regularEnemies = 5 + Math.ceil(wave * 1.45) + selectedDifficultyData.extraEnemies;
      const spawnTimer = window.setInterval(() => {
        spawned += 1;
        const boss = isBossWave(wave) && spawned > regularEnemies;
        const now = Date.now();
        const kindId = boss ? bossEnemyKindId : chooseEnemyKind(wave, spawned);
        const groupSize = !boss && kindId === 'sandPincers' ? 5 : 1;
        const spawnedEnemies = Array.from({ length: groupSize }, (_, index) =>
          boss
            ? createBossEnemy(wave, selectedDifficultyData, now + spawned + index, now)
            : createEnemy(kindId, wave, selectedDifficultyData, now + spawned + index, now),
        );

      playSound(boss ? 'bossSpawn' : 'enemySpawn');
      setSpawnedCount((current) => current + spawnedEnemies.length);
      setEnemies((current) => [...current, ...spawnedEnemies]);

      if (spawned >= regularEnemies + (isBossWave(wave) ? 1 : 0)) {
        window.clearInterval(spawnTimer);
      }
    }, 780);

    return () => window.clearInterval(spawnTimer);
  }, [difficulty, isWaveRunning, selectedDifficultyData.extraEnemies, selectedDifficultyData.hpMultiplier, wave]);

  useEffect(() => {
    if (!isWaveRunning) return;

    const battleTimer = window.setInterval(() => {
      const now = Date.now();
      let coinsEarned = 0;
      let escapedDamage = 0;
      let defeatedCount = 0;
      let defeatedBosses = 0;
      let completedWaveCount = 0;
      let nextTowers = towers;

      setEnemies((currentEnemies) => {
        let nextEnemies = currentEnemies.map((enemy) => {
          let nextEnemy = enemy;

          if (enemy.kind === 'loopSoldier' && now - enemy.lastAbilityAt >= 10000) {
            nextEnemy = {
              ...nextEnemy,
              hp: Math.min(nextEnemy.maxHp, nextEnemy.hp + Math.round(nextEnemy.maxHp * 0.15)),
              lastAbilityAt: now,
            };
          }

          if (enemy.kind === 'microRift' && now - enemy.lastAbilityAt >= 6500) {
            nextEnemy = {
              ...nextEnemy,
              step: Math.min(selectedBattleMap.pathCells.length - 1, nextEnemy.step + 1),
              lastAbilityAt: now,
            };
          }

          if (enemy.kind === 'slowedWolf') {
            nextEnemy = { ...nextEnemy, towerSlowUntil: now + 900 };
          }

          if (enemy.isBoss && now - enemy.lastAbilityAt >= 9000) {
            const abilityIndex = Math.floor((now - enemy.createdAt) / 9000) % 2;
            nextEnemy = {
              ...nextEnemy,
              speedBoostUntil: abilityIndex === 1 ? now + 2500 : nextEnemy.speedBoostUntil,
              towerSlowUntil: abilityIndex === 0 ? now + 2000 : nextEnemy.towerSlowUntil,
              lastAbilityAt: now,
            };
          }

          const moveCharge = nextEnemy.moveCharge + getEnemySpeed(nextEnemy, now);
          const stepsToMove = Math.floor(moveCharge / movementThreshold);
          return {
            ...nextEnemy,
            moveCharge: moveCharge % movementThreshold,
            step: Math.min(selectedBattleMap.pathCells.length - 1, nextEnemy.step + stepsToMove),
          };
        });
        if (nextEnemies.some((enemy) => enemy.isBoss && enemy.speedBoostUntil > now)) {
          nextEnemies = nextEnemies.map((enemy) => (enemy.isBoss ? enemy : { ...enemy, speedBoostUntil: now + 2500 }));
        }

        nextTowers = towers.map((tower) => {
          const stats = getTowerStats(tower);
          const cooldown = stats.cooldown * getTowerSlowMultiplier(tower, nextEnemies, now, selectedBattleMap.pathCells) * getForgeCooldownMultiplier(tower, towers);
          if (now - tower.lastShotAt < cooldown) {
            return tower;
          }

          const target = chooseTowerTarget(tower, nextEnemies, stats.range, selectedBattleMap.pathCells);

          if (!target) return tower;

          const splashTargets = getTowerSplashTargets(tower, target, nextEnemies, selectedBattleMap.pathCells);
          const splashTargetIds = new Set(splashTargets.map((enemy) => enemy.id));
          playSound(stats.id === 'arrow' ? 'arrowHit' : stats.id === 'slow' || stats.id === 'hourglass' || stats.id === 'gravity' ? 'slowHit' : 'blastHit');
          nextEnemies = nextEnemies.map((enemy) => {
            if (!splashTargetIds.has(enemy.id)) return enemy;
            const isImmune = isEnemyInvulnerable(enemy, now) && stats.id !== 'beacon';
            const splashMultiplier = enemy.id === target.id ? 1 : stats.id === 'mirror' ? 0.55 : 0.72;
            const damage = isImmune ? 0 : getDamageAfterResistance(enemy, stats.id, Math.round(stats.damage * splashMultiplier));
            const canSlow = (stats.id === 'slow' || stats.id === 'hourglass' || stats.id === 'rift' || stats.id === 'gravity') && !isImmune;
            const ignoresSlow = canSlow && enemy.kind === 'brokenCourier' && !enemy.ignoredFirstSlow;
            const slowDuration =
              stats.id === 'hourglass'
                ? 2600 + tower.level * 420
                : stats.id === 'gravity'
                  ? 2400 + tower.level * 380
                  : 2200 + tower.level * 340;
            return {
              ...enemy,
              hp: enemy.hp - damage,
              slowedUntil: canSlow && !ignoresSlow ? now + slowDuration : enemy.slowedUntil,
              stoppedUntil: stats.id === 'rift' && !isImmune && !ignoresSlow ? now + 520 + tower.level * 180 : enemy.stoppedUntil,
              gravityUntil: stats.id === 'gravity' && !isImmune && !ignoresSlow ? now + 2600 + tower.level * 420 : enemy.gravityUntil,
              ignoredFirstSlow: enemy.ignoredFirstSlow || ignoresSlow,
              lastHitAt: now,
              lastHitKind: stats.id,
              lastDamage: damage,
            };
          });

          return {
            ...tower,
            lastShotAt: now,
            attackCount: tower.attackCount + 1,
            lastTargetCell: getEnemyCell(target, selectedBattleMap.pathCells),
          };
        });

        const spawnedByDeaths: Enemy[] = [];
        const defeatedEnemies = nextEnemies.filter((enemy) => enemy.hp <= 0);
        defeatedEnemies.forEach((enemy) => {
          if (enemy.kind === 'tickingScarab') {
            nextEnemies = nextEnemies.map((item) =>
              item.id !== enemy.id && Math.abs(item.step - enemy.step) <= 3 ? { ...item, speedBoostUntil: now + 3500 } : item,
            );
          }

          if (enemy.kind === 'shardRunner') {
            spawnedByDeaths.push(
              createEnemy('sandPincers', wave, selectedDifficultyData, now + enemy.id + 1, now, 0.38),
              createEnemy('sandPincers', wave, selectedDifficultyData, now + enemy.id + 2, now, 0.38),
            );
          }

          if (enemy.kind === 'clockworkSpider') {
            spawnedByDeaths.push(
              createEnemy('chronoRat', wave, selectedDifficultyData, now + enemy.id + 3, now, 0.45),
              createEnemy('chronoRat', wave, selectedDifficultyData, now + enemy.id + 4, now, 0.45),
            );
          }
        });

        const aliveEnemies = nextEnemies.filter((enemy) => {
          if (enemy.hp <= 0) {
            coinsEarned += enemy.reward + getArchiveRewardBonus(enemy, towers, selectedBattleMap.pathCells);
            defeatedCount += 1;
            if (enemy.isBoss) defeatedBosses += 1;
            return false;
          }
          if (enemy.step >= selectedBattleMap.pathCells.length - 1) {
            escapedDamage += enemy.isBoss ? baseHp : Math.max(1, Math.ceil(enemy.hp / 35));
            return false;
          }
          return true;
        }).concat(spawnedByDeaths);

        if (escapedDamage > 0) {
          runChallengeRef.current.tookDamage = true;
        }

        if (escapedDamage >= baseHp) {
          setIsWaveRunning(false);
          setWaveTimeLeft(0);
          setBaseHp(0);
          setMessage(`База получила ${escapedDamage} урона и разрушилась.`);
          return aliveEnemies;
        }

        if (aliveEnemies.length === 0 && spawnedCount >= enemiesInCurrentWave) {
          completedWaveCount += 1;
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
      if (defeatedCount > 0 || defeatedBosses > 0 || completedWaveCount > 0) {
        setAchievementStats((current) => ({
          ...current,
          totalKills: current.totalKills + defeatedCount,
          bossesDefeated: current.bossesDefeated + defeatedBosses,
          wavesCompleted: current.wavesCompleted + completedWaveCount,
        }));
        updateRetentionProfile((current) => ({
          ...current,
          xp: current.xp + defeatedCount * 2 + completedWaveCount * 30 + defeatedBosses * 220,
          total_kills: current.total_kills + defeatedCount,
          daily_kills: current.daily_kills + defeatedCount,
          daily_waves: current.daily_waves + completedWaveCount,
          weekly_kills: current.weekly_kills + defeatedCount,
          weekly_waves: current.weekly_waves + completedWaveCount,
          monthly_kills: current.monthly_kills + defeatedCount,
          monthly_waves: current.monthly_waves + completedWaveCount,
        }));
        if (practiceTutorialActive && tutorialStep === 'watchWave' && completedWaveCount > 0) {
          setPracticeTutorialActive(false);
          setTutorialStep('complete');
          window.localStorage.setItem(tutorialSeenStorageKey, 'true');
          setTutorialSeen(true);
          setMessage('Обучение завершено. Теперь можно пройти уровень самостоятельно.');
          setCommentatorMessage('Комментатор: база выстояла. Дальше пробуй разные башни, усиливай важные позиции и следи за HP базы.');
        }
      }
    }, 650);

    return () => window.clearInterval(battleTimer);
  }, [baseHp, enemiesInCurrentWave, isWaveRunning, practiceTutorialActive, selectedBattleMap.pathCells, spawnedCount, towers, tutorialStep, wave]);

  useEffect(() => {
    window.localStorage.setItem(levelMapStorageKey, JSON.stringify(completedLevelIds));
  }, [completedLevelIds]);

  useEffect(() => {
    window.localStorage.setItem(achievementStatsStorageKey, JSON.stringify(achievementStats));
  }, [achievementStats]);

  useEffect(() => {
    if (!isVictory) return;

    setCompletedLevelIds((current) =>
      current.includes(selectedLevelId) ? current : [...current, selectedLevelId],
    );
    setAchievementStats((current) => ({
      ...current,
      hardVictories: current.hardVictories + (difficulty === 'hard' ? 1 : 0),
      antiTimeVictories: current.antiTimeVictories + (difficulty === 'antiTime' ? 1 : 0),
      noDamageVictories: current.noDamageVictories + (runChallengeRef.current.tookDamage ? 0 : 1),
      noSkipVictories: current.noSkipVictories + (runChallengeRef.current.skippedWave ? 0 : 1),
    }));
  }, [difficulty, isVictory, selectedLevelId]);

  useEffect(() => {
    if (baseHp === 0) {
      setIsWaveRunning(false);
      setDefeatDurationSeconds(gameStartedAt ? Math.max(1, Math.floor((Date.now() - gameStartedAt) / 1000)) : 0);
      setMessage('HP базы закончилось. Попробуй другую расстановку.');
    }
  }, [baseHp, gameStartedAt]);

  function submitPlayerProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = playerName.trim();
    const age = Number(playerAge);

    if (cleanName.length < 3 || cleanName.length > 21) {
      setProfileError('Введи имя от 3 до 21 буквы.');
      return;
    }

    if (!Number.isInteger(age) || age < 6 || age > 99) {
      setProfileError('Введи возраст от 6 до 99.');
      return;
    }

    setPlayerName(cleanName);
    setPlayerAge(String(age));
    activateAudio();
    updateRetentionProfile((current) => ({ ...current, display_name: cleanName }));
    setProfileError('');
    setScreen(tutorialSeen ? 'start' : 'tutorial');
  }

  function openNameEditor() {
    setNameDraft(playerLabel);
    setProfileError('');
    setIsEditingName(true);
  }

  function submitNameChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = nameDraft.trim();
    if (cleanName.length < 3 || cleanName.length > 21) {
      setProfileError('Введи имя от 3 до 21 символа.');
      return;
    }

    setPlayerName(cleanName);
    updateRetentionProfile((current) => ({ ...current, display_name: cleanName }));
    setProfileError('');
    setIsEditingName(false);
    setMessage(`Имя игрока изменено на ${cleanName}.`);
  }

  function closeTutorial(nextScreen: GameScreen = 'start') {
    activateAudio();
    if (practiceTutorialActive) {
      setIsWaveRunning(false);
      setEnemies([]);
      setSpawnedCount(0);
    }
    setPracticeTutorialActive(false);
    window.localStorage.setItem(tutorialSeenStorageKey, 'true');
    setTutorialSeen(true);
    setScreen(nextScreen);
  }

  function startPracticeTutorial() {
    const firstLevel = levelMap[0];
    const easyMode = difficultyModes[0];

    activateAudio();
    setSelectedLevelId(firstLevel.id);
    setDifficulty(easyMode.id);
    resetGame(easyMode, firstLevel.startWave);
    setTowerSlots(['arrow', 'slow', 'blast', null, null, null]);
    setSelectedTower('arrow');
    setPracticeTutorialActive(true);
    setTutorialStep('selectTower');
    setScreen('battle');
    setGameStartedAt(Date.now());
    setDefeatDurationSeconds(0);
    setMessage('Обучение началось: выбери первую башню в панели слева.');
    setCommentatorMessage('Комментатор: начнем с практики. Слева выбери башню, потом поставь ее на подсвеченную платформу.');
  }

  function addTowerToSlot(kind: TowerKind['id']) {
    if (towerSlots.includes(kind)) {
      setSelectedTower(kind);
      setMessage(`${getTowerKind(kind).name} уже есть в слотах.`);
      return;
    }

    const emptySlotIndex = towerSlots.findIndex((slot) => slot === null);
    if (emptySlotIndex === -1) {
      setMessage('Все 6 слотов заняты. Убери башню из слота, чтобы добавить новую.');
      return;
    }

    setTowerSlots((current) => current.map((slot, index) => (index === emptySlotIndex ? kind : slot)));
    setSelectedTower(kind);
    setMessage(`${getTowerKind(kind).name} добавлен в слот ${emptySlotIndex + 1}.`);
  }

  function removeTowerFromSlot(slotIndex: number) {
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
    if (!kind) return;
    setSelectedTower(kind);
    setSelectedTowerId(null);
    if (practiceTutorialActive && tutorialStep === 'selectTower') {
      setTutorialStep('placeTower');
      setMessage('Отлично. Теперь нажми на подсвеченную платформу рядом с дорогой.');
      setCommentatorMessage('Комментатор: башни нельзя ставить на дорогу. Платформа рядом с поворотом даст больше времени для атаки.');
    }
  }

  function handleCellClick(cell: number) {
    if (ignoreNextBoardClickRef.current) {
      ignoreNextBoardClickRef.current = false;
      return;
    }

    const existingTower = towers.find((tower) => tower.cell === cell);
    if (existingTower) {
      setSelectedTowerId(existingTower.id);
      upgradeTower(existingTower);
      return;
    }

    if (!isBuildableCell(cell, selectedBattleMap.buildCells)) return;
    const isHighlandCell = selectedBattleMap.highlandCells.includes(cell);
    if (!isSelectedTowerEquipped) {
      setMessage('Сначала добавь башню в один из 6 слотов.');
      return;
    }

    if (selectedTowerData.elevatedOnly && !isHighlandCell) {
      setMessage(`${selectedTowerData.name} ставится только на возвышенности.`);
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
    setAchievementStats((current) => ({ ...current, towersBuilt: current.towersBuilt + 1 }));
    updateRetentionProfile((current) => ({ ...current, xp: current.xp + 4 }));
    if (practiceTutorialActive && (tutorialStep === 'placeTower' || tutorialStep === 'selectTower')) {
      setTutorialStep('startWave');
      setMessage('Башня поставлена. Теперь запусти волну кнопкой сверху.');
      setCommentatorMessage('Комментатор: монеты тратятся на башни и улучшения. После победы над врагами монеты вернутся наградой.');
      return;
    }

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
    setAchievementStats((current) => ({ ...current, upgradesBought: current.upgradesBought + 1 }));
    updateRetentionProfile((current) => ({ ...current, xp: current.xp + 8 }));
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
    setCommentatorMessage('');
    runChallengeRef.current = { tookDamage: false, skippedWave: false };
    setGameStartedAt(null);
    setDefeatDurationSeconds(0);
  }

  function selectDifficulty(mode: Difficulty) {
    if (isWaveRunning) return;
    setDifficulty(mode.id);
    resetGame(mode, selectedLevel.startWave);
    setTowerSlots([null, null, null, null, null, null]);
    setScreen('loadout');
    setMessage(`${selectedLevel.title}. Карта: ${selectedBattleMap.name}. ${mode.name}: собери набор башен перед входом в бой.`);
  }

  function beginBattleAfterLoadout() {
    if (!isLoadoutReady) {
      setMessage(`Выбери минимум ${Math.min(requiredLoadoutSize, availableTowerKinds.length)} башни в Бестиарии.`);
      return;
    }

    setScreen('battle');
    setGameStartedAt(Date.now());
    setDefeatDurationSeconds(0);
    setCommentatorMessage('');
    setMessage(`${selectedLevel.title}. Карта: ${selectedBattleMap.name}. ${selectedDifficultyData.name}: расставь башни и запускай волну.`);
  }

  function selectLevel(level: LevelMapItem) {
    if (isWaveRunning) return;
    const battleMap = battleMaps.find((mapLayout) => mapLayout.id === level.id) ?? battleMaps[0];

    activateAudio();
    setSelectedLevelId(level.id);
    setScreen('difficulty');
    setCommentatorMessage('');
    setMessage(`${level.title}: ${battleMap.name}. ${battleMap.description}`);
  }

  async function requestWaveCommentary(waveNumber: number, eraName: string, difficultyData: Difficulty) {
    const requestId = commentatorRequestRef.current + 1;
    commentatorRequestRef.current = requestId;

    const fallback = getFallbackWaveCommentary(waveNumber, isBossWave(waveNumber));
    setCommentatorMessage('Комментатор: анализирую искажения волны...');

    if (!supabase) {
      setCommentatorMessage(fallback);
      return;
    }

    const threatDescriptions = getWaveThreatDescriptions(waveNumber, difficultyData);
    const prompt = [
      `Волна: ${waveNumber}.`,
      `Эпоха: ${eraName}.`,
      `Сложность: ${difficultyData.name}.`,
      'Способности угроз, без названий:',
      ...threatDescriptions.map((description, index) => `${index + 1}. ${description}`),
      'Сделай полезный намек игроку. Не раскрывай, кто именно придет.',
    ].join('\n');

    try {
      const { data, error } = await supabase.functions.invoke<AiFunctionResponse>('ai', {
        body: {
          prompt,
          system: aiCommentatorSystem,
        },
      });

      if (commentatorRequestRef.current !== requestId) return;

      const text = data?.text?.trim();
      setCommentatorMessage(error || !text ? fallback : `Комментатор: ${text}`);
    } catch {
      if (commentatorRequestRef.current === requestId) {
        setCommentatorMessage(fallback);
      }
    }
  }

  function startWave() {
    if (isWaveRunning || baseHp === 0 || isVictory || wave > maxWaves) return;
    activateAudio();
    if (practiceTutorialActive && tutorialStep !== 'startWave') {
      setMessage('Сначала поставь башню на подсвеченную платформу.');
      setCommentatorMessage('Комментатор: без башни волна пройдет к базе. Нажми на желтую платформу рядом с дорогой.');
      return;
    }

    if (!isLoadoutReady) {
      setScreen('loadout');
      setMessage(`Сначала собери набор: минимум ${Math.min(requiredLoadoutSize, availableTowerKinds.length)} башни.`);
      return;
    }
    setSelectedTowerId(null);
    setEnemies([]);
    setSpawnedCount(0);
    setWaveTimeLeft(getWaveDuration(wave));
    playSound('waveStart');
    setIsWaveRunning(true);
    setAchievementStats((current) => ({ ...current, maxWaveReached: Math.max(current.maxWaveReached, wave) }));
    updateRetentionProfile((current) => ({
      ...current,
      xp: current.xp + 3,
      best_wave: Math.max(current.best_wave, wave),
    }));
    if (practiceTutorialActive && tutorialStep === 'startWave') {
      setTutorialStep('watchWave');
      setMessage('Волна началась. Смотри, как враги идут по дороге, а башня атакует их в радиусе.');
      setCommentatorMessage('Комментатор: если враги проходят слишком далеко, ставь башни ближе к поворотам и усиливай уже построенные.');
      return;
    }

    void requestWaveCommentary(wave, era.name, selectedDifficultyData);
    setMessage(
      isBossWave(wave)
        ? `Волна ${wave}: временной босс идет через ${era.name.toLowerCase()}. Режим: ${selectedDifficultyData.name}.`
        : `Волна ${wave} идет через ${era.name.toLowerCase()}. Режим: ${selectedDifficultyData.name}.`,
    );
  }

  function skipWave() {
    if (!canSkipWave) return;

    runChallengeRef.current.skippedWave = true;
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
    setGameStartedAt(Date.now());
    setMessage('Поставь башни и запусти волну.');
  }

  function returnToMainMenu() {
    resetGame(selectedDifficultyData, selectedLevel.startWave);
    setSelectedTowerId(null);
    setScreen('start');
    setMessage('Поставь башни и запусти первую волну.');
  }

  function startCameraDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target instanceof HTMLElement && event.target.closest('.tile')) return;

    cameraDragRef.current = {
      active: true,
      hasMoved: false,
      startX: event.clientX,
      startY: event.clientY,
      startTilt: boardTilt,
      startTurn: boardTurn,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function moveCamera(event: PointerEvent<HTMLDivElement>) {
    const drag = cameraDragRef.current;
    if (!drag.active) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.hypot(deltaX, deltaY) < cameraDragThreshold) {
      return;
    }

    if (!drag.hasMoved) {
      drag.hasMoved = true;
    }

    setBoardTurn(drag.startTurn + deltaX * 0.3);
    setBoardTilt(clamp(drag.startTilt + deltaY * 0.16, minBoardTilt, maxBoardTilt));
  }

  function stopCameraDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = cameraDragRef.current;
    if (!drag.active) return;

    cameraDragRef.current = { ...drag, active: false };
    if (drag.hasMoved) {
      ignoreNextBoardClickRef.current = true;
    }
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  function renderRetentionPanel(variant: 'profile' | 'main') {
    const isProfileVariant = variant === 'profile';
    const leaderboardRows = leaderboard.length > 0 ? leaderboard : [retentionProfile];
    const timedChallenges = [
      {
        label: 'Ежедневное',
        challenge: dailyChallenge,
        progress: dailyProgress,
        progressPercent: dailyProgressPercent,
        isCompleted: retentionProfile.daily_completed,
      },
      {
        label: 'Еженедельное',
        challenge: weeklyChallenge,
        progress: weeklyProgress,
        progressPercent: weeklyProgressPercent,
        isCompleted: retentionProfile.weekly_completed,
      },
      {
        label: 'Месяц',
        challenge: monthlyChallenge,
        progress: monthlyProgress,
        progressPercent: monthlyProgressPercent,
        isCompleted: retentionProfile.monthly_completed,
      },
    ];

    return (
      <section className={isProfileVariant ? 'retention-panel profile-retention' : 'retention-panel'}>
        <div className="retention-head">
          <div>
            <strong>Прогресс защитника</strong>
            <span>{userId ? 'сохраняется в Supabase' : 'войдите, чтобы сохранять онлайн'}</span>
          </div>
          <em>{retentionLoading ? '...' : `${retentionProfile.streak_days} дн. серия`}</em>
        </div>

        <div className="retention-grid">
          <div className="retention-stat">
            <span>Уровень</span>
            <strong>{retentionLevel}</strong>
            <small>{retentionProfile.xp} XP</small>
          </div>
          <div className="retention-stat">
            <span>Лучшая волна</span>
            <strong>{retentionProfile.best_wave}</strong>
            <small>{retentionProfile.total_kills} побед</small>
          </div>
          <div className="retention-stat">
            <span>Серия</span>
            <strong>{retentionProfile.streak_days}</strong>
            <small>дней подряд</small>
          </div>
        </div>

        <div className="xp-track" aria-label={`XP до следующего уровня ${levelProgressPercent}%`}>
          <span style={{ width: `${Math.max(3, Math.min(100, levelProgressPercent))}%` }} />
        </div>
        <p className="xp-caption">
          До уровня {retentionLevel + 1}: {Math.max(0, nextLevelXp - retentionProfile.xp)} XP
        </p>

        <div className="challenge-list">
          {timedChallenges.map((item) => (
            <div className="challenge-item" key={item.label}>
              <div className="daily-challenge">
                <div>
                  <strong>{item.label}: {item.challenge.title}</strong>
                  <span>{item.challenge.description} Награда: {item.challenge.rewardXp} XP.</span>
                </div>
                <small>{item.isCompleted ? 'готово' : `${item.progress}/${item.challenge.goal}`}</small>
              </div>
              <div className="daily-track" aria-label={`${item.label} задание ${item.progressPercent}%`}>
                <span style={{ width: `${Math.max(3, Math.min(100, item.progressPercent))}%` }} />
              </div>
            </div>
          ))}
        </div>

        {!isProfileVariant && (
          <div className="leaderboard-mini">
            <strong>Лидеры</strong>
            {leaderboardRows.slice(0, 5).map((entry, index) => (
              <span key={`${entry.display_name}-${index}`}>
                <b>{index + 1}</b>
                {entry.display_name}
                <em>{entry.xp} XP</em>
              </span>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className={`game-shell ${screen === 'battle' && baseHp === 0 ? 'defeat-state' : ''}`} style={{ '--era': era.accent } as CSSProperties}>
      <div className="time-atmosphere" aria-hidden="true">
        <span className="broken-clock shell-clock-main" />
        <span className="broken-clock shell-clock-small" />
        <span className="broken-clock chaos-clock chaos-clock-left-top" />
        <span className="broken-clock chaos-clock chaos-clock-top" />
        <span className="broken-clock chaos-clock chaos-clock-right" />
        <span className="broken-clock chaos-clock chaos-clock-right-bottom" />
        <span className="broken-clock chaos-clock chaos-clock-bottom" />
        <span className="broken-clock chaos-clock chaos-clock-left" />
        <span className="time-crack shell-crack-a" />
        <span className="time-crack shell-crack-b" />
        <span className="time-shard shell-shard-a" />
        <span className="time-shard shell-shard-b" />
        <span className="time-shard shell-shard-c" />
      </div>
      <div className="game-top">
        <div>
          <p className="hello">Игрок: {playerLabel}</p>
          <p className="era-line">
            {screen === 'battle' ? `${era.name} · ${era.year}` : selectedLevel.title}
          </p>
        </div>
        {screen === 'battle' && (
          <span className="difficulty-badge">Новая линия готова · {selectedDifficultyData.name}</span>
        )}
      </div>

      {screen === 'battle' && baseHp === 0 && (
        <div className="retry-panel">
          <span>HP базы закончилось. Попробуй другую расстановку.</span>
          <button className="secondary" type="button" onClick={restartGame}>
            Попробовать ещё раз
          </button>
        </div>
      )}

      {screen === 'profile' && (
        <section className="profile-screen">
          <span className="broken-clock screen-clock profile-clock" aria-hidden="true" />
          <span className="time-crack screen-crack profile-crack" aria-hidden="true" />
          <div className="screen-heading">
            <h3>Перед началом</h3>
            <p>Введи имя и возраст игрока, чтобы начать защиту линии времени.</p>
          </div>
          {renderRetentionPanel('profile')}
          <form className="player-form" onSubmit={submitPlayerProfile}>
            <label>
              Имя
              <input
                type="text"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Например, Алишер"
                autoComplete="given-name"
                minLength={3}
                maxLength={21}
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

      {screen === 'tutorial' && (
        <section className="tutorial-screen">
          <span className="broken-clock screen-clock tutorial-clock" aria-hidden="true" />
          <span className="time-crack screen-crack tutorial-crack" aria-hidden="true" />
          <div className="screen-heading">
            <h3>Практическое обучение</h3>
            <p>Сейчас мы сразу перейдем на карту битвы: комментатор покажет, какую башню выбрать, куда ее поставить и когда запускать волну.</p>
          </div>
          <div className="tutorial-grid">
            <article className="tutorial-card">
              <span>1</span>
              <strong>Выбери уровень</strong>
              <p>На карте непройденные территории бледные. После победы они получают цвет эпохи.</p>
            </article>
            <article className="tutorial-card">
              <span>2</span>
              <strong>Собери башни</strong>
              <p>Перед боем выбери минимум {Math.min(requiredLoadoutSize, availableTowerKinds.length)} башни.</p>
            </article>
            <article className="tutorial-card">
              <span>3</span>
              <strong>Ставь не на дороге</strong>
              <p>Башни ставятся только на специальные клетки. Дорога нужна врагам для движения.</p>
            </article>
            <article className="tutorial-card">
              <span>4</span>
              <strong>Улучшай защиту</strong>
              <p>Выбирай башню на поле, улучшай её и меняй приоритет цели.</p>
            </article>
          </div>
          <div className="tutorial-actions">
            <button type="button" onClick={startPracticeTutorial}>
              Начать практику
            </button>
            <button className="secondary" type="button" onClick={() => closeTutorial('start')}>
              Пропустить
            </button>
          </div>
        </section>
      )}

      {screen === 'start' && (
        <section className="menu-screen">
          <span className="broken-clock screen-clock menu-clock" aria-hidden="true" />
          <span className="time-crack screen-crack menu-crack" aria-hidden="true" />
          <div>
            <h3>Начальный экран</h3>
            <p>Выбери старт, чтобы перейти к карте уровней. Настройки камеры уже доступны в бою: мышь крутит карту, колесико меняет масштаб.</p>
            <div className="name-editor">
              {!isEditingName ? (
                <button className="secondary" type="button" onClick={openNameEditor}>
                  Изменить имя
                </button>
              ) : (
                <form onSubmit={submitNameChange}>
                  <input
                    type="text"
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                    placeholder="Имя игрока"
                    autoComplete="given-name"
                    minLength={3}
                    maxLength={21}
                  />
                  <button type="submit">Сохранить</button>
                  <button className="ghost" type="button" onClick={() => {
                    setIsEditingName(false);
                    setProfileError('');
                  }}>
                    Отмена
                  </button>
                </form>
              )}
              {profileError && <p className="form-error">{profileError}</p>}
            </div>
            {renderRetentionPanel('main')}
          </div>
          <div className="menu-actions">
            <button type="button" onClick={() => {
              activateAudio();
              setScreen('levels');
            }}>
              Начать
            </button>
            <button className="secondary" type="button" onClick={() => setScreen('achievements')}>
              Достижения {completedAchievements}/{achievements.length}
            </button>
            <button className="secondary" type="button" onClick={() => {
              activateAudio();
              setScreen('difficulty');
            }}>
              Настройки
            </button>
            <button className="secondary" type="button" onClick={() => setScreen('tutorial')}>
              Туториал
            </button>
          </div>
        </section>
      )}

      {screen === 'achievements' && (
        <section className="achievement-screen">
          <span className="broken-clock screen-clock achievement-clock" aria-hidden="true" />
          <span className="time-shard achievement-shard" aria-hidden="true" />
          <div className="screen-heading">
            <h3>Достижения</h3>
            <p>Выполняй цели во время защиты портала. Прогресс сохраняется на этом компьютере.</p>
          </div>
          <div className="achievement-summary">
            <strong>{completedAchievements}/{achievements.length}</strong>
            <span>получено</span>
          </div>
          <div className="achievement-list">
            {achievements.map((achievement) => {
              const progress = getAchievementProgress(achievement, achievementStats, completedLevelIds.length);
              const isUnlocked = progress >= achievement.goal;
              const progressPercent = Math.round((progress / achievement.goal) * 100);
              const isHardtry = achievement.id.startsWith('hardtry-');

              return (
                <article
                  className={[
                    'achievement-card',
                    isUnlocked ? 'unlocked' : '',
                    isHardtry ? 'hardtry' : '',
                  ].join(' ')}
                  key={achievement.id}
                >
                  <div className="achievement-icon" aria-hidden="true">
                    {isUnlocked ? '✓' : '•'}
                  </div>
                  <div>
                    <strong>{achievement.title}</strong>
                    <p>{achievement.description}</p>
                    <div className="achievement-progress" aria-label={`Прогресс ${progress} из ${achievement.goal}`}>
                      <span style={{ width: `${progressPercent}%` }} />
                    </div>
                    <small>
                      {progress}/{achievement.goal} · {isUnlocked ? 'получено' : 'в процессе'}
                    </small>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="menu-actions">
            <button className="ghost" type="button" onClick={() => setScreen('start')}>
              Назад
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
              <div
                className={[
                  'level-map',
                  ...completedLevelIds.map((levelId) => `completed-level-${levelId}`),
                ].join(' ')}
                aria-label="Карта уровней 30 на 30"
              >
                <span className="map-orbit orbit-a" aria-hidden="true" />
                <span className="map-orbit orbit-b" aria-hidden="true" />
                <span className="map-route route-stone" aria-hidden="true" />
                <span className="map-route route-ancient" aria-hidden="true" />
                <span className="map-route route-medieval" aria-hidden="true" />
                <span className="map-route route-industrial" aria-hidden="true" />
                <span className="map-route route-future" aria-hidden="true" />
                <span className="map-route route-cyber" aria-hidden="true" />
                <span className="map-rift" aria-hidden="true">Разлом времени</span>
                {levelMap.map((level) => {
                  const position = levelMapPositions[level.id];
                  const isCompleted = completedLevelIds.includes(level.id);
                  const battleMap = battleMaps.find((mapLayout) => mapLayout.id === level.id) ?? battleMaps[0];

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
                      <em>{battleMap.name}: {battleMap.description}</em>
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
        <button
          className="wave-action era-wave-action"
          type="button"
          onClick={isWaveRunning ? skipWave : startWave}
          disabled={isWaveRunning ? !canSkipWave : baseHp === 0 || isVictory}
        >
          {isVictory
            ? 'Победа'
            : isWaveRunning
              ? skipSecondsLeft > 0
                ? `Скип ${skipSecondsLeft}с`
                : 'Скип'
              : 'Запустить'}
        </button>
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
            <span className={`difficulty-boss-portrait ${bossProfiles[mode.id].portraitClass}`}>
              <img src={bossProfiles[mode.id].sprite} alt="" draggable={false} />
            </span>
            <strong>{mode.name}</strong>
            <span>{mode.description}</span>
            <small>
              {bossProfiles[mode.id].name} · {mode.startCoins} монет · {mode.startBaseHp} HP базы
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
              Выбери минимум {Math.min(requiredLoadoutSize, availableTowerKinds.length)} башни для уровня {selectedLevel.title}. После этого откроется поле битвы.
            </p>
          </div>

          <div className="loadout-layout">
            <div className="loadout-bestiary" aria-label="Бестиарий времени">
              <div className="loadout-panel-heading">
                <strong>Бестиарий</strong>
                <span>{equippedTowerIds.length}/{Math.min(requiredLoadoutSize, availableTowerKinds.length)} выбрано</span>
              </div>
              <div className="bestiary-list loadout-bestiary-list">
                {availableTowerKinds.map((tower) => (
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
      {practiceTutorialActive && (
        <div className="practice-tutorial-panel">
          <strong>Обучение в бою</strong>
          <span>
            {tutorialStep === 'selectTower' && 'Шаг 1: выбери башню слева.'}
            {tutorialStep === 'placeTower' && 'Шаг 2: поставь башню на подсвеченную платформу.'}
            {tutorialStep === 'startWave' && 'Шаг 3: запусти первую волну.'}
            {tutorialStep === 'watchWave' && 'Шаг 4: наблюдай за дорогой, радиусом и наградами.'}
            {tutorialStep === 'complete' && 'Готово: теперь можно играть самостоятельно.'}
          </span>
          <button className="ghost" type="button" onClick={() => closeTutorial('start')}>
            Завершить
          </button>
        </div>
      )}
      <div className="battle-layout">
        <div className="battle-side-panel">
          <div className="battle-control-panel">
            <div className="stats">
              <span>Волна {wave}/{maxWaves}</span>
              <span>{waveTimeLeft} сек</span>
              <span>{coins} монет</span>
              <span>{baseHp} HP базы</span>
            </div>
          </div>

          <div className="battle-tower-picker">
            <div className="tower-bar" aria-label="6 слотов башен">
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
                        {tower ? `${tower.cost} монет · ${getPlacementLabel(tower)}` : 'Добавь из бестиария'}
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
              disabled={selectedPlacedTower.level >= maxTowerLevel}
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
        className={`board board-${era.ground}`}
        style={
          {
            '--board-tilt': `${boardTilt}deg`,
            '--board-turn': `${boardTurn}deg`,
            '--board-tilt-inverse': `${-boardTilt}deg`,
            '--board-turn-inverse': `${-boardTurn}deg`,
            '--board-zoom': boardZoom,
          } as CSSProperties
        }
        onPointerDownCapture={startCameraDrag}
        onPointerMove={moveCamera}
        onPointerUp={stopCameraDrag}
        onPointerCancel={stopCameraDrag}
        onPointerLeave={stopCameraDrag}
        aria-label="Поле tower defence"
      >
        <span className="board-clock-ruin" aria-hidden="true" />
        <span className="board-clock-hand hand-a" aria-hidden="true" />
        <span className="board-clock-hand hand-b" aria-hidden="true" />
        {selectedBattleMap.decorations.map((decoration, index) => (
          <span
            key={`${decoration.kind}-${index}`}
            className={`battle-decoration ${decoration.kind}`}
            style={{
              gridColumn: `${decoration.x} / span ${decoration.spanX ?? 1}`,
              gridRow: `${decoration.y} / span ${decoration.spanY ?? 1}`,
            }}
            aria-hidden="true"
          />
        ))}
        {Array.from({ length: boardSize * boardSize }, (_, cell) => {
          const tower = towers.find((item) => item.cell === cell);
          const towerKind = getTowerKind(tower?.kind ?? selectedTower);
          const towerStats = tower ? getTowerStats(tower) : null;
          const cellEnemies = enemiesByCell.get(cell) ?? [];
          const hitTower = towers.find((item) => item.lastTargetCell === cell && item.attackCount > 0);
          const isPath = selectedBattleMap.pathCells.includes(cell);
          const canBuild = isBuildableCell(cell, selectedBattleMap.buildCells);
          const isHighland = selectedBattleMap.highlandCells.includes(cell);
          const isSelectedTower = tower?.id === selectedTowerId;
          const isTutorialTarget =
            practiceTutorialActive &&
            (tutorialStep === 'placeTower' || tutorialStep === 'selectTower') &&
            cell === tutorialBuildCell &&
            !tower;

          return (
            <button
              key={cell}
              className={[
                'tile',
                isPath ? 'path' : '',
                canBuild ? 'build' : '',
                isHighland ? 'highland' : '',
                getTileDetailClass(cell, selectedBattleMap),
                tower ? 'has-tower' : '',
                isSelectedTower ? 'selected-tower' : '',
                isTutorialTarget ? 'tutorial-target' : '',
              ].join(' ')}
              type="button"
              onClick={() => handleCellClick(cell)}
              disabled={!canBuild && !tower}
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
                    enemy.speedBoostUntil > Date.now() ? 'boosted' : '',
                    isEnemyInvulnerable(enemy, Date.now()) ? 'invulnerable' : '',
                    enemy.lastHitAt > 0 ? 'hit' : '',
                    enemy.lastHitKind ? `hit-${enemy.lastHitKind}` : '',
                  ].join(' ')}
                  key={`${enemy.id}-${enemy.lastHitAt}`}
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <span className="time-ring" />
                  <span className="time-ring late" />
                  <span className="enemy-core">
                    {enemy.isBoss ? (
                      <span
                        className={`boss-portrait ${selectedBossProfile.portraitClass}`}
                        aria-hidden="true"
                      >
                        <img src={selectedBossProfile.sprite} alt="" draggable={false} />
                      </span>
                    ) : enemy.monsterId ? (
                      <MonsterIcon id={enemy.monsterId} />
                    ) : (
                      era.enemy
                    )}
                  </span>
                  {enemy.lastDamage > 0 && <span className="damage-pop">-{enemy.lastDamage}</span>}
                  <span className="enemy-tooltip">
                    {enemy.isBoss ? `${selectedBossProfile.name} · ` : ''}
                    {enemy.monsterId ? `${getEasyMonsterName(enemy.monsterId)} · ` : ''}
                    HP {Math.max(0, Math.ceil(enemy.hp))}/{enemy.maxHp}
                    {enemy.monsterId ? ` · скорость ${getEnemyKind(enemy.monsterId).speed} · ${getEnemyKind(enemy.monsterId).ability}` : ' · скорость 3 · оглушает башни, ускоряет врагов, разгоняется при 25% HP'}
                  </span>
                  <i className="enemy-health" style={{ width: `${Math.max(8, (enemy.hp / enemy.maxHp) * 100)}%` }} />
                </span>
              ))}
            </button>
          );
        })}
      </div>
      </div>

      <p className="message">{message}</p>
      {commentatorMessage && <p className="ai-commentary">{commentatorMessage}</p>}
      {baseHp === 0 && (
        <div className="defeat-overlay" role="dialog" aria-modal="true" aria-labelledby="defeat-title">
          <span className="defeat-rift rift-left" aria-hidden="true" />
          <span className="defeat-rift rift-right" aria-hidden="true" />
          <span className="broken-clock defeat-clock defeat-clock-a defeat-clock-fast" aria-hidden="true" />
          <span className="broken-clock defeat-clock defeat-clock-b defeat-clock-back" aria-hidden="true" />
          <span className="broken-clock defeat-clock defeat-clock-c defeat-clock-slow" aria-hidden="true" />
          <span className="broken-clock defeat-clock defeat-clock-d defeat-clock-back" aria-hidden="true" />
          <span className="broken-clock defeat-clock defeat-clock-e defeat-clock-fast" aria-hidden="true" />
          <div className="defeat-modal">
            <span className="stopped-clock-frame" aria-hidden="true">
              <span className="clock-era-layer clock-era-sun" />
              <span className="clock-era-layer clock-era-atom" />
              <span className="clock-number clock-number-12" data-roman="XII">12</span>
              <span className="clock-number clock-number-1" data-roman="I">1</span>
              <span className="clock-number clock-number-2" data-roman="II">2</span>
              <span className="clock-number clock-number-3" data-roman="III">3</span>
              <span className="clock-number clock-number-4" data-roman="IV">4</span>
              <span className="clock-number clock-number-5" data-roman="V">5</span>
              <span className="clock-number clock-number-6" data-roman="VI">6</span>
              <span className="clock-number clock-number-7" data-roman="VII">7</span>
              <span className="clock-number clock-number-8" data-roman="VIII">8</span>
              <span className="clock-number clock-number-9" data-roman="IX">9</span>
              <span className="clock-number clock-number-10" data-roman="X">10</span>
              <span className="clock-number clock-number-11" data-roman="XI">11</span>
            </span>
            <span className="defeat-mark" aria-hidden="true">!</span>
            <h3 id="defeat-title">Поражение</h3>
            <p>Линия времени не выдержала натиск.</p>
            <strong>Время игры: {formatDuration(defeatDurationSeconds)}</strong>
            <div className="defeat-actions">
              <button type="button" onClick={restartGame}>
                Заново
              </button>
              <button className="secondary" type="button" onClick={returnToMainMenu}>
                В главное меню
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </section>
  );
}
