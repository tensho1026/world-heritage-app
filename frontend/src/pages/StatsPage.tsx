import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getHistory, getStats } from '../api/heritage'
import { AppShell } from '../components/AppShell'
import { PageError, PageLoading } from '../components/AsyncState'
import type { ComprehensionLevel } from '../types'
import { LearningCalendarPanel } from '../components/LearningCalendarPanel'
import { WeeklyReportPanel } from '../components/WeeklyReportPanel'

const comprehensionLabels: Record<ComprehensionLevel, string> = {
  difficult: '難しかった',
  partial: 'だいたい分かった',
  understood: 'よく分かった',
}

export default function StatsPage() {
  const stats = useQuery({ queryKey: ['stats'], queryFn: getStats })
  const history = useQuery({ queryKey: ['history'], queryFn: getHistory })

  if (stats.isPending || history.isPending) {
    return (
      <AppShell>
        <PageLoading label="学習記録を集計しています" />
      </AppShell>
    )
  }
  if (stats.isError || history.isError || !stats.data) {
    return (
      <AppShell>
        <PageError
          message="学習記録を取得できませんでした。"
          onRetry={() => {
            void stats.refetch()
            void history.refetch()
          }}
        />
      </AppShell>
    )
  }

  const summary = [
    ['読了した世界遺産', stats.data.uniqueRead],
    ['総読了回数', stats.data.totalReads],
    ['閲覧した世界遺産', stats.data.uniqueViewed],
    ['保存語彙', stats.data.savedVocabulary],
    ['暗記カード', stats.data.memorizationVocabulary],
    ['まだ不安', stats.data.uncertainVocabulary],
    ['お気に入り', stats.data.favorites],
    ['後で読む', stats.data.readLater],
  ] as const

  return (
    <AppShell>
      <section className="mx-auto min-h-[70vh] w-[min(1100px,calc(100%-48px))] py-14 max-[760px]:w-[calc(100%-32px)]">
        <p className="text-[0.65rem] font-extrabold tracking-[0.2em] text-[#b85635]">
          LEARNING RECORD
        </p>
        <h1 className="mt-3 font-serif text-[clamp(2.8rem,5vw,4.5rem)]">
          学習記録
        </h1>

        <div className="mt-10 grid grid-cols-4 gap-px bg-[#18352f]/15 max-[800px]:grid-cols-2">
          {summary.map(([label, value]) => (
            <div className="bg-[#fbf8f1] p-6" key={label}>
              <strong className="font-serif text-4xl">{value}</strong>
              <p className="mt-2 text-xs text-[#18352f]/55">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-8 max-[760px]:grid-cols-1">
          <Breakdown title="理解度">
            {Object.entries(stats.data.comprehension).map(([key, value]) => (
              <BreakdownRow
                key={key}
                label={comprehensionLabels[key as ComprehensionLevel]}
                value={value}
              />
            ))}
          </Breakdown>
          <Breakdown title="カテゴリ別読了">
            {Object.keys(stats.data.byCategory).length ? (
              Object.entries(stats.data.byCategory).map(([label, value]) => (
                <BreakdownRow key={label} label={label} value={value} />
              ))
            ) : (
              <p className="text-sm text-[#18352f]/45">
                まだ読了記録がありません
              </p>
            )}
          </Breakdown>
          <Breakdown title="地域別読了">
            {Object.keys(stats.data.byRegion).length ? (
              Object.entries(stats.data.byRegion).map(([label, value]) => (
                <BreakdownRow key={label} label={label} value={value} />
              ))
            ) : (
              <p className="text-sm text-[#18352f]/45">
                まだ読了記録がありません
              </p>
            )}
          </Breakdown>
        </div>

        <div className="mt-12 grid grid-cols-2 items-start gap-8 max-[900px]:grid-cols-1">
          <LearningCalendarPanel />
          <WeeklyReportPanel />
        </div>

        <section className="mt-14">
          <h2 className="font-serif text-3xl">最近の読了履歴</h2>
          {history.data?.length ? (
            <ol className="mt-6 divide-y divide-[#18352f]/15 border-y border-[#18352f]/15">
              {history.data.map((item) => (
                <li key={item.id}>
                  <Link
                    className="grid grid-cols-[100px_1fr_auto] items-center gap-5 py-4 text-sm hover:text-[#b85635] max-[600px]:grid-cols-1 max-[600px]:gap-1"
                    to={`/heritage/${item.heritageSiteId}`}
                  >
                    <time className="text-xs text-[#18352f]/45">
                      {new Date(item.readAt).toLocaleDateString('ja-JP')}
                    </time>
                    <span className="font-serif text-lg">
                      {item.site.nameEn}
                    </span>
                    <span className="text-xs text-[#18352f]/45">
                      {item.site.statesNames.join(', ')}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-5 text-sm text-[#18352f]/50">
              まだ読了履歴はありません。
            </p>
          )}
        </section>
      </section>
    </AppShell>
  )
}

function Breakdown({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border border-[#18352f]/15 bg-white/40 p-6">
      <h2 className="mb-5 font-serif text-2xl">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-[#18352f]/10 pb-2 text-sm">
      <span className="text-[#18352f]/65">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
