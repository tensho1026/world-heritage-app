import type { Dispatch, RefObject, SetStateAction } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { FeatureCollection, Point } from 'geojson'
import type {
  ExpressionSpecification,
  GeoJSONSource,
  Map as MapLibreMap,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { MapViewport } from '../api/discovery'
import type { HeritageMapProgress, MapSiteMarker } from '../types'

const mapStyle =
  import.meta.env.VITE_MAP_STYLE_URL ||
  'https://tiles.openfreemap.org/styles/liberty'
const countryGeoJsonUrl =
  import.meta.env.VITE_COUNTRY_GEOJSON_URL ||
  'https://raw.githubusercontent.com/datasets/geo-countries/main/data/countries.geojson'

export function useMapController() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<MapLibreMap | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [viewport, setViewport] = useState<MapViewport | null>(null)

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return
    let cancelled = false
    let map: MapLibreMap | null = null
    void import('maplibre-gl').then(
      ({ Map: MapLibreMapConstructor, NavigationControl }) => {
        if (cancelled || !mapContainer.current) return
        map = new MapLibreMapConstructor({
          container: mapContainer.current,
          style: mapStyle,
          center: [10, 20],
          zoom: 1.35,
          minZoom: 1,
        })
        map.addControl(new NavigationControl(), 'top-right')
        map.on('load', () => {
          setViewport(readViewport(map!))
          setMapReady(true)
        })
        let viewportTimer: number | undefined
        const updateViewport = () => {
          if (viewportTimer !== undefined) {
            window.clearTimeout(viewportTimer)
          }
          viewportTimer = window.setTimeout(() => {
            if (!cancelled) setViewport(readViewport(map!))
          }, 120)
        }
        map.on('moveend', updateViewport)
        mapInstance.current = map
        map.on('remove', () => {
          if (viewportTimer !== undefined) window.clearTimeout(viewportTimer)
        })
      },
    )
    return () => {
      cancelled = true
      map?.remove()
      if (mapInstance.current === map) mapInstance.current = null
    }
  }, [])

  return { mapContainer, mapInstance, mapReady, viewport }
}

export function useCountryProgressLayer(
  mapInstance: RefObject<MapLibreMap | null>,
  mapReady: boolean,
  progress: HeritageMapProgress | undefined,
  setSelectedCountryIso: Dispatch<SetStateAction<string>>,
) {
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !mapReady || !progress) return
    const matchValues = progress.countries.flatMap((country) => {
      if (!country.isoCode) return []
      const color =
        country.percentage === 100
          ? '#4f8871'
          : country.percentage > 0
            ? '#e7c778'
            : '#e9e2d6'
      return [country.isoCode, color]
    })
    const fillColor = [
      'match',
      ['get', 'ISO_A2'],
      ...matchValues,
      'rgba(214,206,192,0.18)',
    ] as unknown as ExpressionSpecification
    if (map.getLayer('country-progress-fill')) {
      map.setPaintProperty('country-progress-fill', 'fill-color', fillColor)
      return
    }
    map.addSource('country-progress', {
      type: 'geojson',
      data: countryGeoJsonUrl,
    })
    map.addLayer({
      id: 'country-progress-fill',
      type: 'fill',
      source: 'country-progress',
      paint: {
        'fill-color': fillColor,
        'fill-opacity': 0.46,
        'fill-outline-color': 'rgba(24,53,47,0.28)',
      },
    })
    map.on('click', 'country-progress-fill', (event) => {
      const isoCode = event.features?.[0]?.properties?.ISO_A2
      if (typeof isoCode === 'string' && isoCode !== '-99') {
        setSelectedCountryIso(isoCode)
      }
    })
    map.on('mouseenter', 'country-progress-fill', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'country-progress-fill', () => {
      map.getCanvas().style.cursor = ''
    })
  }, [mapInstance, mapReady, progress, setSelectedCountryIso])
}

export function useHeritageSitesLayer(
  mapInstance: RefObject<MapLibreMap | null>,
  mapReady: boolean,
  sites: MapSiteMarker[] | undefined,
  setSelectedId: Dispatch<SetStateAction<string | null>>,
) {
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !mapReady || !sites) return
    const geoJson: FeatureCollection<Point> = {
      type: 'FeatureCollection',
      features: sites.flatMap((site) =>
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
  }, [mapInstance, mapReady, setSelectedId, sites])
}

function readViewport(map: MapLibreMap): MapViewport {
  const bounds = map.getBounds()
  return {
    west: Number(bounds.getWest().toFixed(5)),
    south: Number(bounds.getSouth().toFixed(5)),
    east: Number(bounds.getEast().toFixed(5)),
    north: Number(bounds.getNorth().toFixed(5)),
  }
}
