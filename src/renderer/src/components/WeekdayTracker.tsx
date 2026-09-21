import { Check, Flame } from 'lucide-react'
import type { DailyGoalProgress } from '@shared/goals.ts'

export function WeekdayTracker({
  daily,
  dailyGoal,
  streak
}: {
  daily: DailyGoalProgress
  dailyGoal: number
  streak: number
}): React.ReactNode {
  return (
    <div>
      <div className="grid grid-cols-5 gap-3">
        {daily.weekdays.map((day) => {
          const pct = Math.min(100, (day.count / day.goal) * 100)
          const done = day.complete
          const started = day.count > 0
          return (
            <div key={day.dayIndex} className="flex flex-col items-center gap-2">
              <span
                className={`text-[11px] font-semibold uppercase tracking-wide ${
                  done ? 'text-app-accent' : 'text-app-faint'
                }`}
              >
                {day.label}
              </span>
              <div className="relative h-14 w-14">
                <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    strokeWidth="5"
                    className="stroke-app-subtle"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${(pct / 100) * 2 * Math.PI * 24} ${2 * Math.PI * 24}`}
                    className={
                      done ? 'stroke-emerald-500' : started ? 'stroke-app-accent' : 'stroke-app-border-strong'
                    }
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center">
                  {done ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white animate-pop">
                      <Check className="h-4.5 w-4.5" strokeWidth={3} />
                    </span>
                  ) : (
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        started ? 'text-app-text' : 'text-app-faint'
                      }`}
                    >
                      {day.count}/{day.goal}
                    </span>
                  )}
                </span>
              </div>
              <span
                className={`text-[11px] font-medium ${
                  done ? 'text-emerald-600 dark:text-emerald-400' : started ? 'text-app-muted' : 'text-app-faint'
                }`}
              >
                {done ? 'Goal complete' : started ? 'In progress' : 'Not started'}
              </span>
            </div>
          )
        })}
      </div>

      {streak > 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-orange-500/10 px-4 py-2.5 text-sm font-medium text-orange-600 dark:text-orange-400 animate-fade">
          <Flame className="h-4 w-4" />
          {streak}-day consistency streak
        </div>
      ) : (
        <p className="mt-4 text-sm text-app-faint">
          Complete {dailyGoal} applications a day on weekdays to build a streak.
        </p>
      )}
    </div>
  )
}