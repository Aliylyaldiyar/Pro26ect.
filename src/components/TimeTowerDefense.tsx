import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, MouseEvent, PointerEvent } from 'react';
import bossChronomancerSprite from '../assets/boss-chronomancer.svg';
import bossEpochLordSprite from '../assets/boss-epoch-lord.svg';
import bossMindRiftSprite from '../assets/boss-mind-rift.svg';
import bossZeroParadoxSprite from '../assets/boss-zero-paradox.svg';
import archivistSpriteSvg from '../assets/archivist.svg?raw';
import chronoBlastSpriteSvg from '../assets/chrono-blast.svg?raw';
import chronoForgeSpriteSvg from '../assets/chrono-forge.svg?raw';
import epochMirrorSpriteSvg from '../assets/epoch-mirror.svg?raw';
import gravityAnchorSpriteSvg from '../assets/gravity-anchor.svg?raw';
import hourglassTowerSpriteSvg from '../assets/hourglass-tower.svg?raw';
import memoryBeaconSpriteSvg from '../assets/memory-beacon.svg?raw';
import paradoxPrismSpriteSvg from '../assets/paradox-prism.svg?raw';
import riftBreakerSpriteSvg from '../assets/rift-breaker.svg?raw';
import secondPulsarSpriteSvg from '../assets/second-pulsar.svg?raw';
import singularityCoreSpriteSvg from '../assets/singularity-core.svg?raw';
import solarObeliskSpriteSvg from '../assets/solar-obelisk.svg?raw';
import temporalSniperSpriteSvg from '../assets/temporal-sniper.svg?raw';
import timeScoutSpriteSvg from '../assets/time-scout.svg?raw';
import { supabase } from '../lib/supabase';
import { ExperienceStats } from './ExperienceStats';
import { LanguageStartScreen } from './LanguageStartScreen';
import type { LanguageCode } from './LanguageStartScreen';
import { WindowTransitionSplash } from './WindowTransitionSplash';
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
    | 'gravity'
    | 'paradox'
    | 'singularity';
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
  maxWaves: number;
};

type BossProfile = {
  name: string;
  sprite: string;
  portraitClass: string;
};

type GameScreen =
  | 'welcome'
  | 'transition'
  | 'profile'
  | 'tutorial'
  | 'start'
  | 'levels'
  | 'epochLevels'
  | 'difficulty'
  | 'loadout'
  | 'achievements'
  | 'settings'
  | 'battle';
type GameMode = 'campaign' | 'timeLoop';
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

type EraMission = {
  id: number;
  title: Record<LanguageCode, string>;
  description: Record<LanguageCode, string>;
  mapHint: Record<LanguageCode, string>;
  startWaveOffset: number;
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
    | 'fossil'
    | 'campfire'
    | 'ancientColumn'
    | 'timeTemple'
    | 'aqueduct'
    | 'obelisk'
    | 'market'
    | 'watchTower'
    | 'castleGate'
    | 'house'
    | 'mountain'
    | 'banner'
    | 'barricade'
    | 'mineCart'
    | 'pipe'
    | 'factoryBlock'
    | 'steamEngine'
    | 'gearworks'
    | 'railSignal'
    | 'foundry'
    | 'drone'
    | 'reactor'
    | 'energyPylon'
    | 'holoGate'
    | 'satellite'
    | 'skyBridge'
    | 'dataCore'
    | 'neonSpire'
    | 'firewall'
    | 'glitchShard';
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
  lightSlowUntil: number;
  stoppedUntil: number;
  gravityUntil: number;
  isBoss: boolean;
  isBossServant: boolean;
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

type GameSound = 'enemySpawn' | 'bossSpawn' | 'arrowHit' | 'slowHit' | 'blastHit' | 'waveStart' | 'buttonHover' | 'buttonClick' | 'screenTransition' | 'menuIdle';

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
  completed_level_ids: number[];
  achievement_stats: AchievementStats;
};

type RetentionLeaderboardEntry = {
  display_name: string;
  xp: number;
  streak_days: number;
  best_wave: number;
  total_kills: number;
};

type PlayerReviewStatus = 'new' | 'read' | 'archived';

type PlayerReview = {
  id: string;
  user_id: string;
  user_email: string;
  display_name: string;
  rating: number;
  message: string;
  status: PlayerReviewStatus;
  created_at: string;
};

type ExperienceFlash = {
  id: number;
  gainedXp: number;
  level: number;
  leveledUp: boolean;
};

type BattleSummary = {
  kills: number;
  bosses: number;
  waves: number;
  xp: number;
};

type SettingsFocus = 'top' | 'reviews';

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
const endlessBossInterval = 5;
const endlessEraShiftSeconds = 8;
const baseWaveDuration = 30;
const skipUnlockDelay = 25;
const requiredLoadoutSize = 0;
const starterTowerSlots: TowerSlot[] = ['arrow', null, null, null, null, null];
const freeTowerIds: TowerKind['id'][] = ['arrow'];
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
      { kind: 'fossil', x: 6, y: 7, spanX: 2, spanY: 1 },
      { kind: 'campfire', x: 3, y: 9, spanX: 1, spanY: 1 },
      { kind: 'rockPile', x: 9, y: 4, spanX: 1, spanY: 1 },
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
      { kind: 'ancientColumn', x: 1, y: 1, spanX: 2, spanY: 3 },
      { kind: 'timeTemple', x: 7, y: 1, spanX: 3, spanY: 3 },
      { kind: 'aqueduct', x: 7, y: 7, spanX: 3, spanY: 2 },
      { kind: 'obelisk', x: 3, y: 6, spanX: 1, spanY: 2 },
      { kind: 'market', x: 1, y: 7, spanX: 2, spanY: 2 },
      { kind: 'ancientColumn', x: 9, y: 5, spanX: 1, spanY: 2 },
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
      { kind: 'castleGate', x: 4, y: 1, spanX: 3, spanY: 3 },
      { kind: 'watchTower', x: 1, y: 1, spanX: 2, spanY: 3 },
      { kind: 'house', x: 1, y: 8, spanX: 2, spanY: 2 },
      { kind: 'mountain', x: 6, y: 1, spanX: 3, spanY: 2 },
      { kind: 'banner', x: 8, y: 6, spanX: 1, spanY: 2 },
      { kind: 'barricade', x: 5, y: 8, spanX: 2, spanY: 1 },
      { kind: 'house', x: 9, y: 4, spanX: 1, spanY: 1 },
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
      { kind: 'steamEngine', x: 2, y: 1, spanX: 2, spanY: 2 },
      { kind: 'gearworks', x: 7, y: 7, spanX: 2, spanY: 2 },
      { kind: 'railSignal', x: 4, y: 9, spanX: 1, spanY: 1 },
      { kind: 'foundry', x: 9, y: 8, spanX: 2, spanY: 2 },
      { kind: 'pipe', x: 1, y: 4, spanX: 1, spanY: 2 },
    ],
  },
  {
    id: 5,
    name: 'Разлом секунд',
    description: 'Дорога пересекает почти всё поле, а сильные позиции стоят далеко друг от друга.',
    pathCells: [10, 11, 12, 22, 32, 33, 34, 35, 25, 15, 16, 17, 27, 37, 47, 57, 56, 55, 65, 75, 76, 77, 87, 97, 98, 99],
    buildCells: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 18, 19, 20, 21, 23, 24, 26, 28, 29, 31, 36, 38, 39, 41, 42, 43, 44, 45, 46, 48, 49, 52, 53, 54, 58, 59, 64, 66, 67, 68, 69, 74, 78, 79, 84, 85, 86, 88, 89, 94, 95, 96],
    highlandCells: [5, 14, 24, 43, 54, 67, 69, 85, 89, 96],
    decorations: [
      { kind: 'drone', x: 9, y: 1, spanX: 2, spanY: 2 },
      { kind: 'reactor', x: 1, y: 8, spanX: 2, spanY: 2 },
      { kind: 'energyPylon', x: 9, y: 5, spanX: 2, spanY: 3 },
      { kind: 'holoGate', x: 1, y: 1, spanX: 2, spanY: 3 },
      { kind: 'satellite', x: 4, y: 1, spanX: 2, spanY: 1 },
      { kind: 'skyBridge', x: 4, y: 8, spanX: 3, spanY: 1 },
      { kind: 'drone', x: 7, y: 4, spanX: 1, spanY: 1 },
    ],
  },
  {
    id: 6,
    name: 'Финальный портал',
    description: 'Самая длинная пробежка: центр силён, но фланги легко проваливаются.',
    pathCells: [5, 15, 25, 24, 23, 22, 32, 42, 52, 53, 54, 55, 56, 46, 36, 37, 38, 48, 58, 68, 67, 66, 76, 86, 96, 97, 98, 99],
    buildCells: [0, 1, 2, 3, 4, 6, 7, 8, 9, 13, 14, 16, 17, 18, 19, 20, 21, 26, 27, 28, 29, 30, 31, 33, 34, 35, 39, 40, 41, 43, 44, 45, 47, 49, 50, 51, 57, 59, 60, 61, 62, 63, 64, 65, 69, 70, 71, 72, 73, 74, 75, 77, 78, 79, 80, 81, 82, 83, 84, 85, 87, 88, 89, 90, 91, 92, 93, 94, 95],
    highlandCells: [4, 14, 18, 34, 45, 57, 64, 72, 77, 82, 95],
    decorations: [
      { kind: 'dataCore', x: 1, y: 8, spanX: 2, spanY: 2 },
      { kind: 'neonSpire', x: 9, y: 1, spanX: 2, spanY: 3 },
      { kind: 'holoGate', x: 1, y: 1, spanX: 2, spanY: 3 },
      { kind: 'energyPylon', x: 9, y: 5, spanX: 2, spanY: 3 },
      { kind: 'firewall', x: 4, y: 7, spanX: 3, spanY: 1 },
      { kind: 'glitchShard', x: 7, y: 2, spanX: 1, spanY: 2 },
      { kind: 'dataCore', x: 4, y: 9, spanX: 1, spanY: 1 },
    ],
  },
];

type BoardTransform = 'identity' | 'mirrorX' | 'mirrorY' | 'rotate180' | 'transpose';

const missionMapTransforms: BoardTransform[] = ['identity', 'mirrorX', 'mirrorY', 'rotate180', 'transpose'];

function transformBoardCell(cell: number, transform: BoardTransform) {
  const x = cell % boardSize;
  const y = Math.floor(cell / boardSize);

  if (transform === 'mirrorX') return y * boardSize + (boardSize - 1 - x);
  if (transform === 'mirrorY') return (boardSize - 1 - y) * boardSize + x;
  if (transform === 'rotate180') return (boardSize - 1 - y) * boardSize + (boardSize - 1 - x);
  if (transform === 'transpose') return x * boardSize + y;

  return cell;
}

function transformBattleDecoration(decoration: BattleDecoration, transform: BoardTransform): BattleDecoration {
  const spanX = decoration.spanX ?? 1;
  const spanY = decoration.spanY ?? 1;

  if (transform === 'mirrorX') {
    return { ...decoration, x: boardSize - decoration.x - spanX + 2 };
  }

  if (transform === 'mirrorY') {
    return { ...decoration, y: boardSize - decoration.y - spanY + 2 };
  }

  if (transform === 'rotate180') {
    return {
      ...decoration,
      x: boardSize - decoration.x - spanX + 2,
      y: boardSize - decoration.y - spanY + 2,
    };
  }

  if (transform === 'transpose') {
    return {
      ...decoration,
      x: decoration.y,
      y: decoration.x,
      spanX: spanY,
      spanY: spanX,
    };
  }

  return decoration;
}

function transformCellList(cells: number[], transform: BoardTransform) {
  return [...new Set(cells.map((cell) => transformBoardCell(cell, transform)))];
}

function getMissionBattleMap(level: LevelMapItem, mission: EraMission, language: LanguageCode): BattleMapLayout {
  const baseMap = battleMaps.find((battleMap) => battleMap.id === level.id) ?? battleMaps[0];
  const transform = missionMapTransforms[mission.id - 1] ?? 'identity';

  return {
    id: level.id * 10 + mission.id,
    name: mission.title[language],
    description: mission.description[language],
    pathCells: transformCellList(baseMap.pathCells, transform),
    buildCells: transformCellList(baseMap.buildCells, transform),
    highlandCells: transformCellList(baseMap.highlandCells, transform),
    decorations: baseMap.decorations.map((decoration) => transformBattleDecoration(decoration, transform)),
  };
}

const levelMap: LevelMapItem[] = [
  { id: 1, title: 'Искра времени', mapTitle: 'Каменный век', mapArea: 'stone', chapter: 'Обучение', startWave: 1, description: 'Первые башни и спокойные враги.' },
  { id: 2, title: 'Каменная тропа', mapTitle: 'Античность', mapArea: 'ancient', chapter: 'Обучение', startWave: 4, description: 'Дорога становится длиннее и опаснее.' },
  { id: 3, title: 'Ворота замка', mapTitle: 'Средневековье', mapArea: 'medieval', chapter: 'Средние уровни', startWave: 8, description: 'Появляются более крепкие волны.' },
  { id: 4, title: 'Паровой район', mapTitle: 'Индустриальная эпоха', mapArea: 'industrial', chapter: 'Средние уровни', startWave: 12, description: 'Нужно точнее выбирать башни.' },
  { id: 5, title: 'Разлом секунд', mapTitle: 'Будущее', mapArea: 'future', chapter: 'Сложные уровни', startWave: 18, description: 'Волны становятся плотнее и давят сильнее.' },
  { id: 6, title: 'Финальный портал', mapTitle: 'Киберпанк', mapArea: 'cyber', chapter: 'Сложные уровни', startWave: 26, description: 'Проверка всей защиты линии времени.' },
];

