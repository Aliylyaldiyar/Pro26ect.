export type EasyMonsterId =
  | 'tickingScarab'
  | 'lostSecond'
  | 'shardRunner'
  | 'slowedWolf'
  | 'rustChronoid'
  | 'sandPincers'
  | 'chronoRat'
  | 'loopSoldier'
  | 'microRift'
  | 'minuteGhost'
  | 'clockhander'
  | 'brokenCourier'
  | 'clockworkSpider';

type MonsterIconProps = {
  id: EasyMonsterId;
};

const easyMonsterLabels: Record<EasyMonsterId, string> = {
  tickingScarab: 'Тикающий Скарабей',
  lostSecond: 'Потерянная Секунда',
  shardRunner: 'Осколочный Бегун',
  slowedWolf: 'Замедлившийся Волк',
  rustChronoid: 'Ржавый Хроноид',
  sandPincers: 'Песочные Клещи',
  chronoRat: 'Хронокрыс',
  loopSoldier: 'Зацикленный Солдат',
  microRift: 'Микроразломник',
  minuteGhost: 'Минутный Призрак',
  clockhander: 'Стрелочник',
  brokenCourier: 'Сломанный Посыльный',
  clockworkSpider: 'Часовой Паук',
};

export const easyMonsterIds: EasyMonsterId[] = [
  'tickingScarab',
  'lostSecond',
  'shardRunner',
  'slowedWolf',
  'rustChronoid',
  'sandPincers',
  'chronoRat',
  'loopSoldier',
  'microRift',
  'minuteGhost',
  'clockhander',
  'brokenCourier',
  'clockworkSpider',
];

export function getEasyMonsterName(id: EasyMonsterId) {
  return easyMonsterLabels[id];
}

export function MonsterIcon({ id }: MonsterIconProps) {
  return (
    <svg className="monster-icon" viewBox="0 0 64 64" role="img" aria-label={easyMonsterLabels[id]}>
      <defs>
        <filter id={`${id}-shadow`} x="-30%" y="-25%" width="160%" height="160%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#071517" floodOpacity="0.3" />
        </filter>
      </defs>
      <MonsterShape id={id} />
    </svg>
  );
}

