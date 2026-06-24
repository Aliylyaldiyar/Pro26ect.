type ExperienceFlash = {
  gainedXp: number;
  level: number;
  leveledUp: boolean;
};

type ExperienceStatsProps = {
  level: number;
  xp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  xpToNextText: string;
  levelLabel: string;
  flash: ExperienceFlash | null;
};

export function ExperienceStats({
  level,
  xp,
  currentLevelXp,
  nextLevelXp,
  progressPercent,
  xpToNextText,
  levelLabel,
  flash,
}: ExperienceStatsProps) {
  const currentLevelProgress = Math.max(0, xp - currentLevelXp);
  const levelXpSize = Math.max(1, nextLevelXp - currentLevelXp);
  const clampedProgress = Math.max(3, Math.min(100, progressPercent));

  return (
    <div className="experience-stats">
      <div className="experience-summary">
        <span>{currentLevelProgress}/{levelXpSize} XP</span>
        <strong>{xp} XP</strong>
      </div>
      <div className="xp-track" aria-label={xpToNextText}>
        <span style={{ width: `${clampedProgress}%` }} />
      </div>
      <p className="xp-caption">{xpToNextText}</p>
      {flash && (
        <div className={flash.leveledUp ? 'xp-flash level-up' : 'xp-flash'} role="status">
          <strong>+{flash.gainedXp} XP</strong>
          {flash.leveledUp && <span>{levelLabel} {flash.level}</span>}
        </div>
      )}
      <small className="experience-level-note">
        {levelLabel} {level}
      </small>
    </div>
  );
}
