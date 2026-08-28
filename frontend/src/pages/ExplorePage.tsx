import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getDiscoveryFilters, searchHeritage } from '../api/discovery'
import { AppShell } from '../components/AppShell'
import { DiscoveryCard } from '../components/DiscoveryCard'
import { DiscoveryFiltersPanel } from '../components/DiscoveryFiltersPanel'
import { PageError, PageLoading } from '../components/AsyncState'
import type { DiscoveryFilters } from '../types'

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initial: DiscoveryFilters = {
    theme: searchParams.get('theme') ?? '',
    q: searchParams.get('q') ?? '',
  }
  const [draft, setDraft] = useState<DiscoveryFilters>(initial)
  const [applied, setApplied] = useState<DiscoveryFilters>(initial)
  const filterOptions = useQuery({
    queryKey: ['discovery-filters'],
    queryFn: getDiscoveryFilters,
  })
  const sites = useQuery({
    queryKey: ['discovery-sites', applied],
    queryFn: () => searchHeritage(applied),
  })

  function apply() {
    setApplied(draft)
    const params = new URLSearchParams()
    Object.entries(draft).forEach(([key, value]) => {
      if (value) params.set(key, String(value))
    })
    setSearchParams(params)
  }

  function reset() {
    setDraft({})
    setApplied({})
    setSearchParams({})
  }

  return (
    <AppShell>
      <section className="mx-auto min-h-[75vh] w-[min(1240px,calc(100%-48px))] py-12 max-[760px]:w-[calc(100%-32px)]">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[0.65rem] font-extrabold tracking-[0.2em] text-[#b85635]">
              EXPLORE THE LIST
            </p>
            <h1 className="mt-3 font-serif text-[clamp(2.8rem,5vw,4.5rem)]">
              世界遺産を探す
            </h1>
          </div>
          <div className="flex gap-4 text-xs font-bold">
            <Link className="text-[#b85635] underline" to="/themes">
              テーマから探す
            </Link>
            <Link className="text-[#b85635] underline" to="/map">
              世界地図から探す
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <DiscoveryFiltersPanel
            onApply={apply}
            onChange={setDraft}
            onReset={reset}
            options={filterOptions.data}
            value={draft}
          />
        </div>

        {applied.theme && (
          <p className="mt-5 text-sm text-[#18352f]/60">
            テーマ「{applied.theme}」で絞り込み中
          </p>
        )}
        {sites.isPending && <PageLoading label="世界遺産を検索しています" />}
        {sites.isError && (
          <PageError
            message="検索結果を取得できませんでした。"
            onRetry={() => sites.refetch()}
          />
        )}
        {sites.data && (
          <>
            <div className="mt-8 flex items-center justify-between">
              <h2 className="font-serif text-2xl">{sites.data.length}件</h2>
              <span className="text-xs text-[#18352f]/45">
                最大500件まで表示
              </span>
            </div>
            {sites.data.length ? (
              <div className="mt-5 grid grid-cols-2 gap-5 max-[800px]:grid-cols-1">
                {sites.data.map((site) => (
                  <DiscoveryCard key={site.uuid} site={site} />
                ))}
              </div>
            ) : (
              <p className="mt-12 text-center text-sm text-[#18352f]/50">
                条件に一致する世界遺産がありません。
              </p>
            )}
          </>
        )}
      </section>
    </AppShell>
  )
}