function MonsterShape({ id }: MonsterIconProps) {
  switch (id) {
    case 'tickingScarab':
      return (
        <g filter="url(#tickingScarab-shadow)">
          <ellipse cx="32" cy="36" rx="18" ry="14" fill="#2d5674" stroke="#09151d" strokeWidth="4" />
          <path d="M18 36H8M46 36H56M22 24L13 16M42 24L51 16M22 48L13 56M42 48L51 56" stroke="#d8b56b" strokeWidth="4" strokeLinecap="round" />
          <circle cx="32" cy="36" r="10" fill="#172534" stroke="#d8b56b" strokeWidth="4" />
          <path d="M32 28V37L39 41" stroke="#9ceeff" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 'lostSecond':
      return (
        <g filter="url(#lostSecond-shadow)">
          <path d="M32 9C48 19 49 43 32 58C15 43 16 19 32 9Z" fill="#66dff0" stroke="#102332" strokeWidth="4" />
          <circle cx="25" cy="31" r="4" fill="#102332" />
          <circle cx="39" cy="31" r="4" fill="#102332" />
          <path d="M26 43C30 46 35 46 39 43" stroke="#102332" strokeWidth="4" strokeLinecap="round" />
          <path d="M18 18L11 11M47 18L54 11" stroke="#dffcff" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case 'shardRunner':
      return (
        <g filter="url(#shardRunner-shadow)">
          <path d="M32 8L48 23L42 49L22 55L14 26L32 8Z" fill="#9bb5c4" stroke="#111820" strokeWidth="4" strokeLinejoin="round" />
          <path d="M31 10L28 33L43 49M16 27L28 33L22 54M28 33L48 23" stroke="#5c7482" strokeWidth="3" strokeLinecap="round" />
          <circle cx="26" cy="28" r="4" fill="#102332" />
          <circle cx="39" cy="31" r="4" fill="#102332" />
          <path d="M17 56L26 47M47 56L39 47" stroke="#111820" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case 'slowedWolf':
      return (
        <g filter="url(#slowedWolf-shadow)">
          <path d="M16 32L25 15L34 28L45 19L51 43L38 54L21 50L16 32Z" fill="#5f7985" stroke="#111820" strokeWidth="4" strokeLinejoin="round" />
          <path d="M25 15L26 30L34 28L45 19" stroke="#d8b56b" strokeWidth="3" strokeLinecap="round" />
          <circle cx="29" cy="35" r="3" fill="#9ceeff" />
          <circle cx="42" cy="35" r="3" fill="#9ceeff" />
          <path d="M9 31C13 22 22 15 33 13M55 49C47 58 31 60 18 52" stroke="#7ee4ff" strokeWidth="3" strokeLinecap="round" strokeDasharray="7 6" />
        </g>
      );
    case 'rustChronoid':
      return (
        <g filter="url(#rustChronoid-shadow)">
          <rect x="18" y="17" width="28" height="31" rx="7" fill="#8f7253" stroke="#111820" strokeWidth="4" />
          <path d="M23 17V10M41 17V10M15 31H8M49 31H56" stroke="#111820" strokeWidth="4" strokeLinecap="round" />
          <circle cx="27" cy="31" r="4" fill="#9ceeff" />
          <circle cx="38" cy="31" r="4" fill="#1b2027" />
          <path d="M25 42H40" stroke="#4b3123" strokeWidth="4" strokeLinecap="round" />
          <path d="M23 22L43 44" stroke="#d8b56b" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 'sandPincers':
      return (
        <g filter="url(#sandPincers-shadow)">
          <ellipse cx="32" cy="37" rx="15" ry="13" fill="#d2ad66" stroke="#111820" strokeWidth="4" />
          <path d="M20 30L8 21L15 16M44 30L56 21L49 16M21 45L13 54M43 45L51 54" stroke="#d2ad66" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="27" cy="34" r="3" fill="#111820" />
          <circle cx="37" cy="34" r="3" fill="#111820" />
          <path d="M24 45C28 48 36 48 40 45" stroke="#7a5931" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case 'chronoRat':
      return (
        <g filter="url(#chronoRat-shadow)">
          <path d="M14 41C18 24 37 18 48 31C55 39 47 52 31 52C21 52 15 48 14 41Z" fill="#6f7d7d" stroke="#111820" strokeWidth="4" />
          <circle cx="23" cy="24" r="7" fill="#6f7d7d" stroke="#111820" strokeWidth="4" />
          <circle cx="39" cy="34" r="3" fill="#111820" />
          <path d="M47 43C58 45 60 32 52 28" stroke="#d8b56b" strokeWidth="4" strokeLinecap="round" />
          <path d="M51 28V38L58 41" stroke="#111820" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 'loopSoldier':
      return (
        <g filter="url(#loopSoldier-shadow)">
          <path d="M23 56V33H41V56" fill="#374351" />
          <path d="M23 56V33H41V56" stroke="#111820" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="32" cy="22" r="12" fill="#8f7253" stroke="#111820" strokeWidth="4" />
          <path d="M20 36L9 45M44 36L55 45" stroke="#d8b56b" strokeWidth="5" strokeLinecap="round" />
          <path d="M15 17C24 6 43 7 50 20M50 20H41M50 20V11" stroke="#7ee4ff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case 'microRift':
      return (
        <g filter="url(#microRift-shadow)">
          <path d="M32 7L49 24L43 56L20 51L14 23L32 7Z" fill="#281a45" stroke="#111820" strokeWidth="4" strokeLinejoin="round" />
          <path d="M32 14L39 29L31 35L38 49L24 36L31 29L25 17" stroke="#75fff0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="24" cy="30" r="4" fill="#bf7cff" />
          <circle cx="41" cy="35" r="4" fill="#75fff0" />
        </g>
      );
    case 'minuteGhost':
      return (
        <g filter="url(#minuteGhost-shadow)">
          <path d="M17 56V28C17 16 24 9 33 9C44 9 50 18 49 30V56L41 50L34 57L27 50L17 56Z" fill="#c9f7ff" stroke="#102332" strokeWidth="4" strokeLinejoin="round" opacity="0.9" />
          <circle cx="28" cy="31" r="4" fill="#102332" />
          <circle cx="40" cy="31" r="4" fill="#102332" />
          <path d="M29 43H39" stroke="#102332" strokeWidth="4" strokeLinecap="round" />
          <path d="M17 21L8 15M49 21L57 14" stroke="#7ee4ff" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case 'clockhander':
      return (
        <g filter="url(#clockhander-shadow)">
          <circle cx="32" cy="29" r="16" fill="#263540" stroke="#111820" strokeWidth="4" />
          <path d="M23 56L27 44H37L42 56" stroke="#111820" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 42L7 28M46 42L57 25" stroke="#d8b56b" strokeWidth="5" strokeLinecap="round" />
          <path d="M7 28L18 30M57 25L54 37" stroke="#d8b56b" strokeWidth="4" strokeLinecap="round" />
          <path d="M32 19V30L41 35" stroke="#9ceeff" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case 'brokenCourier':
      return (
        <g filter="url(#brokenCourier-shadow)">
          <path d="M22 56L27 32H42L47 56" fill="#374351" stroke="#111820" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="34" cy="20" r="12" fill="#c28a6e" stroke="#111820" strokeWidth="4" />
          <path d="M19 35L8 28M47 34L57 26" stroke="#d8b56b" strokeWidth="5" strokeLinecap="round" />
          <rect x="40" y="35" width="15" height="12" rx="2" fill="#d2ad66" stroke="#111820" strokeWidth="3" />
          <path d="M24 24H43M25 45L16 56M43 45L52 56" stroke="#111820" strokeWidth="4" strokeLinecap="round" />
          <path d="M17 13L49 51" stroke="#7ee4ff" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 5" />
        </g>
      );
    case 'clockworkSpider':
      return (
        <g filter="url(#clockworkSpider-shadow)">
          <circle cx="32" cy="35" r="14" fill="#263540" stroke="#111820" strokeWidth="4" />
          <circle cx="32" cy="35" r="8" fill="#111820" stroke="#d8b56b" strokeWidth="3" />
          <path d="M21 28L9 19M21 36H7M23 44L12 54M43 28L55 19M43 36H57M41 44L52 54" stroke="#d8b56b" strokeWidth="4" strokeLinecap="round" />
          <path d="M32 29V36L38 39" stroke="#9ceeff" strokeWidth="3" strokeLinecap="round" />
          <circle cx="26" cy="26" r="3" fill="#9ceeff" />
          <circle cx="39" cy="26" r="3" fill="#9ceeff" />
        </g>
      );
  }
}