const eraMissionCatalog: Record<LevelMapItem['mapArea'], EraMission[]> = {
  stone: [
    { id: 1, title: { ru: 'Охотничья тропа', en: 'Hunter Trail', kk: 'Аңшы жолы' }, description: { ru: 'Одна спокойная дорога для первых башен.', en: 'One calm road for the first towers.', kk: 'Алғашқы мұнараларға арналған тыныш жол.' }, mapHint: { ru: 'Извилистая тропа', en: 'Curved trail', kk: 'Ирек жол' }, startWaveOffset: 0 },
    { id: 2, title: { ru: 'Мамонтовый круг', en: 'Mammoth Circle', kk: 'Мамонт шеңбері' }, description: { ru: 'Дорога делает петлю вокруг центра.', en: 'The road loops around the center.', kk: 'Жол орталықты айналып өтеді.' }, mapHint: { ru: 'Круговая охота', en: 'Circular hunt', kk: 'Шеңберлі аңшылық' }, startWaveOffset: 2 },
    { id: 3, title: { ru: 'Ледяной овраг', en: 'Frozen Ravine', kk: 'Мұзды сай' }, description: { ru: 'Узкие проходы заставляют ставить башни точнее.', en: 'Narrow paths require cleaner tower placement.', kk: 'Тар өткелдер мұнараны дәл қоюды талап етеді.' }, mapHint: { ru: 'Два узких прохода', en: 'Two narrow lanes', kk: 'Екі тар жол' }, startWaveOffset: 4 },
    { id: 4, title: { ru: 'Пещерный проход', en: 'Cave Passage', kk: 'Үңгір өткелі' }, description: { ru: 'Короткая карта с быстрым давлением.', en: 'A short map with fast pressure.', kk: 'Қысқа карта, қысым тез өседі.' }, mapHint: { ru: 'Короткий маршрут', en: 'Short route', kk: 'Қысқа бағыт' }, startWaveOffset: 6 },
    { id: 5, title: { ru: 'Стоянка шамана', en: 'Shaman Camp', kk: 'Бақсы тұрағы' }, description: { ru: 'Финальный разлом эпохи с плотными волнами.', en: 'The era rift closes with dense waves.', kk: 'Дәуір жарылысы тығыз толқынмен жабылады.' }, mapHint: { ru: 'Разлом в центре', en: 'Central rift', kk: 'Орталық жарық' }, startWaveOffset: 8 },
  ],
  ancient: [
    { id: 1, title: { ru: 'Дорога колонн', en: 'Column Road', kk: 'Бағандар жолы' }, description: { ru: 'Прямая дорога и понятные позиции.', en: 'A straight road with clear positions.', kk: 'Түзу жол және түсінікті орындар.' }, mapHint: { ru: 'Прямая линия', en: 'Straight line', kk: 'Түзу сызық' }, startWaveOffset: 0 },
    { id: 2, title: { ru: 'Амфитеатр', en: 'Amphitheater', kk: 'Амфитеатр' }, description: { ru: 'Враги идут по широкой дуге.', en: 'Enemies travel along a wide arc.', kk: 'Жаулар кең доғамен жүреді.' }, mapHint: { ru: 'Дуга вокруг центра', en: 'Arc around center', kk: 'Орталық доғасы' }, startWaveOffset: 2 },
    { id: 3, title: { ru: 'Акведук', en: 'Aqueduct', kk: 'Акведук' }, description: { ru: 'Две линии рядом с сильным центром.', en: 'Two lanes near a powerful center.', kk: 'Күшті орталық жанында екі жол.' }, mapHint: { ru: 'Параллельные дороги', en: 'Parallel roads', kk: 'Қатар жолдар' }, startWaveOffset: 4 },
    { id: 4, title: { ru: 'Храм времени', en: 'Time Temple', kk: 'Уақыт храмы' }, description: { ru: 'Много платформ, но не все удобные.', en: 'Many platforms, not all of them comfortable.', kk: 'Платформа көп, бірақ бәрі ыңғайлы емес.' }, mapHint: { ru: 'Редкие сильные точки', en: 'Rare strong points', kk: 'Сирек күшті орындар' }, startWaveOffset: 6 },
    { id: 5, title: { ru: 'Площадь императора', en: 'Emperor Square', kk: 'Император алаңы' }, description: { ru: 'Широкая дорога и сильный босс эпохи.', en: 'A wide road and a strong era boss.', kk: 'Кең жол және күшті дәуір боссы.' }, mapHint: { ru: 'Широкий маршрут', en: 'Wide route', kk: 'Кең бағыт' }, startWaveOffset: 8 },
  ],
  medieval: [
    { id: 1, title: { ru: 'Замковые ворота', en: 'Castle Gate', kk: 'Қамал қақпасы' }, description: { ru: 'Оборона одного моста к базе.', en: 'Defend one bridge to the base.', kk: 'Базаға апаратын бір көпірді қорға.' }, mapHint: { ru: 'Мост к базе', en: 'Bridge to base', kk: 'База көпірі' }, startWaveOffset: 0 },
    { id: 2, title: { ru: 'Ров и башни', en: 'Moat Towers', kk: 'Ор мен мұнаралар' }, description: { ru: 'S-маршрут помогает замедляющим башням.', en: 'An S-route rewards slowing towers.', kk: 'S-жол баяулатқыш мұнараларға пайдалы.' }, mapHint: { ru: 'S-образная дорога', en: 'S-shaped road', kk: 'S тәрізді жол' }, startWaveOffset: 2 },
    { id: 3, title: { ru: 'Лесная засада', en: 'Forest Ambush', kk: 'Орман тосқауылы' }, description: { ru: 'Повороты дают шанс правильно расставиться.', en: 'Turns give room for smart placement.', kk: 'Бұрылыстар дұрыс қоюға мүмкіндік береді.' }, mapHint: { ru: 'Много поворотов', en: 'Many turns', kk: 'Көп бұрылыс' }, startWaveOffset: 4 },
    { id: 4, title: { ru: 'Осада крепости', en: 'Fortress Siege', kk: 'Қамал қоршауы' }, description: { ru: 'Давление приходит с двух сторон.', en: 'Pressure comes from two sides.', kk: 'Қысым екі жақтан келеді.' }, mapHint: { ru: 'Два входа', en: 'Two entrances', kk: 'Екі кіріс' }, startWaveOffset: 6 },
    { id: 5, title: { ru: 'Тронный двор', en: 'Throne Yard', kk: 'Тақ ауласы' }, description: { ru: 'Плотные группы проверяют урон по площади.', en: 'Dense groups test area damage.', kk: 'Тығыз топтар аймақтық зиянды тексереді.' }, mapHint: { ru: 'Плотные волны', en: 'Dense waves', kk: 'Тығыз толқындар' }, startWaveOffset: 8 },
  ],
  industrial: [
    { id: 1, title: { ru: 'Паровой завод', en: 'Steam Factory', kk: 'Бу зауыты' }, description: { ru: 'Длинный маршрут даёт время на разгон.', en: 'A long route gives time to scale.', kk: 'Ұзын бағыт дайындалуға уақыт береді.' }, mapHint: { ru: 'Длинная дорога', en: 'Long road', kk: 'Ұзын жол' }, startWaveOffset: 0 },
    { id: 2, title: { ru: 'Железная станция', en: 'Iron Station', kk: 'Темір станция' }, description: { ru: 'Две дороги пересекаются возле центра.', en: 'Two roads cross near the center.', kk: 'Екі жол орталықта қиылысады.' }, mapHint: { ru: 'Пересечение', en: 'Crossing', kk: 'Қиылыс' }, startWaveOffset: 2 },
    { id: 3, title: { ru: 'Дымный квартал', en: 'Smoke District', kk: 'Түтін ауданы' }, description: { ru: 'Платформы стоят островками.', en: 'Platforms are placed as islands.', kk: 'Платформалар арал сияқты орналасқан.' }, mapHint: { ru: 'Островки платформ', en: 'Platform islands', kk: 'Платформа аралдары' }, startWaveOffset: 4 },
    { id: 4, title: { ru: 'Конвейер времени', en: 'Time Conveyor', kk: 'Уақыт конвейері' }, description: { ru: 'Короткие волны идут быстрее обычного.', en: 'Short waves move faster than usual.', kk: 'Қысқа толқындар тезірек жүреді.' }, mapHint: { ru: 'Быстрый темп', en: 'Fast tempo', kk: 'Жылдам қарқын' }, startWaveOffset: 6 },
    { id: 5, title: { ru: 'Механическое сердце', en: 'Mechanical Heart', kk: 'Механикалық жүрек' }, description: { ru: 'Финальная проверка экономики и урона.', en: 'A final test of economy and damage.', kk: 'Экономика мен зиянның соңғы сынағы.' }, mapHint: { ru: 'Сильный темп', en: 'High pressure', kk: 'Күшті қысым' }, startWaveOffset: 8 },
  ],
  future: [
    { id: 1, title: { ru: 'Орбитальный мост', en: 'Orbital Bridge', kk: 'Орбиталық көпір' }, description: { ru: 'Дорога идёт по краям поля.', en: 'The road runs along the edges.', kk: 'Жол алаң шетімен өтеді.' }, mapHint: { ru: 'Краевой маршрут', en: 'Edge route', kk: 'Шеткі бағыт' }, startWaveOffset: 0 },
    { id: 2, title: { ru: 'Неоновый купол', en: 'Neon Dome', kk: 'Неон күмбезі' }, description: { ru: 'Центральные платформы решают бой.', en: 'Central platforms decide the fight.', kk: 'Орталық платформалар шайқасты шешеді.' }, mapHint: { ru: 'Центральная зона', en: 'Central zone', kk: 'Орталық аймақ' }, startWaveOffset: 2 },
    { id: 3, title: { ru: 'Лаборатория скачков', en: 'Jump Lab', kk: 'Секіру зертханасы' }, description: { ru: 'Два входа требуют гибкой защиты.', en: 'Two entrances demand flexible defense.', kk: 'Екі кіріс икемді қорғаныс сұрайды.' }, mapHint: { ru: 'Два входа', en: 'Two entrances', kk: 'Екі кіріс' }, startWaveOffset: 4 },
    { id: 4, title: { ru: 'Квантовый тоннель', en: 'Quantum Tunnel', kk: 'Квант туннелі' }, description: { ru: 'Короткий опасный участок нельзя пропустить.', en: 'A short danger section cannot be ignored.', kk: 'Қысқа қауіпті бөлікті өткізуге болмайды.' }, mapHint: { ru: 'Короткий тоннель', en: 'Short tunnel', kk: 'Қысқа туннель' }, startWaveOffset: 6 },
    { id: 5, title: { ru: 'Ядро сингулярности', en: 'Singularity Core', kk: 'Сингулярлық ядро' }, description: { ru: 'Быстрые враги проверяют реакцию.', en: 'Fast enemies test reaction.', kk: 'Жылдам жаулар реакцияны тексереді.' }, mapHint: { ru: 'Быстрые враги', en: 'Fast enemies', kk: 'Жылдам жаулар' }, startWaveOffset: 8 },
  ],
  cyber: [
    { id: 1, title: { ru: 'Улица голограмм', en: 'Hologram Street', kk: 'Голограмма көшесі' }, description: { ru: 'Городская дорога с множеством поворотов.', en: 'A city road with many turns.', kk: 'Көп бұрылысты қала жолы.' }, mapHint: { ru: 'Городской зигзаг', en: 'City zigzag', kk: 'Қала ирегі' }, startWaveOffset: 0 },
    { id: 2, title: { ru: 'Серверный район', en: 'Server District', kk: 'Сервер ауданы' }, description: { ru: 'Много маленьких, но спорных позиций.', en: 'Many small but tricky positions.', kk: 'Көп шағын, бірақ күрделі орындар.' }, mapHint: { ru: 'Малые платформы', en: 'Small platforms', kk: 'Шағын платформалар' }, startWaveOffset: 2 },
    { id: 3, title: { ru: 'Дата-мост', en: 'Data Bridge', kk: 'Дата көпірі' }, description: { ru: 'Симметричные дороги нужно держать вместе.', en: 'Symmetric roads must be held together.', kk: 'Симметриялық жолдарды бірге ұстау керек.' }, mapHint: { ru: 'Симметрия', en: 'Symmetry', kk: 'Симметрия' }, startWaveOffset: 4 },
    { id: 4, title: { ru: 'Черный рынок времени', en: 'Time Black Market', kk: 'Уақыт қара базары' }, description: { ru: 'Скорость волн постоянно меняется.', en: 'Wave speed keeps changing.', kk: 'Толқын жылдамдығы өзгеріп тұрады.' }, mapHint: { ru: 'Разный темп', en: 'Mixed tempo', kk: 'Әр түрлі қарқын' }, startWaveOffset: 6 },
    { id: 5, title: { ru: 'Финальный портал', en: 'Final Portal', kk: 'Соңғы портал' }, description: { ru: 'Максимальная проверка всей защиты.', en: 'The maximum test of the whole defense.', kk: 'Бүкіл қорғаныстың ең үлкен сынағы.' }, mapHint: { ru: 'Несколько входов', en: 'Several entrances', kk: 'Бірнеше кіріс' }, startWaveOffset: 8 },
  ],
};

const totalEraMissionCount = Object.values(eraMissionCatalog).reduce((total, missions) => total + missions.length, 0);

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
const playerNameStorageKey = 'chrono-defense-player-name';
const languageStorageKey = 'chrono-defense-language';
const soundEnabledStorageKey = 'chrono-defense-sound-enabled';
const musicEnabledStorageKey = 'chrono-defense-music-enabled';
const performanceModeStorageKey = 'chrono-defense-performance-mode';
const tutorialBuildCell = 44;
const movementThreshold = 8;
const bossEnemyKindId: EasyMonsterId = 'tickingScarab';
const baseLevelXp = 120;
const adminReviewEmails = ['aliyyaldiyar@gmail.com'];
const finalReleaseVersion = 'v1.0 Final';

const languageOptions: Array<{ code: LanguageCode; label: string }> = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
  { code: 'kk', label: 'KZ' },
];

const uiText = {
  ru: {
    player: 'Игрок',
    guest: 'Гость',
    startTitle: 'Начальный экран',
    startSubtitle: 'Выбери старт, чтобы перейти к карте уровней. Настройки камеры уже доступны в бою: мышь крутит карту, колесико меняет масштаб.',
    start: 'Начать',
    achievements: 'Достижения',
    settings: 'Настройки',
    tutorial: 'Туториал',
    editName: 'Изменить имя',
    playerName: 'Имя игрока',
    save: 'Сохранить',
    cancel: 'Отмена',
    settingsSubtitle: 'Здесь можно поменять язык, вернуть камеру к стандартному виду или открыть обучение.',
    language: 'Язык',
    cameraZoom: 'масштаб камеры',
    resetCamera: 'Сбросить камеру',
    cameraReset: 'Камера возвращена к стандартному виду.',
    back: 'Назад',
    levelMap: 'Карта уровней',
    levelMapSubtitle: 'Игрок проходит уровни по порядку, но сейчас можно выбрать любой уровень для теста.',
    opened: 'Открыто',
    notCompleted: 'Не пройдено',
    legend: 'Легенда',
    enemyRoad: 'Дорога врагов',
    towerPlatform: 'Платформа для башни',
    timeDistortion: 'Искажение времени',
    timeRift: 'Разлом времени',
    playerBase: 'База игрока',
    difficulty: 'Выбор сложности',
    difficultySubtitle: '{level}: старт с волны {wave}. После выбора сложности откроется карта битвы.',
    coins: 'монет',
    baseHp: 'HP базы',
    backToLevels: 'Назад к уровням',
    loadout: 'Собери Бестиарий',
    loadoutSubtitle: 'Выбери башни для уровня {level} или сразу начни бой даже без них.',
    bestiary: 'Бестиарий',
    selected: 'выбрано',
    battleSet: 'Набор на бой',
    ready: 'готов',
    towersNeeded: 'можно в бой',
    empty: 'Пусто',
    addFromBestiary: 'Добавь из Бестиария',
    backToDifficulty: 'Назад к сложности',
    toBattle: 'В бой',
    defenderProgress: 'Прогресс защитника',
    savedOnline: 'сохраняется в Supabase',
    signInToSave: 'войдите, чтобы сохранять онлайн',
    dayStreakShort: 'дн. серия',
    level: 'Уровень',
    bestWave: 'Лучшая волна',
    wins: 'побед',
    streak: 'Серия',
    daysInRow: 'дней подряд',
    xpToNext: 'До уровня {level}: {xp} XP',
    daily: 'Ежедневное',
    weekly: 'Еженедельное',
    month: 'Месяц',
    reward: 'Награда',
    done: 'готово',
    leaders: 'Лидеры',
    dailyKillsTitle: 'Охота дня',
    dailyKillsDescription: 'Победи {count} мобов сегодня.',
    dailyWavesTitle: 'Три удара времени',
    dailyWavesDescription: 'Отбей {count} волн сегодня.',
    weeklyWavesTitle: 'Недельный гарнизон',
    weeklyWavesDescription: 'Отбей {count} волны за неделю.',
    weeklyKillsTitle: 'Операция разлом',
    weeklyKillsDescription: 'Победи {count} мобов за неделю.',
    monthlyTitle: 'Супер-пупер марафон времени',
    monthlyDescription: 'За месяц победи {count} мобов и докажи, что портал под контролем.',
    profileTitle: 'Перед началом',
    profileSubtitle: 'Введи имя и возраст игрока, чтобы начать защиту линии времени.',
    name: 'Имя',
    namePlaceholder: 'Например, Алишер',
    age: 'Возраст',
    tutorialTitle: 'Практическое обучение',
    tutorialSubtitle: 'Сейчас мы сразу перейдем на карту битвы: комментатор покажет, какую башню выбрать, куда ее поставить и когда запускать волну.',
    tutorialStepOneTitle: 'Выбери уровень',
    tutorialStepOneText: 'На карте непройденные территории бледные. После победы они получают цвет эпохи.',
    tutorialStepTwoTitle: 'Собери башни',
    tutorialStepTwoText: 'Перед боем можно выбрать башни, но старт доступен даже с пустым набором.',
    tutorialStepThreeTitle: 'Ставь не на дороге',
    tutorialStepThreeText: 'Башни ставятся только на специальные клетки. Дорога нужна врагам для движения.',
    tutorialStepFourTitle: 'Улучшай защиту',
    tutorialStepFourText: 'Выбирай башню на поле, улучшай ее и меняй приоритет цели.',
    startPractice: 'Начать практику',
    skip: 'Пропустить',
    achievementsTitle: 'Достижения',
    achievementsSubtitle: 'Выполняй цели во время защиты портала. Прогресс сохраняется на этом компьютере.',
    earned: 'получено',
    inProgress: 'в процессе',
    progress: 'Прогресс',
    battleTutorial: 'Обучение в бою',
    tutorialSelectTower: 'Шаг 1: выбери башню слева.',
    tutorialPlaceTower: 'Шаг 2: поставь башню на подсвеченную платформу.',
    tutorialStartWave: 'Шаг 3: запусти первую волну.',
    tutorialWatchWave: 'Шаг 4: наблюдай за дорогой, радиусом и наградами.',
    tutorialComplete: 'Готово: теперь можно играть самостоятельно.',
    finish: 'Завершить',
    wave: 'Волна',
    seconds: 'сек',
    defeat: 'Поражение',
    defeatSubtitle: 'Линия времени не выдержала натиск.',
    gameTime: 'Время игры',
    restart: 'Заново',
    mainMenu: 'В главное меню',
    victory: 'Победа',
    victoryMessage: 'Все волны пройдены. Портал времени стабилен.',
    bossWaveHint: 'Следующая волна с боссом.',
    waveSkip: 'Скип',
    launch: 'Запустить',
    baseHpEnded: 'HP базы закончилось. Попробуй другую расстановку.',
    retry: 'Попробовать еще раз',
  },
  en: {
    player: 'Player',
    guest: 'Guest',
    startTitle: 'Main Menu',
    startSubtitle: 'Choose start to open the level map. Camera controls are available in battle: drag to rotate, mouse wheel to zoom.',
    start: 'Start',
    achievements: 'Achievements',
    settings: 'Settings',
    tutorial: 'Tutorial',
    editName: 'Edit name',
    playerName: 'Player name',
    save: 'Save',
    cancel: 'Cancel',
    settingsSubtitle: 'Here you can change language, reset the camera, or open the tutorial.',
    language: 'Language',
    cameraZoom: 'camera zoom',
    resetCamera: 'Reset camera',
    cameraReset: 'Camera returned to the default view.',
    back: 'Back',
    levelMap: 'Level Map',
    levelMapSubtitle: 'The player clears levels in order, but any level can be selected for testing right now.',
    opened: 'Open',
    notCompleted: 'Not completed',
    legend: 'Legend',
    enemyRoad: 'Enemy road',
    towerPlatform: 'Tower platform',
    timeDistortion: 'Time distortion',
    timeRift: 'Time rift',
    playerBase: 'Player base',
    difficulty: 'Choose Difficulty',
    difficultySubtitle: '{level}: starts from wave {wave}. After choosing difficulty, the battle map opens.',
    coins: 'coins',
    baseHp: 'base HP',
    backToLevels: 'Back to levels',
    loadout: 'Build Bestiary',
    loadoutSubtitle: 'Choose towers for {level}, or start the battle even with an empty loadout.',
    bestiary: 'Bestiary',
    selected: 'selected',
    battleSet: 'Battle loadout',
    ready: 'ready',
    towersNeeded: 'battle allowed',
    empty: 'Empty',
    addFromBestiary: 'Add from Bestiary',
    backToDifficulty: 'Back to difficulty',
    toBattle: 'To battle',
    defenderProgress: 'Defender progress',
    savedOnline: 'saved in Supabase',
    signInToSave: 'sign in to save online',
    dayStreakShort: 'day streak',
    level: 'Level',
    bestWave: 'Best wave',
    wins: 'wins',
    streak: 'Streak',
    daysInRow: 'days in a row',
    xpToNext: 'To level {level}: {xp} XP',
    daily: 'Daily',
    weekly: 'Weekly',
    month: 'Month',
    reward: 'Reward',
    done: 'done',
    leaders: 'Leaders',
    dailyKillsTitle: 'Daily Hunt',
    dailyKillsDescription: 'Defeat {count} mobs today.',
    dailyWavesTitle: 'Three Time Strikes',
    dailyWavesDescription: 'Clear {count} waves today.',
    weeklyWavesTitle: 'Weekly Garrison',
    weeklyWavesDescription: 'Clear {count} waves this week.',
    weeklyKillsTitle: 'Rift Operation',
    weeklyKillsDescription: 'Defeat {count} mobs this week.',
    monthlyTitle: 'Mega Time Marathon',
    monthlyDescription: 'Defeat {count} mobs this month and prove the portal is under control.',
    profileTitle: 'Before Start',
    profileSubtitle: 'Enter the player name and age to start defending the timeline.',
    name: 'Name',
    namePlaceholder: 'For example, Alisher',
    age: 'Age',
    tutorialTitle: 'Practice Tutorial',
    tutorialSubtitle: 'We will jump straight to the battle map: the guide will show which tower to choose, where to place it, and when to start the wave.',
    tutorialStepOneTitle: 'Choose a level',
    tutorialStepOneText: 'Unfinished territories are faded on the map. After a win, they gain the era color.',
    tutorialStepTwoTitle: 'Build a loadout',
    tutorialStepTwoText: 'Before battle, you can choose towers, but an empty loadout can start too.',
    tutorialStepThreeTitle: 'Do not build on the road',
    tutorialStepThreeText: 'Towers can be placed only on special tiles. Enemies need the road to move.',
    tutorialStepFourTitle: 'Upgrade defense',
    tutorialStepFourText: 'Select a tower on the field, upgrade it, and change target priority.',
    startPractice: 'Start practice',
    skip: 'Skip',
    achievementsTitle: 'Achievements',
    achievementsSubtitle: 'Complete goals while defending the portal. Progress is saved on this computer.',
    earned: 'earned',
    inProgress: 'in progress',
    progress: 'Progress',
    battleTutorial: 'Battle tutorial',
    tutorialSelectTower: 'Step 1: choose a tower on the left.',
    tutorialPlaceTower: 'Step 2: place it on the highlighted platform.',
    tutorialStartWave: 'Step 3: start the first wave.',
    tutorialWatchWave: 'Step 4: watch the road, range, and rewards.',
    tutorialComplete: 'Done: now you can play on your own.',
    finish: 'Finish',
    wave: 'Wave',
    seconds: 'sec',
    defeat: 'Defeat',
    defeatSubtitle: 'The timeline could not withstand the attack.',
    gameTime: 'Game time',
    restart: 'Restart',
    mainMenu: 'Main menu',
    victory: 'Victory',
    victoryMessage: 'All waves are complete. The time portal is stable.',
    bossWaveHint: 'The next wave has a boss.',
    waveSkip: 'Skip',
    launch: 'Launch',
    baseHpEnded: 'Base HP is gone. Try a different layout.',
    retry: 'Try again',
  },
  kk: {
    player: 'Ойыншы',
    guest: 'Қонақ',
    startTitle: 'Басты мәзір',
    startSubtitle: 'Деңгей картасына өту үшін стартты таңда. Камера шайқаста қолжетімді: тышқан картаны бұрады, дөңгелек масштабты өзгертеді.',
    start: 'Бастау',
    achievements: 'Жетістіктер',
    settings: 'Баптаулар',
    tutorial: 'Туториал',
    editName: 'Атын өзгерту',
    playerName: 'Ойыншы аты',
    save: 'Сақтау',
    cancel: 'Бас тарту',
    settingsSubtitle: 'Мұнда тілді ауыстыруға, камераны бастапқы көрініске қайтаруға немесе үйретуді ашуға болады.',
    language: 'Тіл',
    cameraZoom: 'камера масштабы',
    resetCamera: 'Камераны қалпына келтіру',
    cameraReset: 'Камера бастапқы көрініске қайтарылды.',
    back: 'Артқа',
    levelMap: 'Деңгей картасы',
    levelMapSubtitle: 'Ойыншы деңгейлерді ретімен өтеді, бірақ қазір тест үшін кез келген деңгейді таңдауға болады.',
    opened: 'Ашық',
    notCompleted: 'Өтілмеген',
    legend: 'Аңыз',
    enemyRoad: 'Жаулар жолы',
    towerPlatform: 'Мұнара платформасы',
    timeDistortion: 'Уақыт бұрмалануы',
    timeRift: 'Уақыт жарығы',
    playerBase: 'Ойыншы базасы',
    difficulty: 'Қиындық таңдау',
    difficultySubtitle: '{level}: {wave}-толқыннан басталады. Қиындық таңдалған соң шайқас картасы ашылады.',
    coins: 'монета',
    baseHp: 'база HP',
    backToLevels: 'Деңгейлерге қайту',
    loadout: 'Бестиарий жина',
    loadoutSubtitle: '{level} үшін мұнара таңда немесе бос жинақпен бірден шайқас баста.',
    bestiary: 'Бестиарий',
    selected: 'таңдалды',
    battleSet: 'Шайқас жинағы',
    ready: 'дайын',
    towersNeeded: 'шайқас болады',
    empty: 'Бос',
    addFromBestiary: 'Бестиарийден қос',
    backToDifficulty: 'Қиындыққа қайту',
    toBattle: 'Шайқасқа',
    defenderProgress: 'Қорғаушы прогресі',
    savedOnline: 'Supabase ішінде сақталады',
    signInToSave: 'онлайн сақтау үшін кір',
    dayStreakShort: 'күн серия',
    level: 'Деңгей',
    bestWave: 'Ең жақсы толқын',
    wins: 'жеңіс',
    streak: 'Серия',
    daysInRow: 'күн қатарынан',
    xpToNext: '{level}-деңгейге дейін: {xp} XP',
    daily: 'Күнделікті',
    weekly: 'Апталық',
    month: 'Ай',
    reward: 'Сыйлық',
    done: 'дайын',
    leaders: 'Көшбасшылар',
    dailyKillsTitle: 'Күндік аңшылық',
    dailyKillsDescription: 'Бүгін {count} мобты жең.',
    dailyWavesTitle: 'Уақыттың үш соққысы',
    dailyWavesDescription: 'Бүгін {count} толқынды қайтар.',
    weeklyWavesTitle: 'Апталық гарнизон',
    weeklyWavesDescription: 'Апта ішінде {count} толқынды қайтар.',
    weeklyKillsTitle: 'Жарық операциясы',
    weeklyKillsDescription: 'Апта ішінде {count} мобты жең.',
    monthlyTitle: 'Үлкен уақыт марафоны',
    monthlyDescription: 'Ай ішінде {count} мобты жеңіп, портал бақылауда екенін дәлелде.',
    profileTitle: 'Бастамас бұрын',
    profileSubtitle: 'Уақыт сызығын қорғауды бастау үшін ойыншының аты мен жасын енгіз.',
    name: 'Аты',
    namePlaceholder: 'Мысалы, Әлішер',
    age: 'Жасы',
    tutorialTitle: 'Практикалық үйрету',
    tutorialSubtitle: 'Бірден шайқас картасына өтеміз: көмекші қай мұнараны таңдау, қайда қою және толқынды қашан бастау керегін көрсетеді.',
    tutorialStepOneTitle: 'Деңгей таңда',
    tutorialStepOneText: 'Өтілмеген аймақтар картада солғын. Жеңістен кейін олар дәуір түсін алады.',
    tutorialStepTwoTitle: 'Мұнараларды жина',
    tutorialStepTwoText: 'Шайқас алдында мұнара таңдауға болады, бірақ бос жинақпен де бастай аласың.',
    tutorialStepThreeTitle: 'Жолға қойма',
    tutorialStepThreeText: 'Мұнаралар тек арнайы ұяшықтарға қойылады. Жол жаулардың жүруі үшін керек.',
    tutorialStepFourTitle: 'Қорғанысты жақсарт',
    tutorialStepFourText: 'Алаңдағы мұнараны таңдап, жақсартып, нысана басымдығын өзгерт.',
    startPractice: 'Практиканы бастау',
    skip: 'Өткізу',
    achievementsTitle: 'Жетістіктер',
    achievementsSubtitle: 'Порталды қорғау кезінде мақсаттарды орында. Прогресс осы компьютерде сақталады.',
    earned: 'алынды',
    inProgress: 'орындалуда',
    progress: 'Прогресс',
    battleTutorial: 'Шайқас үйретуі',
    tutorialSelectTower: '1-қадам: сол жақтан мұнара таңда.',
    tutorialPlaceTower: '2-қадам: мұнараны белгіленген платформаға қой.',
    tutorialStartWave: '3-қадам: бірінші толқынды баста.',
    tutorialWatchWave: '4-қадам: жолды, радиусты және сыйлықтарды бақыла.',
    tutorialComplete: 'Дайын: енді өзің ойнай аласың.',
    finish: 'Аяқтау',
    wave: 'Толқын',
    seconds: 'сек',
    defeat: 'Жеңіліс',
    defeatSubtitle: 'Уақыт сызығы шабуылға шыдамады.',
    gameTime: 'Ойын уақыты',
    restart: 'Қайта бастау',
    mainMenu: 'Басты мәзір',
    victory: 'Жеңіс',
    victoryMessage: 'Барлық толқын өтті. Уақыт порталы тұрақты.',
    bossWaveHint: 'Келесі толқында босс бар.',
    waveSkip: 'Өткізу',
    launch: 'Бастау',
    baseHpEnded: 'Базаның HP бітті. Басқа орналастыруды байқап көр.',
    retry: 'Қайта көру',
  },
} satisfies Record<LanguageCode, Record<string, string>>;

