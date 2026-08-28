import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDiscoveryFilters, getTimeline } from '../api/discovery'
import { AppShell } from '../components/AppShell'
import { DiscoveryFiltersPanel } from '../components/DiscoveryFiltersPanel'
import { PageError, PageLoading } from '../components/AsyncState'
import type { DiscoveryFilters, HeritageTimelineItem } from '../types'

type TimelineMode = 'historical' | 'unesco'
type Era = 'all' | 'ancient' | 'medieval' | 'early-modern' | 'modern'
type TimelinePeriod = HeritageTimelineItem['historicalPeriods'][number]
type TimelineEntryData = {
  key: string
  site: HeritageTimelineItem
  period: TimelinePeriod | null
  year: number
}

const eras: Array<{ value: Era; label: string; min: number; max: number }> = [
  { value: 'all', label: 'すべて', min: -10_000, max: 3_000 },
  { value: 'ancient', label: '古代', min: -10_000, max: 499 },
  { value: 'medieval', label: '中世', min: 500, max: 1499 },
  { value: 'early-modern', label: '近世', min: 1500, max: 1799 },
  { value: 'modern', label: '近現代', min: 1800, max: 3_000 },
]

export default function TimelinePage() {
  const [mode, setMode] = useState<TimelineMode>('historical')
  const [era, setEra] = useState<Era>('all')
  const [draft, setDraft] = useState<DiscoveryFilters>({})
  const [applied, setApplied] = useState<DiscoveryFilters>({})
  const filters = useQuery({
    queryKey: ['discovery-filters'],
    queryFn: getDiscoveryFilters,
  })
  const timeline = useQuery({
    queryKey: ['heritage-timeline', applied],
    queryFn: () => getTimeline(applied),
  })
  const visible = useMemo(() => {
    const selectedEra = eras.find((item) => item.value === era)!
    return (timeline.data ?? [])
      .flatMap<TimelineEntryData>((site) =>
        mode === 'historical'
          ? site.historicalPeriods.map((period, periodIndex) => ({
              key: `${site.uuid}-${periodIndex}-${period.start}`,
              site,
              period,
              year: period.start,
            }))
          : site.dateInscribed === null
            ? []
            : [
                {
                  key: site.uuid,
                  site,
                  period: null,
                  year: site.dateInscribed,
                },
              ],
      )
      .filter(
        (entry) =>
          entry.year >= selectedEra.min && entry.year <= selectedEra.max,
      )
      .sort((a, b) => a.year - b.year)
  }, [era, mode, timeline.data])
  const unknown =
    mode === 'historical'
      ? (timeline.data ?? []).filter((site) => !site.historicalPeriods.length)
      : []

  return (
    <AppShell>
      <section className="mx-auto min-h-[75vh] w-[min(1200px,calc(100%-48px))] py-12 max-[760px]:w-[calc(100%-32px)]">
        <p className="text-[0.65rem] font-extrabold tracking-[0.2em] text-[#b85635]">
          HERITAGE THROUGH TIME
        </p>
        <h1 className="mt-3 font-serif text-[clamp(2.8rem,5vw,4.5rem)]">
          時代をたどって世界遺産を読む
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-[#18352f]/60">
          遺産そのものが成立した時期と、UNESCOへ登録された年は別の時間軸です。表示を切り替えて、その違いをたどれます。
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {(['historical', 'unesco'] as const).map((value) => (
            <button
              className={`px-5 py-3 text-xs font-bold ${mode === value ? 'bg-[#18352f] text-white' : 'border border-[#18352f]/25'}`}
              key={value}
              onClick={() => {
                setMode(value)
                if (value === 'unesco') setEra('all')
              }}
              type="button"
            >
              {value === 'historical' ? '成立・建設年代' : 'UNESCO登録年'}
            </button>
          ))}
        </div>

        <details className="mt-6">
          <summary className="cursor-pointer text-xs font-bold text-[#b85635]">
            国・地域・遺産区分で絞り込む
          </summary>
          <div className="mt-3">
            <DiscoveryFiltersPanel
              onApply={() => setApplied(draft)}
              onChange={setDraft}
              onReset={() => {
                setDraft({})
                setApplied({})
              }}
              options={filters.data}
              value={draft}
            />
          </div>
        </details>

        {mode === 'historical' && (
          <div className="mt-7 flex flex-wrap gap-2" aria-label="時代区分">
            {eras.map((item) => (
              <button
                className={`px-4 py-2 text-xs font-bold ${era === item.value ? 'bg-[#b85635] text-white' : 'border border-[#18352f]/20'}`}
                key={item.value}
                onClick={() => setEra(item.value)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {timeline.isPending && <PageLoading label="年代を整理しています" />}
        {timeline.isError && (
          <PageError
            message="タイムラインを取得できませんでした。"
            onRetry={() => timeline.refetch()}
          />
        )}
        {timeline.data && (
          <>
            <p className="mt-7 text-xs font-bold text-[#18352f]/50">
              {visible.length}件を年代順に表示
            </p>
            <ol className="relative mt-6 ml-4 border-l border-[#b85635]/35 pl-8">
              {visible.map((entry) => (
                <TimelineEntry entry={entry} key={entry.key} mode={mode} />
              ))}
            </ol>
            {!visible.length && (
              <p className="mt-12 text-center text-sm text-[#18352f]/50">
                この条件で表示できる年代データがありません。
              </p>
            )}
            {mode === 'historical' && unknown.length > 0 && (
              <details className="mt-10 border border-[#18352f]/15 p-5">
                <summary className="cursor-pointer text-sm font-bold">
                  成立年代が未整備の世界遺産（{unknown.length}件）
                </summary>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs max-[680px]:grid-cols-1">
                  {unknown.map((site) => (
                    <Link
                      className="border-b border-[#18352f]/10 py-2 hover:text-[#b85635]"
                      key={site.uuid}
                      to={`/heritage/${site.uuid}`}
                    >
                      {site.nameEn}
                    </Link>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </section>
    </AppShell>
  )
}

function TimelineEntry({
  entry,
  mode,
}: {
  entry: TimelineEntryData
  mode: TimelineMode
}) {
  const { site, period, year } = entry
  const label =
    mode === 'unesco' ? `${year}年登録` : period?.label || formatYear(year)
  return (
    <li className="relative pb-8">
      <span className="absolute top-2 -left-[2.35rem] size-3 rounded-full border-2 border-[#fbf8f1] bg-[#b85635]" />
      <article className="grid grid-cols-[150px_minmax(0,1fr)] gap-5 border border-[#18352f]/15 bg-white/40 p-5 max-[640px]:grid-cols-1">
        <div>
          <strong className="font-serif text-2xl">{label}</strong>
          {mode === 'historical' && period && (
            <>
              <p className="mt-2 text-[0.62rem] text-[#18352f]/50">
                {period.type} ·{' '}
                {period.verified ? '確認済み' : '本文から抽出した推定'}
              </p>
              <a
                className="mt-2 inline-block text-[0.62rem] font-bold text-[#b85635] underline"
                href={period.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                UNESCO出典 ↗
              </a>
            </>
          )}
        </div>
        <div>
          <p className="text-[0.6rem] font-bold tracking-[0.1em] text-[#b85635]">
            {site.category} · {site.statesNames.join(' / ')}
          </p>
          <h2 className="mt-2 font-serif text-xl">{site.nameEn}</h2>
          <p className="mt-2 line-clamp-2 text-xs leading-6 text-[#18352f]/55">
            {site.shortDescriptionEn}
          </p>
          <Link
            className="mt-3 inline-block text-xs font-bold text-[#b85635] underline"
            to={`/heritage/${site.uuid}`}
          >
            英文を読む →
          </Link>
        </div>
      </article>
    </li>
  )
}

function formatYear(year: number) {
  return year < 0 ? `紀元前${Math.abs(year)}年頃` : `${year}年頃`
}
