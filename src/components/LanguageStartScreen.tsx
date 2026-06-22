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
      <span className="time-fragment time-fragment-stone" aria-hidden="true" />
      <span className="time-fragment time-fragment-ancient" aria-hidden="true" />
      <span className="time-fragment time-fragment-medieval" aria-hidden="true" />
      <span className="time-fragment time-fragment-industrial" aria-hidden="true" />
      <span className="time-fragment time-fragment-future" aria-hidden="true" />
      <span className="time-fragment time-fragment-cyber" aria-hidden="true" />

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