const levelText: Record<LanguageCode, Record<number, { title: string; mapTitle: string }>> = {
  ru: {},
  en: {
    1: { title: 'Time Spark', mapTitle: 'Stone Age' },
    2: { title: 'Stone Path', mapTitle: 'Antiquity' },
    3: { title: 'Castle Gate', mapTitle: 'Middle Ages' },
    4: { title: 'Steam District', mapTitle: 'Industrial Era' },
    5: { title: 'Second Rift', mapTitle: 'Future' },
    6: { title: 'Final Portal', mapTitle: 'Cyberpunk' },
  },
  kk: {
    1: { title: 'Уақыт ұшқыны', mapTitle: 'Тас дәуірі' },
    2: { title: 'Тас жол', mapTitle: 'Антика' },
    3: { title: 'Қамал қақпасы', mapTitle: 'Орта ғасыр' },
    4: { title: 'Бу ауданы', mapTitle: 'Индустриялық дәуір' },
    5: { title: 'Секунд жарығы', mapTitle: 'Болашақ' },
    6: { title: 'Соңғы портал', mapTitle: 'Киберпанк' },
  },
};

const releaseText: Record<LanguageCode, {
  releaseBadge: string;
  demoBattle: string;
  leaveReview: string;
  sound: string;
  music: string;
  performanceMode: string;
  enabled: string;
  disabled: string;
  victorySubtitle: string;
  nextLevel: string;
  defeatedEnemies: string;
  earnedXp: string;
  clearedWaves: string;
}> = {
  ru: {
    releaseBadge: 'Финальная сборка',
    demoBattle: 'Быстрый демо-бой',
    leaveReview: 'Оставить отзыв',
    sound: 'Звуки',
    music: 'Музыка',
    performanceMode: 'Режим производительности',
    enabled: 'Включено',
    disabled: 'Выключено',
    victorySubtitle: 'Портал стабилен. Отличная защита для финального билда.',
    nextLevel: 'Следующий уровень',
    defeatedEnemies: 'Побеждено врагов',
    earnedXp: 'Получено XP',
    clearedWaves: 'Волн отбито',
  },
  en: {
    releaseBadge: 'Final build',
    demoBattle: 'Quick demo battle',
    leaveReview: 'Leave review',
    sound: 'Sound',
    music: 'Music',
    performanceMode: 'Performance mode',
    enabled: 'Enabled',
    disabled: 'Disabled',
    victorySubtitle: 'The portal is stable. Great defense for the final build.',
    nextLevel: 'Next level',
    defeatedEnemies: 'Enemies defeated',
    earnedXp: 'XP earned',
    clearedWaves: 'Waves cleared',
  },
  kk: {
    releaseBadge: 'Финалдық жинақ',
    demoBattle: 'Жылдам демо-шайқас',
    leaveReview: 'Пікір қалдыру',
    sound: 'Дыбыстар',
    music: 'Музыка',
    performanceMode: 'Өнімділік режимі',
    enabled: 'Қосулы',
    disabled: 'Өшірулі',
    victorySubtitle: 'Портал тұрақты. Финалдық нұсқаға лайық қорғаныс.',
    nextLevel: 'Келесі деңгей',
    defeatedEnemies: 'Жеңілген жаулар',
    earnedXp: 'Жиналған XP',
    clearedWaves: 'Қайтарылған толқын',
  },
};

const difficultyText: Record<LanguageCode, Record<Difficulty['id'], { name: string; description: string; boss: string }>> = {
  ru: {
    easy: { name: 'Легкая', description: 'Для новичков: больше монет, больше HP базы и спокойные первые волны.', boss: 'Треснувший Хрономант' },
    experienced: { name: 'Опытный режим', description: 'Для опытных искателей времени: честный баланс без лишней помощи.', boss: 'Повелитель Эпох' },
    hard: { name: 'Разрыв', description: 'Враги крепче, ошибок меньше, башни нужно ставить точнее.', boss: 'Разлом Сознания' },
    antiTime: { name: 'Антивремя', description: 'Самый сложный режим: поток времени злится, врагов больше, портал хрупкий.', boss: 'Нулевой Парадокс' },
  },
  en: {
    easy: { name: 'Easy', description: 'For beginners: more coins, more base HP, and calmer first waves.', boss: 'Cracked Chronomancer' },
    experienced: { name: 'Experienced', description: 'For practiced time seekers: fair balance without extra help.', boss: 'Epoch Lord' },
    hard: { name: 'Rift', description: 'Enemies are tougher, mistakes hurt more, and tower placement matters more.', boss: 'Mind Rift' },
    antiTime: { name: 'Anti-Time', description: 'The hardest mode: time flow is angry, enemies are many, and the portal is fragile.', boss: 'Zero Paradox' },
  },
  kk: {
    easy: { name: 'Жеңіл', description: 'Жаңадан бастаушыларға: көбірек монета, көбірек база HP және тыныш алғашқы толқындар.', boss: 'Жарылған Хрономант' },
    experienced: { name: 'Тәжірибелі', description: 'Уақыт іздеушілеріне: артық көмексіз әділ баланс.', boss: 'Дәуір Әміршісі' },
    hard: { name: 'Жарық', description: 'Жаулар мықтырақ, қате аз кешіріледі, мұнараны дәл қою маңызды.', boss: 'Сана Жарығы' },
    antiTime: { name: 'Антиуақыт', description: 'Ең қиын режим: уақыт ағыны ашулы, жау көп, портал нәзік.', boss: 'Нөлдік Парадокс' },
  },
};

const difficultyMetaText: Record<LanguageCode, { boss: string; waves: string; levels: string }> = {
  ru: { boss: 'Босс', waves: 'Волн', levels: 'Уровней' },
  en: { boss: 'Boss', waves: 'Waves', levels: 'Levels' },
  kk: { boss: 'Босс', waves: 'Толқын', levels: 'Деңгей' },
};

const epochTabletText: Record<LanguageCode, {
  title: string;
  subtitle: string;
  choose: string;
  map: string;
  waves: string;
  back: string;
}> = {
  ru: {
    title: 'Планшет эпохи',
    subtitle: 'Выбери один из пяти уровней внутри этой временной эпохи.',
    choose: 'Выбрать',
    map: 'Карта',
    waves: 'Волны',
    back: 'Назад к эпохам',
  },
  en: {
    title: 'Era Tablet',
    subtitle: 'Choose one of five levels inside this time era.',
    choose: 'Choose',
    map: 'Map',
    waves: 'Waves',
    back: 'Back to eras',
  },
  kk: {
    title: 'Дәуір планшеті',
    subtitle: 'Осы уақыт дәуіріндегі бес деңгейдің бірін таңда.',
    choose: 'Таңдау',
    map: 'Карта',
    waves: 'Толқын',
    back: 'Дәуірлерге қайту',
  },
};

const achievementText: Record<LanguageCode, Partial<Record<string, { title: string; description: string }>>> = {
  ru: {},
  en: {
    'first-defense': { title: 'First Line', description: 'Place your first tower.' },
    builder: { title: 'Time Architect', description: 'Build 10 towers across all games.' },
    'first-wave': { title: 'Wave Cleared', description: 'Clear the first wave.' },
    'wave-master': { title: 'Line Keeper', description: 'Clear 10 waves.' },
    hunter: { title: 'Rift Hunter', description: 'Defeat 50 mobs.' },
    chronoslayer: { title: 'Chrono Slayer', description: 'Defeat 200 mobs.' },
    upgrader: { title: 'Upgrade Master', description: 'Upgrade towers 8 times.' },
    'boss-breaker': { title: 'Break the Chronomancer', description: 'Defeat a boss.' },
    'map-runner': { title: 'Era Traveler', description: 'Clear 3 levels on the map.' },
    'hardtry-wave-30': { title: 'Hardtry: Wave 30', description: 'Reach wave 30 in any game.' },
    'hardtry-killer': { title: 'Hardtry: Thousand Rifts', description: 'Defeat 1000 mobs across all games.' },
    'hardtry-architect': { title: 'Hardtry: Era Engineer', description: 'Build 100 towers across all games.' },
    'hardtry-upgrades': { title: 'Hardtry: Maximum Power', description: 'Buy 75 tower upgrades.' },
    'hardtry-boss-hunter': { title: 'Hardtry: Boss Hunter', description: 'Defeat 5 bosses.' },
    'hardtry-hard-mode': { title: 'Hardtry: Rift Closed', description: 'Win on Rift difficulty.' },
    'hardtry-antitime': { title: 'Hardtry: Anti-Time Broken', description: 'Win on Anti-Time difficulty.' },
    'hardtry-perfect': { title: 'Hardtry: Perfect Line', description: 'Win without base damage.' },
    'hardtry-no-skip': { title: 'Hardtry: Not a Second Back', description: 'Win without skipping a wave.' },
  },
  kk: {
    'first-defense': { title: 'Бірінші сызық', description: 'Алғашқы мұнараңды қой.' },
    builder: { title: 'Уақыт сәулетшісі', description: 'Барлық ойындарда 10 мұнара сал.' },
    'first-wave': { title: 'Толқын қайтарылды', description: 'Бірінші толқынды өт.' },
    'wave-master': { title: 'Сызық сақшысы', description: '10 толқынды қайтар.' },
    hunter: { title: 'Жарық аңшысы', description: '50 мобты жең.' },
    chronoslayer: { title: 'Хроно жойғыш', description: '200 мобты жең.' },
    upgrader: { title: 'Жақсарту шебері', description: 'Мұнараларды 8 рет жақсарт.' },
    'boss-breaker': { title: 'Хрономантты жең', description: 'Боссты жең.' },
    'map-runner': { title: 'Дәуір саяхатшысы', description: 'Картада 3 деңгейді өт.' },
    'hardtry-wave-30': { title: 'Hardtry: 30-толқын', description: 'Кез келген ойында 30-толқынға жет.' },
    'hardtry-killer': { title: 'Hardtry: мың жарық', description: 'Барлық ойындарда 1000 мобты жең.' },
    'hardtry-architect': { title: 'Hardtry: дәуір инженері', description: 'Барлық ойындарда 100 мұнара сал.' },
    'hardtry-upgrades': { title: 'Hardtry: ең жоғары қуат', description: '75 мұнара жақсартуын сатып ал.' },
    'hardtry-boss-hunter': { title: 'Hardtry: босс аңшысы', description: '5 боссты жең.' },
    'hardtry-hard-mode': { title: 'Hardtry: жарық жабылды', description: 'Жарық қиындығында жең.' },
    'hardtry-antitime': { title: 'Hardtry: антиуақыт бұзылды', description: 'Антиуақыт қиындығында жең.' },
    'hardtry-perfect': { title: 'Hardtry: мінсіз сызық', description: 'Базаға зиян алмай жең.' },
    'hardtry-no-skip': { title: 'Hardtry: бір секунд та артқа емес', description: 'Толқынды өткізбей жең.' },
  },
};

const towerText: Record<LanguageCode, Partial<Record<TowerKind['id'], string>>> = {
  ru: {},
  en: {
    arrow: 'Time Scout',
    slow: 'Chrono Blast',
    blast: 'Temporal Sniper',
    rift: 'Rift Maker',
    hourglass: 'Hourglass',
    forge: 'Chrono Forge',
    mirror: 'Epoch Mirror',
    pulsar: 'Second Pulsar',
    beacon: 'Memory Beacon',
    archive: 'Archivist',
    sun: 'Solar Obelisk',
    gravity: 'Gravity Anchor',
    paradox: 'Paradox Prism',
    singularity: 'Singularity',
  },
  kk: {
    arrow: 'Уақыт барлаушысы',
    slow: 'Хроно-жарылыс',
    blast: 'Уақыт снайпері',
    rift: 'Жарық ашушы',
    hourglass: 'Құм сағат',
    forge: 'Хроно-ұста',
    mirror: 'Дәуір айнасы',
    pulsar: 'Секунд пульсары',
    beacon: 'Жад шамшырағы',
    archive: 'Архивші',
    sun: 'Күн обелискі',
    gravity: 'Грави-якорь',
  },
};

function fillText(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce((result, [key, value]) => result.split(`{${key}}`).join(String(value)), template);
}

