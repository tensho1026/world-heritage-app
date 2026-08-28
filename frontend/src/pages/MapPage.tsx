import { useQuery } from '@tanstack/react-query'
import type { FeatureCollection, Point } from 'geojson'
import {
  type GeoJSONSource,
  Map as MapLibreMap,
  NavigationControl,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDiscoveryFilters, getMapHeritage } from '../api/discovery'
import { AppShell } from '../components/AppShell'
import { DiscoveryFiltersPanel } from '../components/DiscoveryFiltersPanel'
import { PageError } from '../components/AsyncState'
import type { DiscoveryFilters, DiscoverySite } from '../types'

const mapStyle =
  import.meta.env.VITE_MAP_STYLE_URL ||
  'https://tiles.openfreemap.org/styles/liberty'

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<MapLibreMap | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [draft, setDraft] = useState<DiscoveryFilters>({})
  const [applied, setApplied] = useState<DiscoveryFilters>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const filterOptions = useQuery({
    queryKey: ['discovery-filters'],
    queryFn: getDiscoveryFilters,
  })
  const sites = useQuery({
    queryKey: ['map-sites', applied],
    queryFn: () => getMapHeritage(applied),
  })
  const siteMap = useMemo(
    () => new Map((sites.data ?? []).map((site) => [site.uuid, site])),
    [sites.data],
  )
  const selected = selectedId ? siteMap.get(selectedId) : undefined

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return
    const map = new MapLibreMap({
      container: mapContainer.current,
      style: mapStyle,
      center: [10, 20],
      zoom: 1.35,
      minZoom: 1,
    })
    map.addControl(new NavigationControl(), 'top-right')
    map.on('load', () => setMapReady(true))
    mapInstance.current = map
    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstance.current
    if (!map || !mapReady || !sites.data) return
    const geoJson: FeatureCollection<Point> = {
      type: 'FeatureCollection',
      features: sites.data.flatMap((site) =>
        site.longitude === null || site.latitude === null
          ? []
          : [
              {
                type: 'Feature' as const,
                geometry: {
                  type: 'Point' as const,
                  coordinates: [site.longitude, site.latitude],
                },
                properties: {
                  uuid: site.uuid,
                  readCount: site.readCount,
                  isFeatured: site.isFeatured,
                },
              },
            ],
      ),
    }
    const source = map.getSource('heritage-sites') as GeoJSONSource | undefined
    if (source) {
      source.setData(geoJson)
      return
    }
    map.addSource('heritage-sites', {
      type: 'geojson',
      data: geoJson,
      cluster: true,
      clusterMaxZoom: 9,
      clusterRadius: 46,
    })
    map.addLayer({
      id: 'heritage-clusters',
      type: 'circle',
      source: 'heritage-sites',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#c98c47',
          20,
          '#b85635',
          80,
          '#18352f',
        ],
        'circle-radius': ['step', ['get', 'point_count'], 17, 20, 23, 80, 30],
        'circle-stroke-color': '#fbf8f1',
        'circle-stroke-width': 2,
      },
    })
    map.addLayer({
      id: 'heritage-cluster-count',
      type: 'symbol',
      source: 'heritage-sites',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-size': 12,
      },
      paint: { 'text-color': '#ffffff' },
    })
    map.addLayer({
      id: 'heritage-points',
      type: 'circle',
      source: 'heritage-sites',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'case',
          ['>', ['get', 'readCount'], 0],
          '#4f8871',
          '#d6cec0',
        ],
        'circle-radius': ['case', ['get', 'isFeatured'], 8, 6],
        'circle-stroke-color': [
          'case',
          ['get', 'isFeatured'],
          '#b85635',
          '#18352f',
        ],
        'circle-stroke-width': ['case', ['get', 'isFeatured'], 3, 1.5],
      },
    })

    map.on('click', 'heritage-clusters', async (event) => {
      const feature = map.queryRenderedFeatures(event.point, {
        layers: ['heritage-clusters'],
      })[0]
      const clusterId = Number(feature?.properties?.cluster_id)
      if (!feature || Number.isNaN(clusterId)) return
      const clusterSource = map.getSource('heritage-sites') as GeoJSONSource
      const zoom = await clusterSource.getClusterExpansionZoom(clusterId)
      const coordinates = (feature.geometry as Point).coordinates
      map.easeTo({ center: [coordinates[0], coordinates[1]], zoom })
    })
    map.on('click', 'heritage-points', (event) => {
      const feature = event.features?.[0]
      const uuid = feature?.properties?.uuid
      if (typeof uuid === 'string') setSelectedId(uuid)
    })
    for (const layer of ['heritage-clusters', 'heritage-points']) {
      map.on('mouseenter', layer, () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', layer, () => {
        map.getCanvas().style.cursor = ''
      })
    }
  }, [mapReady, sites.data])

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
          {selected && (
            <MapSiteCard site={selected} onClose={() => setSelectedId(null)} />
          )}
        </div>
        <p className="mt-3 text-[0.62rem] leading-5 text-[#18352f]/45">
          地図データ © OpenStreetMap
          contributors。背景地図の提供元は環境変数で変更できます。
        </p>
      </section>
    </AppShell>
  )
}

function MapSiteCard({
  site,
  onClose,
}: {
  site: DiscoverySite
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
