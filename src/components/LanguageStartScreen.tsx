export type LanguageCode = 'ru' | 'en' | 'kk';

type LanguageStartScreenProps = {
  language: LanguageCode;
  isExiting: boolean;
  onLanguageChange: (language: LanguageCode) => void;
  onStart: () => void;
};

const languageOptions: Array<{ code: LanguageCode; label: string }> = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
  { code: 'kk', label: 'KZ' },
];

const startScreenText: Record<LanguageCode, { start: string; language: string }> = {
  ru: {
    start: 'Начать',
    language: 'Язык',
  },
  en: {
    start: 'Start',
    language: 'Language',
  },
  kk: {
    start: 'Бастау',
    language: 'Тіл',
  },
};

type EraFragment = 'stone' | 'ancient' | 'medieval' | 'industrial' | 'future' | 'cyber';

const eraFragments: EraFragment[] = ['stone', 'ancient', 'medieval', 'industrial', 'future', 'cyber'];

function EraFragmentIcon({ era }: { era: EraFragment }) {
  if (era === 'stone') {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <path className="era-fill-deep" d="M20 58c0-18 14-31 35-31 15 0 26 8 30 20 2 7 0 18-6 24-8 7-24 8-37 5-13-3-22-8-22-18Z" />
        <path className="era-fill-soft" d="M55 25c14 0 26 10 30 23-12-2-28-2-42 1-10 2-18 6-23 11 0-21 14-35 35-35Z" />
        <path className="era-stroke" d="M25 58c6-8 16-13 30-14 12-1 22 2 29 8M35 73l-6 13M55 76l-2 13M71 73l6 12" />
        <path className="era-stroke" d="M23 54c-8-1-13-5-14-10M13 43c6 1 11 4 14 9" />
        <circle className="era-light" cx="34" cy="45" r="3" />
      </svg>
    );
  }

  if (era === 'ancient') {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <path className="era-fill-soft" d="M18 27 48 12l30 15v9H18v-9Z" />
        <path className="era-fill-deep" d="M23 73h50v10H23V73Z" />
        <path className="era-stroke" d="M25 36h46M28 73h40M33 42v29M48 42v29M63 42v29" />
        <path className="era-fill-soft" d="M30 38h9v35h-9V38Zm14 0h9v35h-9V38Zm14 0h9v35h-9V38Z" />
        <path className="era-stroke" d="M48 15v16" />
      </svg>
    );
  }

  if (era === 'medieval') {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <path className="era-fill-deep" d="M18 35h16v-9h12v9h8v-9h12v9h12v46H18V35Z" />
        <path className="era-fill-soft" d="M25 43h12v38H25V43Zm34 0h12v38H59V43Zm-18 13h14v25H41V56Z" />
        <path className="era-stroke" d="M18 35h16v-9h12v9h8v-9h12v9h12v46H18V35ZM32 51h6M58 51h6M41 81V59c0-4 3-7 7-7s7 3 7 7v22" />
      </svg>
    );
  }

  if (era === 'industrial') {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <path className="era-fill-deep" d="M15 66h45v17H15V66Zm51-37h14v54H66V29Z" />
        <path className="era-fill-soft" d="M24 57h11v9H24v-9Zm18-12h11v21H42V45Zm24-26h14v10H66V19Z" />
        <path className="era-stroke" d="M20 66V52l15 9V48l15 10V44l16 11M15 83h70M73 19v64" />
        <circle className="era-fill-soft" cx="34" cy="36" r="14" />
        <path className="era-stroke" d="M34 19v34M17 36h34M22 24l24 24M46 24 22 48" />
      </svg>
    );
  }

  if (era === 'future') {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <path className="era-fill-soft" d="M48 10c11 9 17 21 17 36L48 61 31 46c0-15 6-27 17-36Z" />
        <path className="era-fill-deep" d="M38 61h20l-5 19H43l-5-19Z" />
        <path className="era-stroke" d="M48 10c11 9 17 21 17 36L48 61 31 46c0-15 6-27 17-36ZM31 46 18 61v13l20-13M65 46l13 15v13L58 61" />
        <circle className="era-light" cx="48" cy="34" r="7" />
        <path className="era-stroke" d="M43 82h10M48 61v25" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 96 96" aria-hidden="true">
      <path className="era-stroke" d="M18 24h60v48H18V24Z" />
      <path className="era-fill-deep" d="M25 31h46v34H25V31Z" />
      <path className="era-stroke" d="M34 31v34M48 31v34M62 31v34M25 43h46M25 55h46" />
      <circle className="era-light" cx="34" cy="43" r="4" />
      <circle className="era-light" cx="62" cy="55" r="4" />
      <path className="era-stroke" d="M34 43h14v12h14M18 24l-9-9M78 24l9-9M18 72l-9 9M78 72l9 9" />
    </svg>
  );
}

export function LanguageStartScreen({ language, isExiting, onLanguageChange, onStart }: LanguageStartScreenProps) {
  const text = startScreenText[language];

  return (
    <section className={`language-start-screen ${isExiting ? 'exiting' : ''}`} aria-label={text.language}>
      <span className="language-start-clock" aria-hidden="true">
        <span className="language-clock-face" />
        <span className="language-clock-hand language-clock-hour" />
        <span className="language-clock-hand language-clock-minute" />
        <span className="language-clock-hand language-clock-second" />
        <span className="language-clock-core" />
      </span>
      <span className="language-start-line language-start-line-a" aria-hidden="true" />
      <span className="language-start-line language-start-line-b" aria-hidden="true" />
      <span className="language-start-shard language-start-shard-a" aria-hidden="true" />
      <span className="language-start-shard language-start-shard-b" aria-hidden="true" />
      <span className="language-start-shard language-start-shard-c" aria-hidden="true" />
      <span className="language-start-orbit language-start-orbit-a" aria-hidden="true" />
      <span className="language-start-orbit language-start-orbit-b" aria-hidden="true" />
      <span className="language-start-orbit language-start-orbit-c" aria-hidden="true" />
      <span className="language-start-orbit language-start-orbit-d" aria-hidden="true" />
      <span className="language-start-spark language-start-spark-a" aria-hidden="true" />
      <span className="language-start-spark language-start-spark-b" aria-hidden="true" />
      <span className="language-start-spark language-start-spark-c" aria-hidden="true" />
      {eraFragments.map((era) => (
        <span className={`time-fragment time-fragment-${era}`} aria-hidden="true" key={era}>
          <EraFragmentIcon era={era} />
        </span>
      ))}

      <div className="language-start-content">
        <button className="language-start-button" type="button" onClick={onStart} disabled={isExiting}>
          {text.start}
        </button>
        <div className="language-picker" aria-label={text.language}>
          {languageOptions.map((option) => (
            <button
              className={option.code === language ? 'active' : ''}
              type="button"
              key={option.code}
              onClick={() => onLanguageChange(option.code)}
              aria-pressed={option.code === language}
              disabled={isExiting}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