function getPhoneOrientationHint(language: LanguageCode) {
  if (language === 'en') return 'Phone tip: rotate your screen horizontally for a better battle view.';
  if (language === 'kk') return 'Телефон кеңесі: шайқасқа ыңғайлы болу үшін экранды көлденең бұр.';
  return 'Совет для телефона: поверни экран горизонтально, так поле и башни будут удобнее.';
}

function getLevelUiText(level: LevelMapItem, language: LanguageCode) {
  return levelText[language][level.id] ?? { title: level.title, mapTitle: level.mapTitle };
}

function getDifficultyUiText(mode: Difficulty, language: LanguageCode) {
  return difficultyText[language][mode.id];
}

function getAchievementUiText(achievement: Achievement, language: LanguageCode) {
  return achievementText[language][achievement.id] ?? { title: achievement.title, description: achievement.description };
}

function getTowerUiName(tower: TowerKind, language: LanguageCode) {
  return towerText[language][tower.id] ?? tower.name;
}

function getPlacementUiLabel(tower: TowerKind, language: LanguageCode) {
  if (language === 'en') return tower.elevatedOnly ? 'highland only' : 'ground';
  if (language === 'kk') return tower.elevatedOnly ? 'тек биіктік' : 'жер';
  return getPlacementLabel(tower);
}

function getChallengeUiText(challenge: DailyChallenge, language: LanguageCode) {
  const t = uiText[language];

  if (challenge.rewardXp === 1800) {
    return {
      title: t.monthlyTitle,
      description: fillText(t.monthlyDescription, { count: challenge.goal }),
    };
  }

  if (challenge.rewardXp === 420) {
    const isWaveChallenge = challenge.goal === 24;
    return {
      title: isWaveChallenge ? t.weeklyWavesTitle : t.weeklyKillsTitle,
      description: fillText(isWaveChallenge ? t.weeklyWavesDescription : t.weeklyKillsDescription, { count: challenge.goal }),
    };
  }

  const isWaveChallenge = challenge.goal === 3 || challenge.goal === 5;
  return {
    title: isWaveChallenge ? t.dailyWavesTitle : t.dailyKillsTitle,
    description: fillText(isWaveChallenge ? t.dailyWavesDescription : t.dailyKillsDescription, { count: challenge.goal }),
  };
}

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
  completed_level_ids: [],
  achievement_stats: {
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
  },
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
    cost: 40,
    damage: 28,
    range: 2.25,
    cooldown: 760,
    levelDescriptions: [
      'Временной выстрел: каждый 5-й удар замедляет цель на 20% на 2 секунды.',
      'Хроно-браслет: чаще держит быстрые цели под контролем.',
      'Генератор волн: стабильный базовый урон и надежное замедление.',
    ],
  },
  {
    id: 'slow',
    name: 'Хроно-бласт',
    icon: 'C',
    sprite: toSvgDataUri(chronoBlastSpriteSvg),
    cost: 85,
    damage: 52,
    range: 2.45,
    cooldown: 1850,
    levelDescriptions: [
      'Разрыв секунды: выстрел взрывается и задевает врагов рядом.',
      'Две хроно-пушки: область взрыва и урон становятся выше.',
      'Тяжелый хроно-залп: сильный урон по плотным группам.',
    ],
  },
  {
    id: 'blast',
    name: 'Временной снайпер',
    icon: 'B',
    sprite: toSvgDataUri(temporalSniperSpriteSvg),
    cost: 140,
    damage: 125,
    range: 3.7,
    cooldown: 2700,
    elevatedOnly: true,
    levelDescriptions: ['Критическая точка: каждый выстрел по боссу наносит на 30% больше урона.', 'Линза-хронометр: дальность и точность против сильных целей растут.', 'Снайпер эпох: огромный одиночный урон по главным угрозам.'],
  },
];

const extraTowerKinds: TowerKind[] = [
  {
    id: 'rift',
    name: 'Разломщик',
    icon: 'R',
    sprite: toSvgDataUri(riftBreakerSpriteSvg),
    cost: 145,
    damage: 56,
    range: 1.7,
    cooldown: 1700,
    levelDescriptions: ['Разлом пространства: удар поражает несколько врагов в линии дороги.', 'Поврежденная броня: линия разлома становится длиннее.', 'Нестабильная энергия: ближний контроль и высокий урон по цепочке.'],
  },
  {
    id: 'hourglass',
    name: 'Песочные часы',
    icon: 'H',
    sprite: toSvgDataUri(hourglassTowerSpriteSvg),
    cost: 150,
    damage: 4,
    range: 2.65,
    cooldown: 2300,
    levelDescriptions: ['Замедление времени: враги рядом теряют около 40% скорости.', 'Золотой поток: контроль держится дольше.', 'Голова-песочные часы: почти постоянный контроль важных участков.'],
  },
  {
    id: 'forge',
    name: 'Хронокузница',
    icon: 'F',
    sprite: toSvgDataUri(chronoForgeSpriteSvg),
    cost: 210,
    damage: 0,
    range: 1.9,
    cooldown: 1000,
    levelDescriptions: ['Закалка эпох: ближайшие башни наносят на 20% больше урона.', 'Горячие шестерни: бонус урона усиливается.', 'Мастерская эпох: отличный баффер для плотной обороны.'],
  },
  {
    id: 'mirror',
    name: 'Зеркало эпох',
    icon: 'M',
    sprite: toSvgDataUri(epochMirrorSpriteSvg),
    cost: 190,
    damage: 10,
    range: 2.4,
    cooldown: 2300,
    levelDescriptions: ['Отражение времени: копирует часть силы ближайшей атакующей башни.', 'Серебряный разлом: копия становится стабильнее.', 'Панорама эпох: гибкая поддержка там, где рядом есть сильная башня.'],
  },
  {
    id: 'pulsar',
    name: 'Пульсар секунд',
    icon: 'P',
    sprite: toSvgDataUri(secondPulsarSpriteSvg),
    cost: 280,
    damage: 30,
    range: 99,
    cooldown: 10000,
    levelDescriptions: ['Импульс времени: каждые 8 секунд задевает всех врагов на карте.', 'Звездные частицы: глобальная волна наносит больше урона.', 'Пульсар эпох: редкий, но мощный массовый удар.'],
  },
  {
    id: 'beacon',
    name: 'Маяк памяти',
    icon: 'L',
    sprite: toSvgDataUri(memoryBeaconSpriteSvg),
    cost: 170,
    damage: 0,
    range: 3.5,
    cooldown: 20000,
    levelDescriptions: ['Воспоминание: каждые 20 секунд приносит дополнительные монеты.', 'Кристалл памяти: доход растет.', 'Древняя платформа: экономика заметно ускоряется в длинных боях.'],
  },
  {
    id: 'archive',
    name: 'Архивариус',
    icon: 'A',
    sprite: toSvgDataUri(archivistSpriteSvg),
    cost: 200,
    damage: 0,
    range: 2.15,
    cooldown: 2200,
    levelDescriptions: ['Запись данных: улучшения башен рядом стоят дешевле, а волны дают больше XP.', 'Летающие книги: бонус развития усиливается.', 'Архив истории: лучшая поддержка поздней игры.'],
  },
  {
    id: 'sun',
    name: 'Солнечный обелиск',
    icon: 'O',
    sprite: toSvgDataUri(solarObeliskSpriteSvg),
    cost: 320,
    damage: 190,
    range: 3,
    cooldown: 30000,
    elevatedOnly: true,
    levelDescriptions: ['Солнечная эпоха: раз в 25 секунд вызывает огромный луч по области.', 'Золотой монумент: луч становится сильнее.', 'Солнце эпохи: тяжелая артиллерия для поздних волн.'],
  },
  {
    id: 'gravity',
    name: 'Грави-якорь',
    icon: 'G',
    sprite: toSvgDataUri(gravityAnchorSpriteSvg),
    cost: 260,
    damage: 6,
    range: 2.25,
    cooldown: 2300,
    levelDescriptions: ['Гравитационный захват: обычные враги теряют до 80% скорости, боссы до 50%.', 'Темные цепи: контроль держится дольше.', 'Якорь сингулярности: лучший контроль боссов и быстрых рывков.'],
  },
  {
    id: 'paradox',
    name: 'Парадоксальная призма',
    icon: 'X',
    sprite: toSvgDataUri(paradoxPrismSpriteSvg),
    cost: 620,
    damage: 260,
    range: 3.4,
    cooldown: 4200,
    elevatedOnly: true,
    levelDescriptions: [
      'Парадоксальный выстрел: пробивает линию времени вокруг цели и добивает слабых обычных врагов.',
      'Двойная причинность: зона пробоя шире, а боссы получают усиленный урон.',
      'Петля конца: редкий сверхурон по главным целям без бесплатной победы.',
    ],
  },
  {
    id: 'singularity',
    name: 'Сингулярность',
    icon: 'Q',
    sprite: toSvgDataUri(singularityCoreSpriteSvg),
    cost: 760,
    damage: 74,
    range: 99,
    cooldown: 12500,
    levelDescriptions: [
      'Черная секунда: задевает всю карту, замедляет и кратко удерживает обычных врагов.',
      'Горизонт событий: контроль длится дольше, а волна получает больше урона.',
      'Точка невозврата: мощный глобальный контроль для сотых волн, но с большим кулдауном.',
    ],
  },
];

const availableTowerKinds: TowerKind[] = [...towerKinds, ...extraTowerKinds];

const towerMarketPrices: Record<TowerKind['id'], number> = {
  arrow: 0,
  slow: 20,
  blast: 30,
  rift: 30,
  hourglass: 35,
  forge: 45,
  mirror: 45,
  pulsar: 70,
  beacon: 40,
  archive: 50,
  sun: 80,
  gravity: 65,
  paradox: 140,
  singularity: 180,
};

function getTowerUnlockText(kind: TowerKind['id']) {
  if (kind === 'paradox') {
    return 'Откроется: пройди всю игру на Антивремени.';
  }

  if (kind === 'singularity') {
    return 'Откроется: дойди до 100 волны в Петле времени.';
  }

  return '';
}

