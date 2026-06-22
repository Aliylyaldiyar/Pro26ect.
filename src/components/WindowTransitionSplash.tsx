import type { LanguageCode } from './LanguageStartScreen';

type WindowTransitionSplashProps = {
  language: LanguageCode;
};

const transitionText: Record<LanguageCode, { title: string; status: string }> = {
  ru: {
    title: 'Синхронизация времени',
    status: 'Портал открывается',
  },
  en: {
    title: 'Time Sync',
    status: 'Opening the portal',
  },
  kk: {
    title: 'Уақытты үйлестіру',
    status: 'Портал ашылып жатыр',
  },
};

export function WindowTransitionSplash({ language }: WindowTransitionSplashProps) {
  const text = transitionText[language];

  return (
    <section className="window-transition-splash" aria-live="polite">
      <div className="transition-clock" aria-hidden="true">
        <span className="transition-clock-ring transition-clock-ring-a" />
        <span className="transition-clock-ring transition-clock-ring-b" />
        <span className="transition-clock-ring transition-clock-ring-c" />
        <span className="transition-clock-hand transition-clock-hand-a" />
        <span className="transition-clock-hand transition-clock-hand-b" />
        <span className="transition-clock-dot" />
      </div>
      <div className="transition-copy">
        <strong>{text.title}</strong>
        <span>{text.status}</span>
      </div>
    </section>
  );
}
