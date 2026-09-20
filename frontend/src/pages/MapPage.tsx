import { queryKeys } from '../api/queryKeys'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getDiscoveryFilters,
  getMapHeritage,
  getMapSite,
  getCountryProgress,
  getMapProgress,
} from '../api/discovery'
import { AppShell } from '../components/AppShell'
import { DiscoveryFiltersPanel } from '../components/DiscoveryFiltersPanel'
import { PageError } from '../components/AsyncState'
import {
  useCountryProgressLayer,
  useHeritageSitesLayer,
  useMapController,
} from '../hooks/useHeritageMap'
import type {
  DiscoveryFilters,
  HeritageMapProgress,
  HeritageProgressItem,
  MapSiteDetails,
} from '../types'

export default function MapPage() {
  const [draft, setDraft] = useState<DiscoveryFilters>({})
  const [applied, setApplied] = useState<DiscoveryFilters>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedCountryIso, setSelectedCountryIso] = useState<string>('')
  const filterOptions = useQuery({
    queryKey: queryKeys.discovery.filters,
    queryFn: getDiscoveryFilters,
  })
  const progress = useQuery({
    queryKey: queryKeys.discovery.progress,
    queryFn: getMapProgress,
  })
  const { mapContainer, mapInstance, mapReady, viewport } = useMapController()
  const sites = useQuery({
    queryKey: queryKeys.discovery.mapSites(applied, viewport),
    queryFn: () => getMapHeritage(applied, viewport!),
    enabled: mapReady && viewport !== null,
    placeholderData: (previous) => previous,
  })
  const selectedSite = useQuery({
    queryKey: queryKeys.discovery.mapSite(selectedId),
    queryFn: () => getMapSite(selectedId!),
    enabled: Boolean(selectedId),
  })
  const countryProgress = useQuery({
    queryKey: queryKeys.discovery.countryProgress(selectedCountryIso),
    queryFn: () => getCountryProgress(selectedCountryIso),
    enabled: Boolean(selectedCountryIso),
  })

  useCountryProgressLayer(
    mapInstance,
    mapReady,
    progress.data,
    setSelectedCountryIso,
  )
  useHeritageSitesLayer(mapInstance, mapReady, sites.data, setSelectedId)

  function apply() {
    setApplied(draft)
    setSelectedId(null)
  }

  function reset() {
    setDraft({})
    setApplied({})
    setSelectedId(null)
  }

  return (
    <AppShell>
      <section className="mx-auto w-[min(1400px,calc(100%-32px))] py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[0.65rem] font-extrabold tracking-[0.2em] text-[#b85635]">
              WORLD MAP
            </p>
            <h1 className="mt-2 font-serif text-[clamp(2.5rem,5vw,4rem)]">
              世界地図から探す
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span>
              <i className="mr-1 inline-block size-3 rounded-full bg-[#d6cec0]" />
              未読
            </span>
            <span>
              <i className="mr-1 inline-block size-3 rounded-full bg-[#4f8871]" />
              読了
            </span>
            <Link className="font-bold text-[#b85635] underline" to="/explore">
              一覧で見る
            </Link>
          </div>
        </div>

        <details className="mt-6">
          <summary className="cursor-pointer text-xs font-bold text-[#b85635]">
            地図の表示条件を変更
          </summary>
          <div className="mt-3">
            <DiscoveryFiltersPanel
              onApply={apply}
              onChange={setDraft}
              onReset={reset}
              options={filterOptions.data}
              value={draft}
            />
          </div>
        </details>

        <div
          className="mt-6 min-h-[258px] max-[680px]:min-h-[420px]"
          aria-busy={progress.isPending}
        >
          {progress.data ? (
            <ProgressDashboard progress={progress.data} />
          ) : progress.isPending ? (
            <ProgressDashboardSkeleton />
          ) : null}
        </div>

        {sites.isError && (
          <PageError
            message="地図データを取得できませんでした。"
            onRetry={() => sites.refetch()}
          />
        )}
        <div className="relative mt-6 overflow-hidden border border-[#18352f]/20 bg-[#d9d0bd]">
          <div
            className="h-[min(72vh,780px)] min-h-[520px] w-full"
            ref={mapContainer}
          />
          <div className="absolute top-3 left-3 z-10 bg-[#fbf8f1]/92 px-3 py-2 text-xs font-bold shadow">
            {sites.isPending
              ? '地点を読み込み中…'
              : `${sites.data?.length ?? 0}地点`}
          </div>
          {selectedSite.data && (
            <MapSiteCard
              site={selectedSite.data}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
        {progress.data && (
          <div className="mt-5">
            <label className="text-xs font-bold">
              国ごとの読了状況
              <select
                className="ml-3 border border-[#18352f]/20 bg-[#fbf8f1] px-3 py-2"
                onChange={(event) => setSelectedCountryIso(event.target.value)}
                value={selectedCountryIso}
              >
                <option value="">地図または国名を選択</option>
                {progress.data.countries
                  .filter((country) => country.isoCode)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((country) => (
                    <option key={country.isoCode} value={country.isoCode}>
                      {country.name}（{country.read}/{country.total}）
                    </option>
                  ))}
              </select>
            </label>
            {countryProgress.isPending && (
              <p className="mt-4 text-xs text-[#18352f]/55">
                国別の地点を読み込み中…
              </p>
            )}
            {countryProgress.data && (
              <CountryProgress country={countryProgress.data} />
            )}
          </div>
        )}
        <p className="mt-3 text-[0.62rem] leading-5 text-[#18352f]/45">
          地図データ © OpenStreetMap contributors / 国境データ Natural Earth
          contributors。背景地図の提供元は環境変数で変更できます。
        </p>
      </section>
    </AppShell>
  )
}

function ProgressDashboard({ progress }: { progress: HeritageMapProgress }) {
  return (
    <section className="border border-[#18352f]/15 bg-white/45 p-5">
      <div className="grid grid-cols-3 gap-px bg-[#18352f]/15 max-[680px]:grid-cols-1">
        <ProgressMetric
          label="世界遺産を読了"
          value={`${progress.readSites} / ${progress.totalSites}`}
        />
        <ProgressMetric
          label="読了した国"
          value={`${progress.readCountries} / ${progress.totalCountries}`}
        />
        <ProgressMetric
          label="世界全体の踏破率"
          value={`${progress.totalSites ? Math.round((progress.readSites / progress.totalSites) * 100) : 0}%`}
        />
      </div>
      <div className="mt-5 grid grid-cols-5 gap-3 max-[900px]:grid-cols-2">
        {progress.regions
          .filter((region) => region.name !== 'Unknown')
          .map((region) => (
            <div className="border-l-2 border-[#c98c47] pl-3" key={region.name}>
              <strong className="font-serif text-2xl">
                {region.percentage}%
              </strong>
              <p className="mt-1 text-[0.62rem] leading-4 text-[#18352f]/55">
                {region.name}
              </p>
            </div>
          ))}
      </div>
    </section>
  )
}

function ProgressMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#fbf8f1] p-4">
      <strong className="font-serif text-3xl">{value}</strong>
      <p className="mt-1 text-[0.65rem] text-[#18352f]/55">{label}</p>
    </div>
  )
}