function isTowerUnlockedByChallenge(kind: TowerKind['id'], stats: AchievementStats, completedLevels: number) {
  if (kind === 'paradox') {
    return stats.antiTimeVictories >= totalEraMissionCount && completedLevels >= totalEraMissionCount;
  }

  if (kind === 'singularity') {
    return stats.maxWaveReached >= 100;
  }

  return true;
}

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
    maxWaves: 27,
  },
  {
    id: 'experienced',
    name: 'Опытный режим',
    description: 'Для опытных искателей времени: честный баланс без лишней помощи.',
    startCoins: 120,
    startBaseHp: 125,
    hpMultiplier: 1,
    extraEnemies: 0,
    maxWaves: 33,
  },
  {
    id: 'hard',
    name: 'Разрыв',
    description: 'Враги крепче, ошибок меньше, башни нужно ставить точнее.',
    startCoins: 100,
    startBaseHp: 100,
    hpMultiplier: 1.22,
    extraEnemies: 1,
    maxWaves: 40,
  },
  {
    id: 'antiTime',
    name: 'Антивремя',
    description: 'Самый сложный режим: поток времени злится, врагов больше, портал хрупкий.',
    startCoins: 85,
    startBaseHp: 80,
    hpMultiplier: 1.45,
    extraEnemies: 2,
    maxWaves: 48,
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

function getWaveThreatDescriptions(wave: number, difficultyData: Difficulty, gameMode: GameMode = 'campaign') {
  const regularEnemies = 5 + Math.ceil(wave * 1.45) + difficultyData.extraEnemies;
  const waveKinds = new Set<EasyMonsterId>();

  for (let spawnIndex = 1; spawnIndex <= regularEnemies; spawnIndex += 1) {
    waveKinds.add(chooseEnemyKind(wave, spawnIndex));
  }

  const descriptions = Array.from(waveKinds).map((kind) => getEnemyKind(kind).ability);

  if (isBossWave(wave, gameMode, difficultyData.maxWaves)) {
    descriptions.push('оглушает башни, ускоряет угрозы рядом и становится быстрее при низком здоровье');
  }

  return descriptions;
}

function getFallbackWaveCommentary(wave: number, isBoss: boolean, isServant = false) {
  if (isBoss) {
    return `Комментатор: Волна ${wave}: держи запас прочности, темп может резко сломаться ближе к финалу.`;
  }

  if (isServant) {
    return `Комментатор: Волна ${wave}: это не финальный босс, а его служащий. Чем ближе финал, тем тяжелее такие приспешники.`;
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
    lightSlowUntil: 0,
    stoppedUntil: 0,
    gravityUntil: 0,
    isBoss: false,
    isBossServant: false,
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
    isBossServant: false,
    monsterId: null,
  };
}

function createBossServantEnemy(wave: number, difficultyData: Difficulty, idSeed: number, now: number, progressRatio: number): Enemy {
  const servantKinds: EasyMonsterId[] = ['brokenCourier', 'tickingScarab', 'shardRunner', 'slowedWolf'];
  const kindId = servantKinds[(wave + Math.floor(progressRatio * 10)) % servantKinds.length];
  const hpScale = 2.2 + progressRatio * 3.2 + difficultyData.extraEnemies * 0.25;
  const servant = createEnemy(kindId, wave, difficultyData, idSeed, now, hpScale);
  const rewardScale = 2.4 + progressRatio * 2.2;

  return {
    ...servant,
    speed: Math.max(1.4, servant.speed * (0.82 + progressRatio * 0.18)),
    reward: Math.round(servant.reward * rewardScale),
    isBossServant: true,
    lastAbilityAt: now - 2500,
  };
}

function getEnemySpeed(enemy: Enemy, now: number) {
  let speed = enemy.speed;

  if (enemy.stoppedUntil > now) speed *= 0.12;
  if (enemy.lightSlowUntil > now) speed *= 0.8;
  if (enemy.slowedUntil > now) speed *= 0.58;
  if (enemy.gravityUntil > now) speed *= enemy.isBoss ? 0.65 : 0.35;
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
  if (towerKind === 'hourglass') return Math.ceil(damage * 1.05);
  return damage;
}

function getTowerDamageMultiplier(tower: Tower, towers: Tower[]) {
  const nearbyForge = towers
    .filter((item) => item.kind === 'forge' && item.id !== tower.id)
    .find((forge) => distanceBetweenCells(tower.cell, forge.cell) <= getTowerStats(forge).range);

  if (!nearbyForge) return 1;

  return 1.15 + (nearbyForge.level - 1) * 0.05;
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

function getWaveDuration(wave: number, gameMode: GameMode = 'campaign', campaignMaxWaves = maxWaves) {
  if (isBossWave(wave, gameMode, campaignMaxWaves)) return gameMode === 'timeLoop' ? 90 : 120;
  return baseWaveDuration + Math.min(20, wave * 3);
}

function getTowerKind(kind: TowerKind['id']) {
  return availableTowerKinds.find((tower) => tower.id === kind) ?? availableTowerKinds[0];
}

function getTowerStats(tower: Tower) {
  const kind = getTowerKind(tower.kind);
  return {
    ...kind,
    damage: Math.round(kind.damage * (1 + (tower.level - 1) * 0.45)),
    range: kind.range + (tower.level - 1) * 0.18,
    cooldown: Math.max(520, kind.cooldown - (tower.level - 1) * 90),
  };
}

function getTowerLevelDescription(tower: Tower, level = tower.level) {
  const descriptionIndex = Math.min(maxTowerLevel, Math.max(1, level)) - 1;
  return getTowerKind(tower.kind).levelDescriptions[descriptionIndex];
}

function getUpgradeCost(tower: Tower) {
  return Math.round(getTowerKind(tower.kind).cost * (0.75 + tower.level * 0.65));
}

function getArchiveUpgradeMultiplier(tower: Tower, towers: Tower[]) {
  const nearbyArchive = towers
    .filter((item) => item.kind === 'archive' && item.id !== tower.id)
    .find((archive) => distanceBetweenCells(tower.cell, archive.cell) <= getTowerStats(archive).range);

  if (!nearbyArchive) return 1;

  return Math.max(0.82, 0.94 - (nearbyArchive.level - 1) * 0.04);
}

function getDiscountedUpgradeCost(tower: Tower, towers: Tower[]) {
  return Math.round(getUpgradeCost(tower) * getArchiveUpgradeMultiplier(tower, towers));
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
  void tower;
  void towers;
  return 1;
}

function getMirrorCopiedDamage(tower: Tower, towers: Tower[]) {
  const nearbyTower = towers
    .filter((item) => item.id !== tower.id && item.kind !== 'mirror' && item.kind !== 'forge' && item.kind !== 'beacon' && item.kind !== 'archive')
    .filter((item) => distanceBetweenCells(tower.cell, item.cell) <= getTowerStats(tower).range)
    .sort((a, b) => getTowerStats(b).damage - getTowerStats(a).damage)[0];

  if (!nearbyTower) return getTowerStats(tower).damage;

  return Math.max(getTowerStats(tower).damage, Math.round(getTowerStats(nearbyTower).damage * (0.45 + (tower.level - 1) * 0.06)));
}

function getArchiveRewardBonus(enemy: Enemy, towers: Tower[], activePathCells = pathCells) {
  const archive = towers
    .filter((tower) => tower.kind === 'archive')
    .find((tower) => distanceBetweenCells(tower.cell, getEnemyCell(enemy, activePathCells)) <= getTowerStats(tower).range);

  if (!archive) return 0;

  return Math.round(enemy.reward * (0.06 + (archive.level - 1) * 0.04));
}

function getArchiveXpBonus(towers: Tower[]) {
  const strongestArchive = towers
    .filter((tower) => tower.kind === 'archive')
    .sort((a, b) => b.level - a.level)[0];

  return strongestArchive ? 8 + strongestArchive.level * 4 : 0;
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

function canPlaceTowerOnCell(tower: TowerKind, cell: number, activeMap: BattleMapLayout) {
  if (!activeMap.buildCells.includes(cell)) return false;

  const isHighlandCell = activeMap.highlandCells.includes(cell);
  return tower.elevatedOnly ? isHighlandCell : !isHighlandCell;
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
  if (tower.kind === 'pulsar' || tower.kind === 'singularity') {
    return enemies;
  }

  if (tower.kind === 'paradox') {
    const lineReach = 4 + tower.level;
    return enemies.filter((enemy) => Math.abs(enemy.step - target.step) <= lineReach);
  }

  if (tower.kind === 'rift') {
    const lineReach = 2 + tower.level;
    return enemies.filter((enemy) => Math.abs(enemy.step - target.step) <= lineReach);
  }

  if (tower.kind === 'slow' || tower.kind === 'hourglass' || tower.kind === 'mirror' || tower.kind === 'sun') {
    const splashRange =
      tower.kind === 'slow'
        ? 1.25 + tower.level * 0.16
        : tower.kind === 'hourglass'
          ? 1.45 + tower.level * 0.12
          : tower.kind === 'sun'
            ? 1.55 + tower.level * 0.18
            : 0.95 + tower.level * 0.1;
    return enemies.filter((enemy) => distanceBetweenCells(getEnemyCell(target, activePathCells), getEnemyCell(enemy, activePathCells)) <= splashRange);
  }

  return [target];
}

function getBossServantWaveNumbers(campaignMaxWaves: number) {
  return Array.from(new Set([Math.max(2, Math.round(campaignMaxWaves / 3)), Math.max(3, Math.round((campaignMaxWaves * 2) / 3)), campaignMaxWaves]));
}

function isBossWave(wave: number, gameMode: GameMode = 'campaign', campaignMaxWaves = maxWaves, finalBossAllowed = true) {
  return gameMode === 'timeLoop' ? wave > 0 && wave % endlessBossInterval === 0 : finalBossAllowed && wave === campaignMaxWaves;
}

function isBossServantWave(wave: number, gameMode: GameMode = 'campaign', campaignMaxWaves = maxWaves, finalBossAllowed = true) {
  if (gameMode === 'timeLoop') return false;
  if (finalBossAllowed && wave === campaignMaxWaves) return false;
  return getBossServantWaveNumbers(campaignMaxWaves).includes(wave);
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

  if (sound === 'buttonHover') {
    playTone(audioContext, 520, now, 0.045, 0.012, 'sine');
    playTone(audioContext, 780, now + 0.022, 0.04, 0.008, 'triangle');
    return;
  }

  if (sound === 'buttonClick') {
    playTone(audioContext, 260, now, 0.055, 0.026, 'triangle');
    playTone(audioContext, 620, now + 0.04, 0.075, 0.018, 'sine');
    return;
  }

  if (sound === 'screenTransition') {
    playTone(audioContext, 146.83, now, 0.16, 0.032, 'sine');
    playTone(audioContext, 220, now + 0.06, 0.18, 0.024, 'triangle');
    playTone(audioContext, 440, now + 0.14, 0.16, 0.018, 'sine');
    return;
  }

  if (sound === 'menuIdle') {
    playTone(audioContext, 82.41, now, 0.9, 0.018, 'sine');
    playTone(audioContext, 164.81, now + 0.12, 0.72, 0.012, 'triangle');
    playTone(audioContext, 246.94, now + 0.38, 0.62, 0.009, 'sine');
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

function normalizeAchievementStats(stats: unknown): AchievementStats {
  if (!stats || typeof stats !== 'object') return emptyAchievementStats;

  const partialStats = stats as Partial<Record<keyof AchievementStats, unknown>>;
  return {
    totalKills: typeof partialStats.totalKills === 'number' ? partialStats.totalKills : 0,
    wavesCompleted: typeof partialStats.wavesCompleted === 'number' ? partialStats.wavesCompleted : 0,
    towersBuilt: typeof partialStats.towersBuilt === 'number' ? partialStats.towersBuilt : 0,
    upgradesBought: typeof partialStats.upgradesBought === 'number' ? partialStats.upgradesBought : 0,
    bossesDefeated: typeof partialStats.bossesDefeated === 'number' ? partialStats.bossesDefeated : 0,
    maxWaveReached: typeof partialStats.maxWaveReached === 'number' ? partialStats.maxWaveReached : 0,
    hardVictories: typeof partialStats.hardVictories === 'number' ? partialStats.hardVictories : 0,
    antiTimeVictories: typeof partialStats.antiTimeVictories === 'number' ? partialStats.antiTimeVictories : 0,
    noDamageVictories: typeof partialStats.noDamageVictories === 'number' ? partialStats.noDamageVictories : 0,
    noSkipVictories: typeof partialStats.noSkipVictories === 'number' ? partialStats.noSkipVictories : 0,
  };
}

function normalizeCompletedLevelIds(levelIds: unknown) {
  if (!Array.isArray(levelIds)) return [];

  return levelIds.filter((levelId): levelId is number =>
    typeof levelId === 'number' && Number.isInteger(levelId) && levelId > 0,
  );
}

function readTutorialSeen() {
  return window.localStorage.getItem(tutorialSeenStorageKey) === 'true';
}

function readSavedPlayerName() {
  return window.localStorage.getItem(playerNameStorageKey)?.trim() ?? '';
}

function readSavedLanguage(): LanguageCode {
  const savedLanguage = window.localStorage.getItem(languageStorageKey);
  return savedLanguage === 'ru' || savedLanguage === 'en' || savedLanguage === 'kk' ? savedLanguage : 'ru';
}

function readSavedBoolean(storageKey: string, fallback: boolean) {
  const savedValue = window.localStorage.getItem(storageKey);
  if (savedValue === null) return fallback;

  return savedValue === 'true';
}

function savePlayerName(name: string) {
  const cleanName = name.trim();
  if (cleanName) {
    window.localStorage.setItem(playerNameStorageKey, cleanName);
  }
}

function getAchievementProgress(achievement: Achievement, stats: AchievementStats, completedLevels: number) {
  return Math.min(achievement.goal, achievement.getProgress(stats, completedLevels));
}

export function TimeTowerDefense({ userEmail, userId }: { userEmail: string; userId?: string }) {
  const [screen, setScreen] = useState<GameScreen>('welcome');
  const [language, setLanguage] = useState<LanguageCode>(readSavedLanguage);
  const [welcomeExiting, setWelcomeExiting] = useState(false);
  const [playerName, setPlayerName] = useState(readSavedPlayerName);
  const [playerAge, setPlayerAge] = useState('');
  const [profileError, setProfileError] = useState('');
  const [tutorialSeen, setTutorialSeen] = useState(readTutorialSeen);
  const [practiceTutorialActive, setPracticeTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>('selectTower');
  const [gameMode, setGameMode] = useState<GameMode>('campaign');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [completedLevelIds, setCompletedLevelIds] = useState<number[]>(readCompletedLevelIds);
  const [achievementStats, setAchievementStats] = useState<AchievementStats>(readAchievementStats);
  const [retentionProfile, setRetentionProfile] = useState<RetentionProfile>(() =>
    refreshRetentionForToday({ ...emptyRetentionProfile, user_id: userId ?? '', display_name: userEmail || 'Игрок' }),
  );
  const [leaderboard, setLeaderboard] = useState<RetentionLeaderboardEntry[]>([]);
  const [reviews, setReviews] = useState<PlayerReview[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewStatusMessage, setReviewStatusMessage] = useState('');
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [experienceFlash, setExperienceFlash] = useState<ExperienceFlash | null>(null);
  const [retentionLoading, setRetentionLoading] = useState(Boolean(userId));
  const [soundEnabled, setSoundEnabled] = useState(() => readSavedBoolean(soundEnabledStorageKey, true));
  const [musicEnabled, setMusicEnabled] = useState(() => readSavedBoolean(musicEnabledStorageKey, true));
  const [performanceMode, setPerformanceMode] = useState(() => readSavedBoolean(performanceModeStorageKey, false));
  const [settingsFocus, setSettingsFocus] = useState<SettingsFocus>('top');
  const [selectedLevelId, setSelectedLevelId] = useState(1);
  const [selectedEraMissionId, setSelectedEraMissionId] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty['id']>('easy');
  const selectedDifficultyData = difficultyModes.find((mode) => mode.id === difficulty) ?? difficultyModes[0];
  const selectedMaxWaves = selectedDifficultyData.maxWaves;
  const selectedBossProfile = bossProfiles[difficulty];
  const isTimeLoopMode = gameMode === 'timeLoop';
  const [eraIndex, setEraIndex] = useState(0);
  const [wave, setWave] = useState(1);
  const [coins, setCoins] = useState(selectedDifficultyData.startCoins);
  const [baseHp, setBaseHp] = useState(selectedDifficultyData.startBaseHp);
  const [selectedTower, setSelectedTower] = useState<TowerKind['id']>('arrow');
  const [towerSlots, setTowerSlots] = useState<TowerSlot[]>(starterTowerSlots);
  const [unlockedTowerIds, setUnlockedTowerIds] = useState<TowerKind['id'][]>(freeTowerIds);
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
  const [victoryDurationSeconds, setVictoryDurationSeconds] = useState(0);
  const [battleSummary, setBattleSummary] = useState<BattleSummary>({ kills: 0, bosses: 0, waves: 0, xp: 0 });
  const [boardTilt, setBoardTilt] = useState(boardViewAngle);
  const [boardTurn, setBoardTurn] = useState(358);
  const [boardZoom, setBoardZoom] = useState(1);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const reviewPanelRef = useRef<HTMLFormElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const backgroundMusicRef = useRef<BackgroundMusicEngine | null>(null);
  const lastButtonHoverSoundRef = useRef(0);
  const menuIdleTimerRef = useRef<number | null>(null);
  const windowTransitionTimersRef = useRef<number[]>([]);
  const commentatorRequestRef = useRef(0);
  const runChallengeRef = useRef({ tookDamage: false, skippedWave: false });
  const previousXpRef = useRef(retentionProfile.xp);
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
  const unlockedTowerSet = useMemo(() => new Set<TowerKind['id']>(unlockedTowerIds), [unlockedTowerIds]);
  const isSelectedTowerEquipped = equippedTowerIds.includes(selectedTower);
  const minLoadoutSize = Math.min(requiredLoadoutSize, availableTowerKinds.length);
  const isLoadoutReady = equippedTowerIds.length >= minLoadoutSize;
  const selectedPlacedTower = towers.find((tower) => tower.id === selectedTowerId) ?? null;
  const selectedLevel = levelMap.find((level) => level.id === selectedLevelId) ?? levelMap[0];
  const selectedEraMissions = eraMissionCatalog[selectedLevel.mapArea];
  const selectedEraMission = selectedEraMissions.find((mission) => mission.id === selectedEraMissionId) ?? selectedEraMissions[0];
  const isFinalCampaignMission = selectedLevel.id === levelMap[levelMap.length - 1].id && selectedEraMission.id === selectedEraMissions[selectedEraMissions.length - 1].id;
  const selectedMissionStartWave = isTimeLoopMode ? 1 : Math.min(selectedMaxWaves, selectedLevel.startWave + selectedEraMission.startWaveOffset);
  const selectedProgressLevelId = selectedLevel.id * 10 + selectedEraMission.id;
  const selectedBattleMap = useMemo(
    () => getMissionBattleMap(selectedLevel, selectedEraMission, language),
    [language, selectedEraMission, selectedLevel],
  );
  const boardCells = useMemo(() => Array.from({ length: boardSize * boardSize }, (_, cell) => cell), []);
  const battleCellSets = useMemo(
    () => ({
      path: new Set(selectedBattleMap.pathCells),
      build: new Set(selectedBattleMap.buildCells),
      highland: new Set(selectedBattleMap.highlandCells),
    }),
    [selectedBattleMap],
  );
  const hasFinalBossInCurrentWave = isBossWave(wave, gameMode, selectedMaxWaves, isTimeLoopMode || isFinalCampaignMission);
  const hasBossServantInCurrentWave = isBossServantWave(wave, gameMode, selectedMaxWaves, isFinalCampaignMission);
  const enemiesInCurrentWave = 5 + Math.ceil(wave * 1.45) + selectedDifficultyData.extraEnemies + (hasFinalBossInCurrentWave || hasBossServantInCurrentWave ? 1 : 0);
  const waveElapsedSeconds = Math.max(0, getWaveDuration(wave, gameMode, selectedMaxWaves) - waveTimeLeft);
  const waveLimitLabel = isTimeLoopMode ? '∞' : String(selectedMaxWaves);
  const skipSecondsLeft = Math.max(0, skipUnlockDelay - waveElapsedSeconds);
  const canSkipWave = isWaveRunning && skipSecondsLeft === 0 && baseHp > 0 && !isVictory;
  const t = uiText[language];
  const finalText = releaseText[language];
  const selectedLevelUi = getLevelUiText(selectedLevel, language);
  const selectedMissionTitle = selectedEraMission.title[language];
  const epochTablet = epochTabletText[language];
  const playerLabel = playerName.trim() || retentionProfile.display_name || userEmail || t.guest;
  const isReviewAdmin = adminReviewEmails.includes(userEmail.toLowerCase());
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

  function changeLanguage(nextLanguage: LanguageCode) {
    setLanguage(nextLanguage);
    window.localStorage.setItem(languageStorageKey, nextLanguage);
    document.documentElement.lang = nextLanguage;
  }

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
    if (!musicEnabled) return;

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
    if (!musicEnabled) return;

    startBackgroundMusic();
  }

  function playSound(sound: GameSound) {
    if (!soundEnabled) return;

    const audioContext = getAudioContext();
    startBackgroundMusic();
    playGameSound(audioContext, sound);
  }

  function playButtonHoverSound() {
    const now = Date.now();
    if (now - lastButtonHoverSoundRef.current < 90) return;

    lastButtonHoverSoundRef.current = now;
    playSound('buttonHover');
  }

  function playButtonClickSound() {
    playSound('buttonClick');
  }

  function handleUiPointerOver(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse') return;

    const targetButton = event.target instanceof HTMLElement ? event.target.closest<HTMLButtonElement>('button') : null;
    if (!targetButton || targetButton.disabled) return;

    const previousTarget = event.relatedTarget instanceof HTMLElement ? event.relatedTarget : null;
    if (previousTarget && targetButton.contains(previousTarget)) return;

    playButtonHoverSound();
  }

  function handleUiClick(event: MouseEvent<HTMLElement>) {
    const targetButton = event.target instanceof HTMLElement ? event.target.closest<HTMLButtonElement>('button') : null;
    if (!targetButton || targetButton.disabled) return;

    playButtonClickSound();
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
      completed_level_ids: profile.completed_level_ids,
      achievement_stats: profile.achievement_stats,
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
      completed_level_ids: normalizeCompletedLevelIds(row?.completed_level_ids),
      achievement_stats: normalizeAchievementStats(row?.achievement_stats),
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

  function isPlayerReview(row: unknown): row is PlayerReview {
    if (!row || typeof row !== 'object') return false;
    const review = row as Partial<PlayerReview>;
    return (
      typeof review.id === 'string' &&
      typeof review.user_id === 'string' &&
      typeof review.user_email === 'string' &&
      typeof review.display_name === 'string' &&
      typeof review.rating === 'number' &&
      typeof review.message === 'string' &&
      (review.status === 'new' || review.status === 'read' || review.status === 'archived') &&
      typeof review.created_at === 'string'
    );
  }

  async function refreshReviews() {
    if (!supabase || !userId) {
      setReviews([]);
      return;
    }

    setReviewsLoading(true);
    const { data, error } = await supabase
      .from('player_reviews')
      .select('id,user_id,user_email,display_name,rating,message,status,created_at')
      .order('created_at', { ascending: false })
      .limit(isReviewAdmin ? 50 : 5);

    if (!error && Array.isArray(data)) {
      setReviews(data.filter(isPlayerReview));
    }

    setReviewsLoading(false);
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !userId) {
      setReviewStatusMessage('Войди в аккаунт, чтобы отзыв сохранился в Supabase.');
      return;
    }

    const cleanMessage = reviewMessage.trim();
    if (cleanMessage.length < 3) {
      setReviewStatusMessage('Напиши отзыв хотя бы из 3 символов.');
      return;
    }

    const { error } = await supabase.from('player_reviews').insert({
      user_id: userId,
      user_email: userEmail,
      display_name: playerLabel,
      rating: reviewRating,
      message: cleanMessage,
    });

    if (error) {
      setReviewStatusMessage('Не получилось сохранить отзыв. Проверь, применена ли миграция базы.');
      return;
    }

    setReviewMessage('');
    setReviewRating(5);
    setReviewStatusMessage('Спасибо! Отзыв сохранен.');
    await refreshReviews();
  }

  async function updateReviewStatus(reviewId: string, status: PlayerReviewStatus) {
    if (!supabase || !isReviewAdmin) return;

    const { error } = await supabase.from('player_reviews').update({ status }).eq('id', reviewId);
    if (error) {
      setReviewStatusMessage('Не получилось обновить статус отзыва.');
      return;
    }

    setReviews((current) => current.map((review) => (review.id === reviewId ? { ...review, status } : review)));
  }

  const enemiesByCell = useMemo(() => {
    const map = new Map<number, Enemy[]>();
    enemies.forEach((enemy) => {
      const cell = getEnemyCell(enemy, selectedBattleMap.pathCells);
      map.set(cell, [...(map.get(cell) ?? []), enemy]);
    });
    return map;
  }, [enemies, selectedBattleMap.pathCells]);
  const towersByCell = useMemo(() => {
    const map = new Map<number, Tower>();
    towers.forEach((tower) => map.set(tower.cell, tower));
    return map;
  }, [towers]);
  const activeTowersByTargetCell = useMemo(() => {
    const map = new Map<number, Tower>();
    towers.forEach((tower) => {
      if (tower.lastTargetCell !== null && tower.attackCount > 0) {
        map.set(tower.lastTargetCell, tower);
      }
    });
    return map;
  }, [towers]);
  const renderNow = Date.now();

  useEffect(() => {
    let cancelled = false;

    async function loadRetentionProfile() {
      const savedName = readSavedPlayerName();

      if (!userId || !supabase) {
        setRetentionLoading(false);
        setRetentionProfile(refreshRetentionForToday({ ...emptyRetentionProfile, display_name: userEmail || 'Гость' }));
        if (savedName) {
          setPlayerName(savedName);
        }
        return;
      }

      setRetentionLoading(true);
      const fallbackName = playerName.trim() || savedName || userEmail || 'Игрок';
      const { data } = await supabase
        .from('retention_profiles')
        .select('user_id, display_name, xp, streak_days, last_check_in_date, best_wave, total_kills, daily_challenge_date, daily_kills, daily_waves, daily_completed, weekly_challenge_date, weekly_kills, weekly_waves, weekly_completed, monthly_challenge_date, monthly_kills, monthly_waves, monthly_completed, completed_level_ids, achievement_stats')
        .eq('user_id', userId)
        .maybeSingle();

      if (cancelled) return;

      const profile = normalizeRetentionProfile(data, fallbackName);
      const profileWithSavedName =
        savedName && (!data?.display_name || data.display_name === 'Игрок')
          ? { ...profile, display_name: savedName }
          : profile;
      previousXpRef.current = profileWithSavedName.xp;
      setRetentionProfile(profileWithSavedName);
      setCompletedLevelIds(profileWithSavedName.completed_level_ids);
      setAchievementStats(profileWithSavedName.achievement_stats);
      if (profileWithSavedName.display_name.trim()) {
        setPlayerName(profileWithSavedName.display_name);
        savePlayerName(profileWithSavedName.display_name);
      }
      setRetentionLoading(false);
      await supabase.from('retention_profiles').upsert(buildRetentionPayload(profileWithSavedName));
      await refreshLeaderboard();
    }

    void loadRetentionProfile();

    return () => {
      cancelled = true;
    };
  }, [userId, userEmail]);

  useEffect(() => {
    return () => {
      windowTransitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      stopBackgroundMusic(backgroundMusicRef.current);
      backgroundMusicRef.current = null;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(languageStorageKey, language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem(soundEnabledStorageKey, String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    window.localStorage.setItem(musicEnabledStorageKey, String(musicEnabled));
    if (!musicEnabled) {
      stopBackgroundMusic(backgroundMusicRef.current);
      backgroundMusicRef.current = null;
    }
  }, [musicEnabled]);

  useEffect(() => {
    window.localStorage.setItem(performanceModeStorageKey, String(performanceMode));
  }, [performanceMode]);

  useEffect(() => {
    const previousXp = previousXpRef.current;

    if (retentionProfile.xp > previousXp) {
      const previousLevel = getLevelFromXp(previousXp);
      const nextLevel = getLevelFromXp(retentionProfile.xp);

      setExperienceFlash({
        id: Date.now(),
        gainedXp: retentionProfile.xp - previousXp,
        level: nextLevel,
        leveledUp: nextLevel > previousLevel,
      });
    }

    previousXpRef.current = retentionProfile.xp;
  }, [retentionProfile.xp]);

  useEffect(() => {
    if (!experienceFlash) return;

    const timer = window.setTimeout(() => {
      setExperienceFlash((current) => (current?.id === experienceFlash.id ? null : current));
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [experienceFlash]);

  useEffect(() => {
    if (menuIdleTimerRef.current) {
      window.clearInterval(menuIdleTimerRef.current);
      menuIdleTimerRef.current = null;
    }

    if (screen !== 'start' || !backgroundMusicRef.current) return;

    const timer = window.setInterval(() => {
      playSound('menuIdle');
    }, 6400);

    menuIdleTimerRef.current = timer;
    return () => {
      window.clearInterval(timer);
      if (menuIdleTimerRef.current === timer) {
        menuIdleTimerRef.current = null;
      }
    };
  }, [screen]);

  function clearWindowTransitionTimers() {
    windowTransitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    windowTransitionTimersRef.current = [];
  }

  function openScreenWithTransition(nextScreen: GameScreen) {
    if (nextScreen === 'transition' || screen === nextScreen) {
      setScreen(nextScreen);
      return;
    }

    clearWindowTransitionTimers();
    playSound('screenTransition');
    setScreen('transition');

    const openTimer = window.setTimeout(() => {
      setScreen(nextScreen);
    }, 900);

    windowTransitionTimersRef.current = [openTimer];
  }

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
    if (screen !== 'settings') return;

    void refreshReviews();
  }, [isReviewAdmin, screen, userId]);

  useEffect(() => {
    if (screen !== 'settings' || settingsFocus !== 'reviews') return;

    const timer = window.setTimeout(() => {
      reviewPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [screen, settingsFocus]);

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
        if (!isTimeLoopMode && wave >= selectedMaxWaves) {
          setIsVictory(true);
          setMessage(`Победа! Ты удержал линию времени все ${selectedMaxWaves} волн.`);
          return 0;
        }

        setMessage(`Время волны ${wave} закончилось. Готовься к следующей.`);
        const refund = getLandscapeRefund(towers);
        setTowers([]);
        setSelectedTowerId(null);
        setWave((currentWave) => (isTimeLoopMode ? currentWave + 1 : Math.min(selectedMaxWaves, currentWave + 1)));
        setEraIndex((currentEra) => (currentEra + 1) % eras.length);
        if (isTimeLoopMode) {
          setSelectedLevelId((currentLevelId) => (currentLevelId % levelMap.length) + 1);
          setSelectedEraMissionId((currentMissionId) => (currentMissionId % 5) + 1);
        }
        setCoins((currentCoins) => currentCoins + 20 + refund);
        setMessage(`Ландшафт изменился. Башни разобраны, возвращено ${refund} монет.`);
        return 0;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isTimeLoopMode, isWaveRunning, selectedMaxWaves, towers, wave]);

  useEffect(() => {
    if (!isWaveRunning) return;

    let spawned = 0;
      const regularEnemies = 5 + Math.ceil(wave * 1.45) + selectedDifficultyData.extraEnemies;
      const spawnTimer = window.setInterval(() => {
        spawned += 1;
        const boss = hasFinalBossInCurrentWave && spawned > regularEnemies;
        const servant = hasBossServantInCurrentWave && spawned > regularEnemies;
        const now = Date.now();
        const kindId = boss || servant ? bossEnemyKindId : chooseEnemyKind(wave, spawned);
        const groupSize = !boss && !servant && kindId === 'sandPincers' ? 5 : 1;
        const servantProgress = Math.min(1, wave / selectedMaxWaves);
        const spawnedEnemies = Array.from({ length: groupSize }, (_, index) =>
          boss
            ? createBossEnemy(wave, selectedDifficultyData, now + spawned + index, now)
            : servant
              ? createBossServantEnemy(wave, selectedDifficultyData, now + spawned + index, now, servantProgress)
            : createEnemy(kindId, wave, selectedDifficultyData, now + spawned + index, now),
        );

      playSound(boss || servant ? 'bossSpawn' : 'enemySpawn');
      setSpawnedCount((current) => current + spawnedEnemies.length);
      setEnemies((current) => [...current, ...spawnedEnemies]);

      if (spawned >= regularEnemies + (hasFinalBossInCurrentWave || hasBossServantInCurrentWave ? 1 : 0)) {
        window.clearInterval(spawnTimer);
      }
    }, 780);

    return () => window.clearInterval(spawnTimer);
  }, [difficulty, gameMode, hasBossServantInCurrentWave, hasFinalBossInCurrentWave, isWaveRunning, selectedDifficultyData.extraEnemies, selectedDifficultyData.hpMultiplier, selectedMaxWaves, wave]);

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

          if (enemy.isBossServant && now - enemy.lastAbilityAt >= 10500) {
            const abilityIndex = Math.floor((now - enemy.createdAt) / 10500) % 2;
            nextEnemy = {
              ...nextEnemy,
              hp: abilityIndex === 0 ? Math.min(nextEnemy.maxHp, nextEnemy.hp + Math.round(nextEnemy.maxHp * 0.08)) : nextEnemy.hp,
              speedBoostUntil: abilityIndex === 1 ? now + 1800 : nextEnemy.speedBoostUntil,
              towerSlowUntil: abilityIndex === 0 ? now + 1200 : nextEnemy.towerSlowUntil,
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

          if (stats.id === 'forge' || stats.id === 'beacon') {
            return tower;
          }

          const target = chooseTowerTarget(tower, nextEnemies, stats.range, selectedBattleMap.pathCells);

          if (!target) return tower;

          const nextAttackCount = tower.attackCount + 1;
          const splashTargets = getTowerSplashTargets(tower, target, nextEnemies, selectedBattleMap.pathCells);
          const splashTargetIds = new Set(splashTargets.map((enemy) => enemy.id));
          playSound(
            stats.id === 'arrow'
              ? 'arrowHit'
              : stats.id === 'hourglass' || stats.id === 'gravity' || stats.id === 'singularity'
                ? 'slowHit'
                : 'blastHit',
          );
          nextEnemies = nextEnemies.map((enemy) => {
            if (!splashTargetIds.has(enemy.id)) return enemy;
            const isImmune = isEnemyInvulnerable(enemy, now) && stats.id !== 'beacon';
            const splashMultiplier =
              enemy.id === target.id
                ? 1
                : stats.id === 'sun'
                  ? 0.48
                  : stats.id === 'mirror'
                    ? 0.5
                    : stats.id === 'singularity'
                      ? 0.42
                      : stats.id === 'paradox'
                        ? 0.72
                        : 0.68;
            const baseDamage =
              stats.id === 'mirror'
                ? getMirrorCopiedDamage(tower, towers)
                : stats.id === 'blast' && enemy.isBoss
                  ? Math.round(stats.damage * 1.3)
                  : stats.id === 'paradox' && enemy.isBoss
                    ? Math.round(stats.damage * (1.15 + tower.level * 0.08))
                  : stats.damage;
            const boostedDamage = Math.round(baseDamage * getTowerDamageMultiplier(tower, towers));
            const rawDamage = Math.round(boostedDamage * splashMultiplier);
            const damage = isImmune ? 0 : getDamageAfterResistance(enemy, stats.id, rawDamage);
            const paradoxExecuteThreshold = 0.16 + tower.level * 0.03;
            const canParadoxExecute =
              stats.id === 'paradox' &&
              !enemy.isBoss &&
              !isImmune &&
              enemy.hp / enemy.maxHp <= paradoxExecuteThreshold &&
              damage > 0;
            const finalDamage = canParadoxExecute ? enemy.hp : damage;
            const scoutSlow = stats.id === 'arrow' && nextAttackCount % 5 === 0;
            const canSlow = (scoutSlow || stats.id === 'hourglass' || stats.id === 'rift' || stats.id === 'gravity' || stats.id === 'singularity') && !isImmune;
            const ignoresSlow = canSlow && enemy.kind === 'brokenCourier' && !enemy.ignoredFirstSlow;
            const slowDuration =
              scoutSlow
                ? 2000
                : stats.id === 'hourglass'
                ? 2100 + tower.level * 320
                : stats.id === 'gravity'
                  ? 1800 + tower.level * 280
                  : stats.id === 'singularity'
                    ? 2600 + tower.level * 360
                  : 1700 + tower.level * 260;
            const slowUntil = canSlow && !ignoresSlow ? now + slowDuration : enemy.slowedUntil;
            const gravityUntil =
              (stats.id === 'gravity' || stats.id === 'singularity') && !isImmune && !ignoresSlow
                ? now + (stats.id === 'singularity' ? 2400 + tower.level * 340 : 1900 + tower.level * 300)
                : enemy.gravityUntil;
            return {
              ...enemy,
              hp: enemy.hp - finalDamage,
              slowedUntil: scoutSlow ? enemy.slowedUntil : slowUntil,
              lightSlowUntil: scoutSlow && !ignoresSlow ? now + slowDuration : enemy.lightSlowUntil,
              stoppedUntil:
                (stats.id === 'rift' || (stats.id === 'singularity' && !enemy.isBoss)) && !isImmune && !ignoresSlow
                  ? now + (stats.id === 'singularity' ? 520 + tower.level * 120 : 360 + tower.level * 140)
                  : enemy.stoppedUntil,
              gravityUntil,
              ignoredFirstSlow: enemy.ignoredFirstSlow || ignoresSlow,
              lastHitAt: now,
              lastHitKind: stats.id,
              lastDamage: finalDamage,
            };
          });

          return {
            ...tower,
            lastShotAt: now,
            attackCount: nextAttackCount,
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
            escapedDamage += enemy.isBoss ? baseHp : enemy.isBossServant ? Math.max(8, Math.ceil(enemy.hp / 24)) : Math.max(1, Math.ceil(enemy.hp / 35));
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
          if (!isTimeLoopMode && wave >= selectedMaxWaves) {
            setIsVictory(true);
            setMessage('Победа! Ты отбил финальную волну и спас портал времени.');
            setCoins((current) => current + 80 + coinsEarned);
            return aliveEnemies;
          }

          setMessage(`Волна ${wave} отбита. Время двигается дальше.`);
          const refund = getLandscapeRefund(towers);
          nextTowers = [];
          setSelectedTowerId(null);
          setWave((current) => (isTimeLoopMode ? current + 1 : Math.min(selectedMaxWaves, current + 1)));
          setEraIndex((current) => (current + 1) % eras.length);
          if (isTimeLoopMode) {
            setSelectedLevelId((currentLevelId) => (currentLevelId % levelMap.length) + 1);
            setSelectedEraMissionId((currentMissionId) => (currentMissionId % 5) + 1);
          }
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
        const gainedXp = defeatedCount * 2 + completedWaveCount * (30 + getArchiveXpBonus(towers)) + defeatedBosses * 220;

        setBattleSummary((current) => ({
          kills: current.kills + defeatedCount,
          bosses: current.bosses + defeatedBosses,
          waves: current.waves + completedWaveCount,
          xp: current.xp + gainedXp,
        }));
        setAchievementStats((current) => ({
          ...current,
          totalKills: current.totalKills + defeatedCount,
          bossesDefeated: current.bossesDefeated + defeatedBosses,
          wavesCompleted: current.wavesCompleted + completedWaveCount,
        }));
        updateRetentionProfile((current) => ({
          ...current,
          xp: current.xp + gainedXp,
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
  }, [baseHp, enemiesInCurrentWave, isTimeLoopMode, isWaveRunning, practiceTutorialActive, selectedBattleMap.pathCells, selectedMaxWaves, spawnedCount, towers, tutorialStep, wave]);

  useEffect(() => {
    if (!isTimeLoopMode || !isWaveRunning || screen !== 'battle') return;

    const eraShiftTimer = window.setInterval(() => {
      setEraIndex((currentEra) => (currentEra + 1) % eras.length);
      setMessage(`Петля времени меняет эпоху прямо во время боя. Волна ${wave} продолжается.`);
    }, endlessEraShiftSeconds * 1000);

    return () => window.clearInterval(eraShiftTimer);
  }, [isTimeLoopMode, isWaveRunning, screen, wave]);

  useEffect(() => {
    if (screen !== 'battle' || baseHp === 0 || isVictory) return;

    const beaconTimer = window.setInterval(() => {
      const beaconIncome = towers
        .filter((tower) => tower.kind === 'beacon')
        .reduce((total, tower) => total + 8 + tower.level * 5, 0);

      if (beaconIncome <= 0) return;

      setCoins((current) => current + beaconIncome);
      setMessage(`Маяк памяти принес ${beaconIncome} монет из прошлых эпох.`);
    }, 20000);

    return () => window.clearInterval(beaconTimer);
  }, [baseHp, isVictory, screen, towers]);

  useEffect(() => {
    window.localStorage.setItem(levelMapStorageKey, JSON.stringify(completedLevelIds));
    setRetentionProfile((current) => ({ ...current, completed_level_ids: completedLevelIds }));
  }, [completedLevelIds]);

  useEffect(() => {
    window.localStorage.setItem(achievementStatsStorageKey, JSON.stringify(achievementStats));
    setRetentionProfile((current) => ({ ...current, achievement_stats: achievementStats }));
  }, [achievementStats]);

  useEffect(() => {
    if (!isVictory) return;

    setVictoryDurationSeconds((current) =>
      current > 0 ? current : gameStartedAt ? Math.max(1, Math.floor((Date.now() - gameStartedAt) / 1000)) : 0,
    );
    setCompletedLevelIds((current) =>
      current.includes(selectedProgressLevelId) ? current : [...current, selectedProgressLevelId],
    );
    setAchievementStats((current) => ({
      ...current,
      hardVictories: current.hardVictories + (difficulty === 'hard' ? 1 : 0),
      antiTimeVictories: current.antiTimeVictories + (difficulty === 'antiTime' ? 1 : 0),
      noDamageVictories: current.noDamageVictories + (runChallengeRef.current.tookDamage ? 0 : 1),
      noSkipVictories: current.noSkipVictories + (runChallengeRef.current.skippedWave ? 0 : 1),
    }));
  }, [difficulty, gameStartedAt, isVictory, selectedProgressLevelId]);

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
    savePlayerName(cleanName);
    setPlayerAge(String(age));
    activateAudio();
    updateRetentionProfile((current) => ({ ...current, display_name: cleanName }));
    setProfileError('');
    openScreenWithTransition(tutorialSeen ? 'start' : 'tutorial');
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
    savePlayerName(cleanName);
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
    openScreenWithTransition(nextScreen);
  }

  function openSettings(nextFocus: SettingsFocus = 'top') {
    setSettingsFocus(nextFocus);
    openScreenWithTransition('settings');
  }

  function enterGameFromWelcome() {
    if (welcomeExiting) return;

    activateAudio();
    setWelcomeExiting(true);

    const nextScreen: GameScreen = tutorialSeen ? 'start' : 'tutorial';
    const fadeTimer = window.setTimeout(() => {
      setScreen('transition');
    }, 620);
    const openTimer = window.setTimeout(() => {
      setWelcomeExiting(false);
      setScreen(nextScreen);
    }, 1780);

    windowTransitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    windowTransitionTimersRef.current = [fadeTimer, openTimer];
  }

  function startPracticeTutorial() {
    const firstLevel = levelMap[0];
    const easyMode = difficultyModes[0];

    activateAudio();
    setSelectedLevelId(firstLevel.id);
    setDifficulty(easyMode.id);
    resetGame(easyMode, firstLevel.startWave);
    setTowerSlots(starterTowerSlots);
    setSelectedTower('arrow');
    setPracticeTutorialActive(true);
    setTutorialStep('selectTower');
    openScreenWithTransition('battle');
    setGameStartedAt(Date.now());
    setDefeatDurationSeconds(0);
    setMessage('Обучение началось: выбери первую башню в панели слева.');
    setCommentatorMessage('Комментатор: начнем с практики. Слева выбери башню, потом поставь ее на подсвеченную платформу.');
  }

  function startDemoBattle() {
    const demoLevel = levelMap[0];
    const demoMission = eraMissionCatalog[demoLevel.mapArea][0];
    const demoDifficulty = difficultyModes[0];

    activateAudio();
    setGameMode('campaign');
    setSelectedLevelId(demoLevel.id);
    setSelectedEraMissionId(demoMission.id);
    setDifficulty(demoDifficulty.id);
    resetGame(demoDifficulty, demoLevel.startWave, 'campaign');
    setTowerSlots(starterTowerSlots);
    setUnlockedTowerIds(freeTowerIds);
    setSelectedTower('arrow');
    setPracticeTutorialActive(false);
    setTutorialStep('selectTower');
    openScreenWithTransition('battle');
    setGameStartedAt(Date.now());
    setDefeatDurationSeconds(0);
    setCommentatorMessage('');
    setMessage('Демо-бой готов: поставь стрелковую башню на платформу и запусти волну.');
  }

  function addTowerToSlot(kind: TowerKind['id']) {
    if (!isTowerUnlockedByChallenge(kind, achievementStats, completedLevelIds.length)) {
      setMessage(getTowerUnlockText(kind));
      return;
    }

    if (!unlockedTowerSet.has(kind)) {
      const marketPrice = towerMarketPrices[kind];

      if (coins < marketPrice) {
        setMessage(`Для покупки ${getTowerKind(kind).name} нужно ${marketPrice} монет.`);
        return;
      }

      setCoins((current) => current - marketPrice);
      setUnlockedTowerIds((current) => (current.includes(kind) ? current : [...current, kind]));
      setMessage(`${getTowerKind(kind).name} куплен на рынке за ${marketPrice} монет.`);
    }

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

    const isHighlandCell = selectedBattleMap.highlandCells.includes(cell);
    if (!isBuildableCell(cell, selectedBattleMap.buildCells)) return;
    if (!isSelectedTowerEquipped) {
      setMessage('Сначала добавь башню в один из 6 слотов.');
      return;
    }

    if (selectedTowerData.elevatedOnly && !isHighlandCell) {
      setMessage(`${selectedTowerData.name} ставится только на возвышенности.`);
      return;
    }

    if (!selectedTowerData.elevatedOnly && isHighlandCell) {
      setMessage('Эта возвышенность только для дальнобойных башен: Временного снайпера и Солнечного обелиска.');
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

    const cost = getDiscountedUpgradeCost(tower, towers);
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

  function resetGame(mode: Difficulty, startWaveNumber = selectedMissionStartWave, nextGameMode = gameMode) {
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
    setWaveTimeLeft(getWaveDuration(startWaveNumber, nextGameMode, mode.maxWaves));
    setCommentatorMessage('');
    runChallengeRef.current = { tookDamage: false, skippedWave: false };
    setGameStartedAt(null);
    setDefeatDurationSeconds(0);
    setVictoryDurationSeconds(0);
    setBattleSummary({ kills: 0, bosses: 0, waves: 0, xp: 0 });
  }

  function selectDifficulty(mode: Difficulty) {
    if (isWaveRunning) return;
    const modeStartWave = isTimeLoopMode ? 1 : Math.min(mode.maxWaves, selectedLevel.startWave + selectedEraMission.startWaveOffset);
    setDifficulty(mode.id);
    resetGame(mode, modeStartWave, gameMode);
    setTowerSlots(starterTowerSlots);
    setUnlockedTowerIds(freeTowerIds);
    setSelectedTower('arrow');
    openScreenWithTransition('loadout');
    setMessage(`${selectedLevel.title}. Карта: ${selectedBattleMap.name}. ${mode.name}: собери набор башен перед входом в бой.`);
  }

  function beginBattleAfterLoadout() {
    if (!isLoadoutReady) {
      setMessage(`Выбери минимум ${Math.min(requiredLoadoutSize, availableTowerKinds.length)} башни в Бестиарии.`);
      return;
    }

    openScreenWithTransition('battle');
    setGameStartedAt(Date.now());
    setDefeatDurationSeconds(0);
    setCommentatorMessage('');
    setMessage(
      isTimeLoopMode
        ? 'Петля времени началась: эпохи будут меняться во время боя, а волны не закончатся сами.'
        : `${selectedLevel.title}. Карта: ${selectedBattleMap.name}. ${selectedDifficultyData.name}: расставь башни и запускай волну.`,
    );
  }

  function startTimeLoopMode() {
    if (isWaveRunning) return;

    activateAudio();
    setGameMode('timeLoop');
    setSelectedLevelId(1);
    setSelectedEraMissionId(1);
    resetGame(selectedDifficultyData, 1, 'timeLoop');
    setTowerSlots(starterTowerSlots);
    setUnlockedTowerIds(freeTowerIds);
    setSelectedTower('arrow');
    openScreenWithTransition('loadout');
    setCommentatorMessage('');
    setMessage('Петля времени: собери набор башен. После старта эпохи будут прыгать прямо во время боя.');
  }

  function selectLevel(level: LevelMapItem) {
    if (isWaveRunning) return;

    activateAudio();
    setGameMode('campaign');
    setSelectedLevelId(level.id);
    setSelectedEraMissionId(1);
    openScreenWithTransition('epochLevels');
    setCommentatorMessage('');
    setMessage(`${getLevelUiText(level, language).mapTitle}: ${eraMissionCatalog[level.mapArea].length} levels available.`);
  }

  function selectEraMission(mission: EraMission) {
    if (isWaveRunning) return;

    activateAudio();
    setSelectedEraMissionId(mission.id);
    openScreenWithTransition('difficulty');
    setCommentatorMessage('');
    setMessage(`${mission.title[language]}: ${mission.description[language]}`);
  }

  async function requestWaveCommentary(waveNumber: number, eraName: string, difficultyData: Difficulty, finalBossAllowed: boolean) {
    const requestId = commentatorRequestRef.current + 1;
    commentatorRequestRef.current = requestId;

    const finalBossWave = isBossWave(waveNumber, gameMode, difficultyData.maxWaves, finalBossAllowed);
    const servantWave = isBossServantWave(waveNumber, gameMode, difficultyData.maxWaves, finalBossAllowed);
    const fallback = getFallbackWaveCommentary(waveNumber, finalBossWave, servantWave);
    setCommentatorMessage('Комментатор: анализирую искажения волны...');

    if (!supabase) {
      setCommentatorMessage(fallback);
      return;
    }

    const threatDescriptions = getWaveThreatDescriptions(waveNumber, difficultyData, gameMode);
    const prompt = [
      `Волна: ${waveNumber}.`,
      `Эпоха: ${eraName}.`,
      `Сложность: ${difficultyData.name}.`,
      finalBossWave ? 'Это настоящий финальный босс сложности.' : '',
      servantWave ? 'Это не финальный босс, а сильный служащий босса.' : '',
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
    if (isWaveRunning || baseHp === 0 || isVictory || (!isTimeLoopMode && wave > selectedMaxWaves)) return;
    activateAudio();
    if (practiceTutorialActive && tutorialStep !== 'startWave') {
      setMessage('Сначала поставь башню на подсвеченную платформу.');
      setCommentatorMessage('Комментатор: без башни волна пройдет к базе. Нажми на желтую платформу рядом с дорогой.');
      return;
    }

    if (!isLoadoutReady) {
      openScreenWithTransition('loadout');
      setMessage(`Сначала собери набор: минимум ${Math.min(requiredLoadoutSize, availableTowerKinds.length)} башни.`);
      return;
    }
    setSelectedTowerId(null);
    setEnemies([]);
    setSpawnedCount(0);
    setWaveTimeLeft(getWaveDuration(wave, gameMode, selectedMaxWaves));
    playSound('waveStart');
    setIsWaveRunning(true);
    setBattleSummary((current) => ({ ...current, xp: current.xp + 3 }));
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

    void requestWaveCommentary(wave, era.name, selectedDifficultyData, isTimeLoopMode || isFinalCampaignMission);
    setMessage(
      hasFinalBossInCurrentWave
        ? `Волна ${wave}: временной босс идет через ${era.name.toLowerCase()}. Режим: ${selectedDifficultyData.name}.`
        : hasBossServantInCurrentWave
          ? `Волна ${wave}: служащий финального босса идет через ${era.name.toLowerCase()}. Чем ближе финал, тем он сильнее.`
        : `Волна ${wave} идет через ${era.name.toLowerCase()}. Режим: ${selectedDifficultyData.name}.`,
    );
  }

  function skipWave() {
    if (!canSkipWave) return;

    runChallengeRef.current.skippedWave = true;
    const nextWave = wave + 1;
    if (!isTimeLoopMode && nextWave > selectedMaxWaves) {
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
    if (isTimeLoopMode) {
      setSelectedLevelId((currentLevelId) => (currentLevelId % levelMap.length) + 1);
      setSelectedEraMissionId((currentMissionId) => (currentMissionId % 5) + 1);
    }
    setWaveTimeLeft(getWaveDuration(nextWave, gameMode, selectedMaxWaves));
    setCoins((current) => current + 10 + refund);
    setMessage(`Ландшафт изменился. Башни разобраны, возвращено ${refund} монет.`);
    setMessage(`Волна пропущена. Сразу идет волна ${nextWave}.`);
  }

  function restartGame() {
    resetGame(selectedDifficultyData, selectedMissionStartWave, gameMode);
    setGameStartedAt(Date.now());
    setMessage(isTimeLoopMode ? 'Петля времени перезапущена. Поставь башни и запускай бесконечные волны.' : 'Поставь башни и запусти волну.');
  }

  function returnToMainMenu() {
    resetGame(selectedDifficultyData, selectedMissionStartWave, gameMode);
    setSelectedTowerId(null);
    openScreenWithTransition('start');
    setMessage('Поставь башни и запусти первую волну.');
  }

  function goToNextLevel() {
    resetGame(selectedDifficultyData, selectedMissionStartWave, gameMode);
    setSelectedTowerId(null);

    const nextMission = selectedEraMissions.find((mission) => mission.id > selectedEraMission.id);
    if (nextMission) {
      setSelectedEraMissionId(nextMission.id);
      openScreenWithTransition('difficulty');
      return;
    }

    const nextLevel = levelMap.find((level) => level.id > selectedLevel.id);
    if (nextLevel) {
      setSelectedLevelId(nextLevel.id);
      setSelectedEraMissionId(1);
      openScreenWithTransition('epochLevels');
      return;
    }

    openScreenWithTransition('start');
  }

  function startCameraDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const tile = event.target instanceof HTMLElement ? event.target.closest<HTMLButtonElement>('.tile') : null;

    if (tile?.dataset.buildCell === 'true') {
      cameraDragRef.current = { ...cameraDragRef.current, active: false, hasMoved: false };
      return;
    }

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

    event.preventDefault();
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
        label: t.daily,
        challenge: dailyChallenge,
        progress: dailyProgress,
        progressPercent: dailyProgressPercent,
        isCompleted: retentionProfile.daily_completed,
      },
      {
        label: t.weekly,
        challenge: weeklyChallenge,
        progress: weeklyProgress,
        progressPercent: weeklyProgressPercent,
        isCompleted: retentionProfile.weekly_completed,
      },
      {
        label: t.month,
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
            <strong>{t.defenderProgress}</strong>
            <span>{userId ? t.savedOnline : t.signInToSave}</span>
          </div>
          <em>{retentionLoading ? '...' : <>{retentionProfile.streak_days} {t.dayStreakShort}</>}</em>
        </div>

        <div className="retention-grid">
          <div className="retention-stat">
            <span>{t.level}</span>
            <strong>{retentionLevel}</strong>
            <small>{retentionProfile.xp} XP</small>
          </div>
          <div className="retention-stat">
            <span>{t.bestWave}</span>
            <strong>{retentionProfile.best_wave}</strong>
            <small>{retentionProfile.total_kills} {t.wins}</small>
          </div>
          <div className="retention-stat">
            <span>{t.streak}</span>
            <strong>{retentionProfile.streak_days}</strong>
            <small>{t.daysInRow}</small>
          </div>
        </div>

        <ExperienceStats
          level={retentionLevel}
          xp={retentionProfile.xp}
          currentLevelXp={currentLevelXp}
          nextLevelXp={nextLevelXp}
          progressPercent={levelProgressPercent}
          xpToNextText={fillText(t.xpToNext, { level: retentionLevel + 1, xp: Math.max(0, nextLevelXp - retentionProfile.xp) })}
          levelLabel={t.level}
          flash={experienceFlash}
        />

        <div className="challenge-list">
          {timedChallenges.map((item) => {
            const challengeText = getChallengeUiText(item.challenge, language);

            return (
              <div className="challenge-item" key={item.label}>
                <div className="daily-challenge">
                  <div>
                    <strong>{item.label}: {challengeText.title}</strong>
                    <span>{challengeText.description} {t.reward}: {item.challenge.rewardXp} XP.</span>
                  </div>
                  <small>{item.isCompleted ? t.done : `${item.progress}/${item.challenge.goal}`}</small>
                </div>
                <div className="daily-track" aria-label={`${item.label} ${item.progressPercent}%`}>
                  <span style={{ width: `${Math.max(3, Math.min(100, item.progressPercent))}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {!isProfileVariant && (
          <div className="leaderboard-mini">
            <strong>{t.leaders}</strong>
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
    <section
      className={[
        'game-shell',
        screen === 'battle' && baseHp === 0 ? 'defeat-state' : '',
        performanceMode ? 'performance-mode' : '',
      ].join(' ')}
      style={{ '--era': era.accent } as CSSProperties}
      onPointerOver={handleUiPointerOver}
      onClickCapture={handleUiClick}
    >
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
      {screen !== 'welcome' && screen !== 'transition' && (
      <div className="game-top">
        <div>
          <p className="hello">{t.player}: {playerLabel}</p>
          <p className="era-line">
            {screen === 'battle' ? `${era.name} - ${era.year}` : selectedLevelUi.title}
          </p>
        </div>
        {screen === 'battle' && (
          <span className="difficulty-badge">{selectedDifficultyData.name}</span>
        )}
      </div>
      )}

      {screen === 'battle' && baseHp === 0 && (
        <div className="retry-panel">
          <span>{t.baseHpEnded}</span>
          <button className="secondary" type="button" onClick={restartGame}>
            {t.retry}
          </button>
        </div>
      )}

      {screen === 'battle' && (
        <div className="phone-orientation-tip" role="status">
          {getPhoneOrientationHint(language)}
        </div>
      )}

      {screen === 'welcome' && (
        <LanguageStartScreen
          language={language}
          isExiting={welcomeExiting}
          onLanguageChange={changeLanguage}
          onStart={enterGameFromWelcome}
        />
      )}

      {screen === 'transition' && <WindowTransitionSplash language={language} />}

      {screen === 'profile' && (
        <section className="profile-screen">
          <span className="broken-clock screen-clock profile-clock" aria-hidden="true" />
          <span className="time-crack screen-crack profile-crack" aria-hidden="true" />
          <div className="screen-heading">
            <h3>{t.profileTitle}</h3>
            <p>{t.profileSubtitle}</p>
          </div>
          {renderRetentionPanel('profile')}
          <form className="player-form" onSubmit={submitPlayerProfile}>
            <label>
              {t.name}
              <input
                type="text"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder={t.namePlaceholder}
                autoComplete="given-name"
                minLength={3}
                maxLength={21}
              />
            </label>
            <label>
              {t.age}
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
            <button type="submit">{t.start}</button>
          </form>
        </section>
      )}

      {screen === 'tutorial' && (
        <section className="tutorial-screen">
          <span className="broken-clock screen-clock tutorial-clock" aria-hidden="true" />
          <span className="time-crack screen-crack tutorial-crack" aria-hidden="true" />
          <div className="screen-heading">
            <h3>{t.tutorialTitle}</h3>
            <p>{t.tutorialSubtitle}</p>
          </div>
          <div className="tutorial-grid">
            <article className="tutorial-card">
              <span>1</span>
              <strong>{t.tutorialStepOneTitle}</strong>
              <p>{t.tutorialStepOneText}</p>
            </article>
            <article className="tutorial-card">
              <span>2</span>
              <strong>{t.tutorialStepTwoTitle}</strong>
              <p>{fillText(t.tutorialStepTwoText, { count: Math.min(requiredLoadoutSize, availableTowerKinds.length) })}</p>
            </article>
            <article className="tutorial-card">
              <span>3</span>
              <strong>{t.tutorialStepThreeTitle}</strong>
              <p>{t.tutorialStepThreeText}</p>
            </article>
            <article className="tutorial-card">
              <span>4</span>
              <strong>{t.tutorialStepFourTitle}</strong>
              <p>{t.tutorialStepFourText}</p>
            </article>
          </div>
          <div className="tutorial-actions">
            <button type="button" onClick={startPracticeTutorial}>
              {t.startPractice}
            </button>
            <button className="secondary" type="button" onClick={() => closeTutorial('start')}>
              {t.skip}
            </button>
          </div>
        </section>
      )}

      {screen === 'start' && (
        <section className="menu-screen">
          <span className="broken-clock screen-clock menu-clock" aria-hidden="true" />
          <span className="time-crack screen-crack menu-crack" aria-hidden="true" />
          <div>
            <h3>{t.startTitle}</h3>
            <p>{t.startSubtitle}</p>
            <span className="release-badge">{finalReleaseVersion} · {finalText.releaseBadge}</span>
            <div className="name-editor">
              {!isEditingName ? (
                <button className="secondary" type="button" onClick={openNameEditor}>
                  {t.editName}
                </button>
              ) : (
                <form onSubmit={submitNameChange}>
                  <input
                    type="text"
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                    placeholder={t.playerName}
                    autoComplete="given-name"
                    minLength={3}
                    maxLength={21}
                  />
                  <button type="submit">{t.save}</button>
                  <button className="ghost" type="button" onClick={() => {
                    setIsEditingName(false);
                    setProfileError('');
                  }}>
                    {t.cancel}
                  </button>
                </form>
              )}
              {profileError && <p className="form-error">{profileError}</p>}
            </div>
            <div className="language-picker" aria-label={t.language}>
              {languageOptions.map((option) => (
                <button
                  className={option.code === language ? 'active' : ''}
                  type="button"
                  key={option.code}
                  onClick={() => changeLanguage(option.code)}
                  aria-pressed={option.code === language}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {renderRetentionPanel('main')}
          </div>
          <div className="menu-actions">
            <button type="button" onClick={() => {
              activateAudio();
              setGameMode('campaign');
              openScreenWithTransition('levels');
            }}>
              {t.start}
            </button>
            <button className="secondary" type="button" onClick={startDemoBattle}>
              {finalText.demoBattle}
            </button>
            <button className="secondary time-loop-button" type="button" onClick={startTimeLoopMode}>
              Петля времени
            </button>
            <button className="secondary" type="button" onClick={() => openScreenWithTransition('achievements')}>
              {t.achievements} {completedAchievements}/{achievements.length}
            </button>
            <button className="secondary" type="button" onClick={() => openSettings()}>
              {t.settings}
            </button>
            <button className="secondary" type="button" onClick={() => openSettings('reviews')}>
              {finalText.leaveReview}
            </button>
            <button className="secondary" type="button" onClick={() => openScreenWithTransition('tutorial')}>
              {t.tutorial}
            </button>
          </div>
        </section>
      )}

      {screen === 'achievements' && (
        <section className="achievement-screen">
          <span className="broken-clock screen-clock achievement-clock" aria-hidden="true" />
          <span className="time-shard achievement-shard" aria-hidden="true" />
          <div className="screen-heading">
            <h3>{t.achievementsTitle}</h3>
            <p>{t.achievementsSubtitle}</p>
          </div>
          <div className="achievement-summary">
            <strong>{completedAchievements}/{achievements.length}</strong>
            <span>{t.earned}</span>
          </div>
          <div className="achievement-list">
            {achievements.map((achievement) => {
              const progress = getAchievementProgress(achievement, achievementStats, completedLevelIds.length);
              const isUnlocked = progress >= achievement.goal;
              const progressPercent = Math.round((progress / achievement.goal) * 100);
              const isHardtry = achievement.id.startsWith('hardtry-');
              const achievementUi = getAchievementUiText(achievement, language);

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
                    <strong>{achievementUi.title}</strong>
                    <p>{achievementUi.description}</p>
                    <div className="achievement-progress" aria-label={`${t.progress} ${progress} / ${achievement.goal}`}>
                      <span style={{ width: `${progressPercent}%` }} />
                    </div>
                    <small>
                      {progress}/{achievement.goal} · {isUnlocked ? t.earned : t.inProgress}
                    </small>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="menu-actions">
            <button className="ghost" type="button" onClick={() => openScreenWithTransition('start')}>
              {t.back}
            </button>
          </div>
        </section>
      )}

      {screen === 'settings' && (
        <section className="achievement-screen">
          <span className="broken-clock screen-clock achievement-clock" aria-hidden="true" />
          <span className="time-shard achievement-shard" aria-hidden="true" />
          <div className="screen-heading">
            <h3>{t.settings}</h3>
            <p>{t.settingsSubtitle}</p>
          </div>
          <div className="achievement-summary">
            <strong>{Math.round(boardZoom * 100)}%</strong>
            <span>{t.cameraZoom}</span>
          </div>
          <div className="settings-toggles">
            <button
              className={soundEnabled ? 'active' : ''}
              type="button"
              onClick={() => setSoundEnabled((current) => !current)}
              aria-pressed={soundEnabled}
            >
              <strong>{finalText.sound}</strong>
              <span>{soundEnabled ? finalText.enabled : finalText.disabled}</span>
            </button>
            <button
              className={musicEnabled ? 'active' : ''}
              type="button"
              onClick={() => setMusicEnabled((current) => !current)}
              aria-pressed={musicEnabled}
            >
              <strong>{finalText.music}</strong>
              <span>{musicEnabled ? finalText.enabled : finalText.disabled}</span>
            </button>
            <button
              className={performanceMode ? 'active' : ''}
              type="button"
              onClick={() => setPerformanceMode((current) => !current)}
              aria-pressed={performanceMode}
            >
              <strong>{finalText.performanceMode}</strong>
              <span>{performanceMode ? finalText.enabled : finalText.disabled}</span>
            </button>
          </div>
          <div className="language-picker" aria-label={t.language}>
            {languageOptions.map((option) => (
              <button
                className={option.code === language ? 'active' : ''}
                type="button"
                key={option.code}
                onClick={() => changeLanguage(option.code)}
                aria-pressed={option.code === language}
              >
                {option.label}
              </button>
            ))}
          </div>
          <form className="review-panel" ref={reviewPanelRef} onSubmit={submitReview}>
            <div className="review-heading">
              <strong>Отзывы</strong>
              <span>{isReviewAdmin ? 'админский просмотр включен' : 'помоги улучшить игру'}</span>
            </div>
            <label>
              Оценка
              <select value={reviewRating} onChange={(event) => setReviewRating(Number(event.target.value))}>
                <option value={5}>5 - отлично</option>
                <option value={4}>4 - хорошо</option>
                <option value={3}>3 - нормально</option>
                <option value={2}>2 - надо доработать</option>
                <option value={1}>1 - плохо</option>
              </select>
            </label>
            <label>
              Твой отзыв
              <textarea
                value={reviewMessage}
                onChange={(event) => setReviewMessage(event.target.value)}
                placeholder={userId ? 'Что понравилось? Что улучшить?' : 'Войди в аккаунт, чтобы отправить отзыв'}
                maxLength={1200}
                disabled={!userId}
              />
            </label>
            <button type="submit" disabled={!userId || reviewMessage.trim().length < 3}>
              Отправить отзыв
            </button>
            {reviewStatusMessage && <p>{reviewStatusMessage}</p>}
          </form>
          <div className="review-list-panel">
            <div className="review-heading">
              <strong>{isReviewAdmin ? 'Все отзывы игроков' : 'Мои последние отзывы'}</strong>
              <span>{reviewsLoading ? 'загрузка...' : `${reviews.length} шт.`}</span>
            </div>
            {reviews.length === 0 ? (
              <p className="review-empty">{userId ? 'Отзывов пока нет.' : 'Отзывы доступны после входа.'}</p>
            ) : (
              <div className="review-list">
                {reviews.map((review) => (
                  <article className={`review-card status-${review.status}`} key={review.id}>
                    <div>
                      <strong>{review.rating}/5 · {review.display_name}</strong>
                      <span>{isReviewAdmin ? review.user_email : new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    <p>{review.message}</p>
                    <small>{review.status}</small>
                    {isReviewAdmin && (
                      <div className="review-admin-actions">
                        <button type="button" onClick={() => updateReviewStatus(review.id, 'read')}>
                          Прочитано
                        </button>
                        <button type="button" onClick={() => updateReviewStatus(review.id, 'archived')}>
                          В архив
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
          <div className="menu-actions">
            <button
              type="button"
              onClick={() => {
                setBoardTilt(boardViewAngle);
                setBoardTurn(358);
                setBoardZoom(1);
                setMessage(t.cameraReset);
              }}
            >
              {t.resetCamera}
            </button>
            <button className="secondary" type="button" onClick={() => openScreenWithTransition('tutorial')}>
              {t.tutorial}
            </button>
            <button className="ghost" type="button" onClick={() => openScreenWithTransition('start')}>
              {t.back}
            </button>
          </div>
        </section>
      )}

      {screen === 'levels' && (
        <section className="level-screen">
          <span className="broken-clock screen-clock level-clock" aria-hidden="true" />
          <span className="time-shard level-shard" aria-hidden="true" />
          <div className="screen-heading">
            <h3>{t.levelMap}</h3>
            <p>{t.levelMapSubtitle}</p>
          </div>
          <div className="level-map-layout">
            <div className="level-map-card">
              <div
                className={[
                  'level-map',
                  ...completedLevelIds.map((levelId) => `completed-level-${levelId}`),
                ].join(' ')}
                aria-label={t.levelMap}
              >
                <span className="map-orbit orbit-a" aria-hidden="true" />
                <span className="map-orbit orbit-b" aria-hidden="true" />
                <span className="map-route route-stone" aria-hidden="true" />
                <span className="map-route route-ancient" aria-hidden="true" />
                <span className="map-route route-medieval" aria-hidden="true" />
                <span className="map-route route-industrial" aria-hidden="true" />
                <span className="map-route route-future" aria-hidden="true" />
                <span className="map-route route-cyber" aria-hidden="true" />
                <span className="archive-territory archive-stone" aria-hidden="true">Каменный архив</span>
                <span className="archive-territory archive-ancient" aria-hidden="true">Античный зал</span>
                <span className="archive-territory archive-medieval" aria-hidden="true">Замковый фонд</span>
                <span className="archive-territory archive-industrial" aria-hidden="true">Механический сектор</span>
                <span className="archive-territory archive-future" aria-hidden="true">Будущая витрина</span>
                <span className="archive-territory archive-cyber" aria-hidden="true">Киберполка</span>
                <span className="map-rift" aria-hidden="true">Разлом времени</span>
                {levelMap.map((level) => {
                  const position = levelMapPositions[level.id];
                  const isCompleted = completedLevelIds.includes(level.id) || completedLevelIds.some((levelId) => Math.floor(levelId / 10) === level.id);
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
                      <small>{isCompleted ? t.opened : t.notCompleted}</small>
                      <strong>{getLevelUiText(level, language).mapTitle}</strong>
                      <em>{battleMap.name}: {battleMap.description}</em>
                    </button>
                  );
                })}
              </div>
            </div>
            <aside className="map-legend" aria-label={t.legend}>
              <strong>{t.legend}</strong>
              <span><i className="legend-road" />{t.enemyRoad}</span>
              <span><i className="legend-platform" />{t.towerPlatform}</span>
              <span><i className="legend-rift-small" />{t.timeDistortion}</span>
              <span><i className="legend-rift" />{t.timeRift}</span>
              <span><i className="legend-base" />{t.playerBase}</span>
            </aside>
          </div>
          <div className="menu-actions">
            <button className="ghost" type="button" onClick={() => openScreenWithTransition('start')}>
              {t.back}
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
          {isTimeLoopMode
            ? `${era.description} Петля времени нестабильна: эпохи меняются прямо во время боя.`
            : isVictory
            ? t.victoryMessage
            : hasFinalBossInCurrentWave
              ? `${era.description} ${t.bossWaveHint}`
              : hasBossServantInCurrentWave
                ? `${era.description} На этой волне выходит служащий финального босса.`
              : era.description}
        </p>
        <button
          className="wave-action era-wave-action"
          type="button"
          onClick={isWaveRunning ? skipWave : startWave}
          disabled={isWaveRunning ? !canSkipWave : baseHp === 0 || isVictory}
        >
          {isVictory
            ? t.victory
            : isWaveRunning
              ? skipSecondsLeft > 0
                ? `${t.waveSkip} ${skipSecondsLeft}${t.seconds}`
                : t.waveSkip
              : t.launch}
        </button>
      </div>
      )}

      {screen === 'epochLevels' && (
        <section className="epoch-tablet-screen">
          <div className="epoch-tablet-grip">
            <div className="epoch-tablet">
              <span className="tablet-scanline" aria-hidden="true" />
              <span className="tablet-corner tablet-corner-a" aria-hidden="true" />
              <span className="tablet-corner tablet-corner-b" aria-hidden="true" />
              <div className="tablet-heading">
                <span>{epochTablet.title}</span>
                <h3>{selectedLevelUi.mapTitle}</h3>
                <p>{epochTablet.subtitle}</p>
              </div>
              <div className="tablet-level-grid">
                {selectedEraMissions.map((mission) => {
                  const startWave = Math.min(selectedMaxWaves, selectedLevel.startWave + mission.startWaveOffset);

                  return (
                    <button
                      className={mission.id === selectedEraMissionId ? 'tablet-level-card active' : 'tablet-level-card'}
                      type="button"
                      key={mission.id}
                      onClick={() => selectEraMission(mission)}
                    >
                      <span className="tablet-level-number">{mission.id}</span>
                      <strong>{mission.title[language]}</strong>
                      <p>{mission.description[language]}</p>
                      <small><b>{epochTablet.map}</b>{mission.mapHint[language]}</small>
                      <small><b>{epochTablet.waves}</b>{startWave}-{selectedMaxWaves}</small>
                      <em>{epochTablet.choose}</em>
                    </button>
                  );
                })}
              </div>
              <div className="menu-actions tablet-actions">
                <button className="ghost" type="button" onClick={() => openScreenWithTransition('levels')}>
                  {epochTablet.back}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {screen === 'difficulty' && (
        <section className="difficulty-screen">
          <span className="broken-clock screen-clock difficulty-clock" aria-hidden="true" />
          <span className="time-crack screen-crack difficulty-crack" aria-hidden="true" />
          <div className="screen-heading">
            <h3>{t.difficulty}</h3>
            <p>{fillText(t.difficultySubtitle, { level: selectedMissionTitle, wave: selectedMissionStartWave })}</p>
          </div>
          <div className="difficulty-panel" aria-label={t.difficulty}>
        {difficultyModes.map((mode) => {
          const modeText = getDifficultyUiText(mode, language);
          const modeMetaText = difficultyMetaText[language];
          const modeStartWave = isTimeLoopMode ? 1 : Math.min(mode.maxWaves, selectedLevel.startWave + selectedEraMission.startWaveOffset);

          return (
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
              <span className="difficulty-copy">
                <strong>{modeText.name}</strong>
                <span>{modeText.description}</span>
              </span>
              <span className="difficulty-meta">
                <small><b>{modeMetaText.boss}</b>{modeText.boss}</small>
                <small><b>{modeMetaText.waves}</b>{modeStartWave}-{mode.maxWaves}</small>
                <small><b>{modeMetaText.levels}</b>{selectedEraMissions.length}</small>
              </span>
              <small>
                {modeText.boss} · {mode.startCoins} {t.coins} · {mode.startBaseHp} {t.baseHp}
              </small>
            </button>
          );
        })}
      </div>
          <div className="menu-actions">
            <button className="ghost" type="button" onClick={() => openScreenWithTransition('levels')}>
              {t.backToLevels}
            </button>
          </div>
        </section>
      )}

      {screen === 'loadout' && (
        <section className="loadout-screen">
          <span className="broken-clock screen-clock loadout-clock" aria-hidden="true" />
          <span className="time-crack screen-crack loadout-crack" aria-hidden="true" />
          <div className="screen-heading">
            <h3>{t.loadout}</h3>
            <p>{fillText(t.loadoutSubtitle, { count: Math.min(requiredLoadoutSize, availableTowerKinds.length), level: selectedMissionTitle })}</p>
          </div>

          <div className="loadout-layout">
            <div className="loadout-bestiary" aria-label={t.bestiary}>
              <div className="loadout-panel-heading">
                <strong>{t.bestiary}</strong>
                <span>{coins} {t.coins} · {equippedTowerIds.length}/{towerSlots.length} {t.selected}</span>
              </div>
              <div className="bestiary-list loadout-bestiary-list">
                {availableTowerKinds.map((tower) => {
                  const isUnlocked = unlockedTowerSet.has(tower.id);
                  const isEquipped = towerSlots.includes(tower.id);
                  const canUnlockByChallenge = isTowerUnlockedByChallenge(tower.id, achievementStats, completedLevelIds.length);

                  return (
                  <button
                    key={tower.id}
                    className={[
                      'bestiary-item',
                      isEquipped ? 'equipped' : '',
                      isUnlocked ? 'unlocked' : 'locked',
                      canUnlockByChallenge ? '' : 'challenge-locked',
                    ].join(' ')}
                    type="button"
                    onClick={() => addTowerToSlot(tower.id)}
                    title={tower.levelDescriptions[0]}
                  >
                    <span>{renderTowerMark(tower)}</span>
                    <em>{getTowerUiName(tower, language)}</em>
                    <small className="market-price">
                      {isUnlocked
                        ? 'Куплено'
                        : canUnlockByChallenge
                          ? `Купить за ${towerMarketPrices[tower.id]} ${t.coins}`
                          : getTowerUnlockText(tower.id)}
                    </small>
                    <small>{tower.cost} {t.coins} · DPS {getDps(tower.damage, tower.cooldown)} · {getPlacementUiLabel(tower, language)}</small>
                  </button>
                  );
                })}
              </div>
            </div>

            <div className="loadout-slots" aria-label="Слоты башен">
              <div className="loadout-panel-heading">
                <strong>{t.battleSet}</strong>
                <span>{isLoadoutReady ? t.ready : t.towersNeeded}</span>
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
                        <strong>{tower ? getTowerUiName(tower, language) : t.empty}</strong>
                        <small>
                          {tower ? `${tower.cost} ${t.coins} · ${getPlacementUiLabel(tower, language)}` : t.addFromBestiary}
                        </small>
                      </button>
                      {tower && (
                        <button
                          className="slot-remove"
                          type="button"
                          onClick={() => removeTowerFromSlot(slotIndex)}
                          aria-label={`${t.back}: ${getTowerUiName(tower, language)}`}
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
            <button className="ghost" type="button" onClick={() => openScreenWithTransition('difficulty')}>
              {t.backToDifficulty}
            </button>
            <button type="button" onClick={beginBattleAfterLoadout} disabled={!isLoadoutReady}>
              {t.toBattle}
            </button>
          </div>
        </section>
      )}

      {screen === 'battle' && (
        <>
      {practiceTutorialActive && (
        <div className="practice-tutorial-panel">
          <strong>{t.battleTutorial}</strong>
          <span>
            {tutorialStep === 'selectTower' && t.tutorialSelectTower}
            {tutorialStep === 'placeTower' && t.tutorialPlaceTower}
            {tutorialStep === 'startWave' && t.tutorialStartWave}
            {tutorialStep === 'watchWave' && t.tutorialWatchWave}
            {tutorialStep === 'complete' && t.tutorialComplete}
          </span>
          <button className="ghost" type="button" onClick={() => closeTutorial('start')}>
            {t.finish}
          </button>
        </div>
      )}
      <div className="battle-layout">
        <div className="battle-side-panel">
          <div className="battle-control-panel">
            <div className="stats">
              <span>{t.wave} {wave}/{waveLimitLabel}</span>
              <span>{waveTimeLeft} {t.seconds}</span>
              <span>{coins} {t.coins}</span>
              <span>{baseHp} {t.baseHp}</span>
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
                      <strong>{tower ? getTowerUiName(tower, language) : t.empty}</strong>
                      <small>
                        {tower ? `${tower.cost} ${t.coins} · ${getPlacementUiLabel(tower, language)}` : t.addFromBestiary}
                      </small>
                    </button>
                    {tower && (
                      <button
                        className="slot-remove"
                        type="button"
                        onClick={() => removeTowerFromSlot(slotIndex)}
                        aria-label={`${t.back}: ${getTowerUiName(tower, language)}`}
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
              {getTowerUiName(getTowerKind(selectedPlacedTower.kind), language)} ур. {selectedPlacedTower.level}
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
              {selectedPlacedTower.level >= maxTowerLevel ? 'Макс.' : `Улучшить за ${getDiscountedUpgradeCost(selectedPlacedTower, towers)}`}
            </button>
            <button className="secondary danger" type="button" onClick={() => sellTower(selectedPlacedTower)}>
              Продать за {getSellRefund(selectedPlacedTower)}
            </button>
          </div>
        </div>
      )}
        </div>

      {commentatorMessage && (
        <div className="ai-commentary" aria-live="polite">
          <span className="commentator-portrait" aria-hidden="true">
            <span className="commentator-aura" />
            <span className="commentator-arm arm-left" />
            <span className="commentator-arm arm-right" />
            <span className="commentator-body" />
            <span className="commentator-head" />
            <span className="commentator-eye eye-left" />
            <span className="commentator-eye eye-right" />
          </span>
          <span className="commentary-copy">
            <strong>Эклипс</strong>
            <p>{commentatorMessage.replace(/^\u041a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0442\u043e\u0440:\s*/i, '')}</p>
          </span>
        </div>
      )}

      <div
        ref={boardRef}
        className={`board board-${selectedLevel.mapArea}`}
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
        {boardCells.map((cell) => {
          const tower = towersByCell.get(cell);
          const towerKind = getTowerKind(tower?.kind ?? selectedTower);
          const towerStats = tower ? getTowerStats(tower) : null;
          const cellEnemies = enemiesByCell.get(cell) ?? [];
          const hitTower = activeTowersByTargetCell.get(cell);
          const isPath = battleCellSets.path.has(cell);
          const canBuild = battleCellSets.build.has(cell);
          const isHighland = battleCellSets.highland.has(cell);
          const canPlaceSelectedTower = canPlaceTowerOnCell(towerKind, cell, selectedBattleMap);
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
                canBuild && !tower && !canPlaceSelectedTower ? 'wrong-placement' : '',
                getTileDetailClass(cell, selectedBattleMap),
                tower ? 'has-tower' : '',
                isSelectedTower ? 'selected-tower' : '',
                isTutorialTarget ? 'tutorial-target' : '',
              ].join(' ')}
              type="button"
              data-cell={cell}
              data-build-cell={canBuild || tower ? 'true' : 'false'}
              onClick={() => handleCellClick(cell)}
              disabled={!tower && (!canBuild || !canPlaceSelectedTower)}
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
                    enemy.isBossServant ? 'boss-servant' : '',
                    enemy.slowedUntil > renderNow ? 'slowed' : '',
                    enemy.speedBoostUntil > renderNow ? 'boosted' : '',
                    isEnemyInvulnerable(enemy, renderNow) ? 'invulnerable' : '',
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
      {isVictory && (
        <div className="victory-overlay" role="dialog" aria-modal="true" aria-labelledby="victory-title">
          <div className="victory-modal">
            <span className="victory-mark" aria-hidden="true">✓</span>
            <h3 id="victory-title">{t.victory}</h3>
            <p>{finalText.victorySubtitle}</p>
            <div className="victory-stats">
              <span>
                <small>{t.gameTime}</small>
                <strong>{formatDuration(victoryDurationSeconds)}</strong>
              </span>
              <span>
                <small>{finalText.clearedWaves}</small>
                <strong>{battleSummary.waves}</strong>
              </span>
              <span>
                <small>{finalText.defeatedEnemies}</small>
                <strong>{battleSummary.kills}</strong>
              </span>
              <span>
                <small>{finalText.earnedXp}</small>
                <strong>{battleSummary.xp}</strong>
              </span>
            </div>
            <div className="defeat-actions">
              <button type="button" onClick={goToNextLevel}>
                {finalText.nextLevel}
              </button>
              <button className="secondary" type="button" onClick={returnToMainMenu}>
                {t.mainMenu}
              </button>
            </div>
          </div>
        </div>
      )}
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
            <h3 id="defeat-title">{t.defeat}</h3>
            <p>{t.defeatSubtitle}</p>
            <strong>{t.gameTime}: {formatDuration(defeatDurationSeconds)}</strong>
            <div className="defeat-actions">
              <button type="button" onClick={restartGame}>
                {t.restart}
              </button>
              <button className="secondary" type="button" onClick={returnToMainMenu}>
                {t.mainMenu}
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
