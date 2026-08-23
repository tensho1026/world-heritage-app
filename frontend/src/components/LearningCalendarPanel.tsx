import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getLearningCalendar } from '../api/reports'

const weekdays = ['月', '火', '水', '木', '金', '土', '日']

export function LearningCalendarPanel() {
  const [month, setMonth] = useState(() =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
    }).format(new Date()),
  )
  const calendar = useQuery({
    queryKey: ['learning-calendar', month],
    queryFn: () => getLearningCalendar(month),
  })
  const cells = calendarCells(month)
  const total = Object.values(calendar.data?.days ?? {}).reduce(
    (sum, day) => sum + day.total,
    0,
  )

  function moveMonth(delta: number) {
    const [year, monthNumber] = month.split('-').map(Number)
    const next = new Date(Date.UTC(year, monthNumber - 1 + delta, 1))
    setMonth(next.toISOString().slice(0, 7))
  }

  return (
    <section className="border border-[#18352f]/15 bg-white/40 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.6rem] font-extrabold tracking-[0.16em] text-[#b85635]">
            LEARNING CALENDAR
          </p>
          <h2 className="mt-2 font-serif text-3xl">学習カレンダー</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            aria-label="前の月"
            onClick={() => moveMonth(-1)}
            type="button"
          >
            ←
          </button>
          <strong className="min-w-24 text-center text-sm">{month}</strong>
          <button
            aria-label="次の月"
            onClick={() => moveMonth(1)}
            type="button"
          >
            →
          </button>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-7 gap-1 text-center text-[0.6rem] text-[#18352f]/45">
        {weekdays.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
        {cells.map((date, index) => {
          if (!date) return <span key={`blank-${index}`} />
          const day = calendar.data?.days[date]
          const intensity = day?.total ?? 0
          return (
            <span
              className={`grid aspect-square min-h-8 place-items-center border text-[0.62rem] ${calendarColor(intensity)}`}
              key={date}
              title={
                day
                  ? `${date}: 読了${day.reads}・語彙${day.savedVocabulary}・復習${day.reviews}`
                  : `${date}: 学習なし`
              }
            >
              {Number(date.slice(-2))}
            </span>
          )
        })}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-px bg-[#18352f]/12 text-center">
        <div className="bg-[#fbf8f1] p-3">
          <strong>{calendar.data?.activeDays ?? '—'}</strong>
          <span className="mt-1 block text-[0.6rem]">学習日</span>
        </div>
        <div className="bg-[#fbf8f1] p-3">
          <strong>{calendar.data?.currentStreak ?? '—'}</strong>
          <span className="mt-1 block text-[0.6rem]">継続日数</span>
        </div>
        <div className="bg-[#fbf8f1] p-3">
          <strong>{calendar.isPending ? '—' : total}</strong>
          <span className="mt-1 block text-[0.6rem]">月間活動</span>
        </div>
      </div>
      {calendar.isError && (
        <p className="mt-3 text-xs text-[#b85635]">
          カレンダーを取得できませんでした。
        </p>
      )}
    </section>
  )
}

function calendarCells(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const first = new Date(Date.UTC(year, monthNumber - 1, 1))
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  const mondayOffset = (first.getUTCDay() + 6) % 7
  return [
    ...Array.from<null>({ length: mondayOffset }).fill(null),
    ...Array.from(
      { length: days },
      (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`,
    ),
  ]
}

function calendarColor(value: number) {
  if (!value) return 'border-[#18352f]/8 bg-[#eee8dc] text-[#18352f]/35'
  if (value === 1) return 'border-[#b9c9c0] bg-[#cddbd3]'
  if (value <= 3) return 'border-[#6f9b86] bg-[#8db49f] text-white'
  return 'border-[#315f4c] bg-[#315f4c] text-white'
}