function ProgressDashboardSkeleton() {
  return (
    <section className="border border-[#18352f]/15 bg-white/45 p-5">
      <div className="grid grid-cols-3 gap-px bg-[#18352f]/15 max-[680px]:grid-cols-1">
        {['世界遺産を読了', '読了した国', '世界全体の踏破率'].map((label) => (
          <div className="bg-[#fbf8f1] p-4" key={label}>
            <div className="h-9 w-24 animate-pulse bg-[#d6cec0]/70" />
            <p className="mt-1 text-[0.65rem] text-[#18352f]/55">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 h-16 animate-pulse bg-[#d6cec0]/45" />
    </section>
  )
}

function CountryProgress({ country }: { country: HeritageProgressItem }) {
  return (
    <section className="mt-4 border border-[#18352f]/15 bg-white/45 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.6rem] font-bold tracking-[0.14em] text-[#b85635]">
            COUNTRY PROGRESS
          </p>
          <h2 className="mt-1 font-serif text-2xl">{country.name}</h2>
        </div>
        <strong className="font-serif text-3xl">
          {country.read}/{country.total} · {country.percentage}%
        </strong>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 max-[680px]:grid-cols-1">
        {country.sites.map((site) => (
          <li
            className="border-b border-[#18352f]/10 pb-2 text-xs"
            key={site.uuid}
          >
            <Link
              className="flex gap-2 hover:text-[#b85635]"
              to={`/heritage/${site.uuid}`}
            >
              <span aria-hidden="true">{site.read ? '✓' : '○'}</span>
              <span>{site.nameEn}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function MapSiteCard({
  site,
  onClose,
}: {
  site: MapSiteDetails
  onClose: () => void
}) {
  return (
    <aside className="absolute right-4 bottom-4 z-20 w-[min(360px,calc(100%-32px))] border border-[#18352f]/20 bg-[#fbf8f1] p-5 shadow-[0_20px_55px_rgb(24_53_47_/_28%)]">
      <button
        aria-label="閉じる"
        className="absolute top-3 right-3 text-lg text-[#18352f]/45"
        onClick={onClose}
        type="button"
      >
        ×
      </button>
      <p className="text-[0.6rem] font-bold tracking-[0.12em] text-[#b85635]">
        {site.category} ·{' '}
        {site.readCount ? `READ × ${site.readCount}` : 'UNREAD'}
      </p>
      <h2 className="mt-2 pr-6 font-serif text-2xl leading-8">{site.nameEn}</h2>
      <p className="mt-2 text-xs text-[#18352f]/55">
        {site.statesNames.join(' / ')} · {site.dateInscribed ?? '—'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-[0.62rem] font-bold">
        {site.isFeatured && <span className="text-[#b85635]">★ 有名</span>}
        {site.isFavorite && (
          <span className="text-[#b85635]">♥ お気に入り</span>
        )}
        {site.isReadLater && (
          <span className="text-[#315f4c]">＋ 後で読む</span>
        )}
      </div>
      <Link
        className="mt-5 inline-block bg-[#18352f] px-5 py-2.5 text-xs font-bold text-white"
        to={`/heritage/${site.uuid}`}
      >
        この記事を読む →
      </Link>
    </aside>
  )
}
