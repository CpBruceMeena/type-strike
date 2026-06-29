import DayCard from "./DayCard";

interface RewardCalendarProps {
  streakCount: number;
}

interface StreakDayData {
  label: string;
  isToday: boolean;
  isPast: boolean;
  isClaimed: boolean;
  isBonus: boolean;
  rewardXp: number;
  rewardIcon: string;
}

const bonusDays = new Set([5, 10, 15, 20, 25, 30]);

function buildCalendar(streakCount: number): StreakDayData[] {
  const days: StreakDayData[] = [];
  const startDay = Math.max(1, streakCount - 1);
  for (let offset = 0; offset < 7; offset++) {
    const dayNum = startDay + offset;
    const isToday = dayNum === streakCount && streakCount > 0;
    const isPast = streakCount > 0 && dayNum < streakCount;
    const isClaimed = isPast;
    const isBonus = bonusDays.has(dayNum);
    const xp = isBonus ? dayNum * 10 : Math.max(10, dayNum * 2);

    let label = `DAY ${dayNum}`;
    if (isToday) label = "TODAY";
    else if (dayNum === streakCount + 1 && streakCount > 0) label = "TOMORROW";

    const rewardIcon = isBonus ? (isBonus && dayNum >= 10 ? "💎" : "🎁") : "🔥";

    days.push({
      label,
      isToday,
      isPast,
      isClaimed,
      isBonus,
      rewardXp: xp,
      rewardIcon,
    });
  }
  return days;
}

export default function RewardCalendar({ streakCount }: RewardCalendarProps) {
  const days = buildCalendar(streakCount);

  return (
    <div>
      <div
        className="reward-cal"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 12,
          marginTop: 24,
        }}
      >
        {days.map((day, idx) => (
          <DayCard key={idx} {...day} />
        ))}
      </div>
      <p
        style={{
          textAlign: "center",
          marginTop: 18,
          color: "var(--ts-text-dim, #9b94b3)",
          fontSize: 13,
        }}
      >
        {streakCount >= 30
          ? "Max streak achieved! 🎉 Keep it going for bragging rights."
          : `Reach day ${Math.ceil((streakCount + 5) / 5) * 5} for a mega bonus reward.`}
      </p>

      <style>{`
        @media (max-width: 960px) {
          .reward-cal { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 520px) {
          .reward-cal { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </div>
  );
}
